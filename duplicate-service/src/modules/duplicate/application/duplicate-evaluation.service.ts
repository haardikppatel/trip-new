import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RiskScoringEngine } from '../domain/risk-scoring.engine';
import { DuplicatePublisher } from '../infrastructure/duplicate.publisher';
import { RuleConfigService } from '../../config/application/rule-config.service';
import { OpenSearchService } from '../infrastructure/opensearch.service';
import { RedisCacheService } from '../infrastructure/redis-cache.service';

@Injectable()
export class DuplicateEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringEngine: RiskScoringEngine,
    private readonly publisher: DuplicatePublisher,
    private readonly ruleConfig: RuleConfigService,
    private readonly openSearch: OpenSearchService,
    private readonly redisCache: RedisCacheService,
  ) {}

  async evaluateClaim(claim: any, correlationId: string): Promise<void> {
    const tenantId = claim.tenantId;

    // Idempotency check
    const existing = await this.prisma.duplicateEvaluation.findUnique({
      where: { tenantId_claimId: { tenantId, claimId: claim.id } }
    });
    if (existing) return;

    const { score, triggeredRules } = await this.scoringEngine.evaluate(claim, tenantId);
    const rules = await this.ruleConfig.getActiveRules(tenantId);
    const threshold = rules.THRESHOLD;
    const duplicateDetected = score >= threshold;

    await this.prisma.$transaction(async (tx) => {
      // Append-only evaluation record
      await tx.duplicateEvaluation.create({
        data: {
          tenantId,
          claimId: claim.id,
          riskScore: score,
          duplicateDetected,
          triggeredRules: JSON.stringify(triggeredRules),
        }
      });

      // Update ExpenseClaim (if shared DB)
      await tx.expenseClaim.update({
        where: { id: claim.id },
        data: {
          duplicateRiskScore: score,
          duplicateDetected,
          duplicateEvaluatedAt: new Date(),
        }
      });
    });

    // Update caches
    await this.redisCache.cacheClaim(claim);
    try {
      await this.openSearch.indexClaim(claim);
    } catch (e) {
      console.warn('Failed to index claim in OpenSearch', e);
    }

    // Emit Event
    this.publisher.publishEvaluationCompleted({
      claimId: claim.id,
      tenantId,
      riskScore: score,
      duplicateDetected,
      triggeredRules,
      correlationId,
    });
  }

  async getHistory(claimId: string, tenantId: string) {
    return this.prisma.duplicateEvaluation.findUnique({
      where: { tenantId_claimId: { tenantId, claimId } }
    });
  }
}
