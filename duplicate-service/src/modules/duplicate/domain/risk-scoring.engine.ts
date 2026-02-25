import { Injectable } from '@nestjs/common';
import { OpenSearchService } from '../infrastructure/opensearch.service';
import { RedisCacheService } from '../infrastructure/redis-cache.service';
import { RuleConfigService } from '../../config/application/rule-config.service';

@Injectable()
export class RiskScoringEngine {
  constructor(
    private readonly openSearch: OpenSearchService,
    private readonly redisCache: RedisCacheService,
    private readonly ruleConfig: RuleConfigService,
  ) {}

  async evaluate(claim: any, tenantId: string): Promise<{ score: number; triggeredRules: any[] }> {
    const rules = await this.ruleConfig.getActiveRules(tenantId);
    const recentClaims = await this.redisCache.getRecentClaims(tenantId, 30);
    
    let score = 0;
    const triggeredRules: any[] = [];

    for (const historical of recentClaims) {
      if (historical.id === claim.id) continue;

      const isSameEmployee = historical.employeeId === claim.employeeId;
      const isSameAmount = Number(historical.amount) === Number(claim.amount);
      const isSameCurrency = historical.currency === claim.currency;
      const isSameDate = new Date(historical.expenseDate).toDateString() === new Date(claim.expenseDate).toDateString();
      const isSameMerchant = historical.merchantName && claim.merchantName && historical.merchantName.toLowerCase() === claim.merchantName.toLowerCase();
      
      const amountDiffPercent = Math.abs(Number(historical.amount) - Number(claim.amount)) / Number(claim.amount);
      const isNearAmount = amountDiffPercent > 0 && amountDiffPercent <= 0.03;

      const daysDiff = Math.abs(new Date(historical.expenseDate).getTime() - new Date(claim.expenseDate).getTime()) / (1000 * 3600 * 24);

      // Exact Match
      if (isSameEmployee && isSameAmount && isSameCurrency && isSameDate) {
        score += rules.EXACT_MATCH;
        triggeredRules.push({ rule: 'EXACT_MATCH', weight: rules.EXACT_MATCH, matchedClaimId: historical.id, reason: 'Same employee, amount, currency, and date' });
      }

      // Near Amount
      if (isSameEmployee && isNearAmount && isSameCurrency && isSameDate) {
        score += rules.NEAR_AMOUNT;
        triggeredRules.push({ rule: 'NEAR_AMOUNT', weight: rules.NEAR_AMOUNT, matchedClaimId: historical.id, reason: 'Amount within ±3%' });
      }

      // Same Receipt Hash
      if (claim.receiptHash && historical.receiptHash === claim.receiptHash) {
        score += rules.SAME_RECEIPT_HASH;
        triggeredRules.push({ rule: 'SAME_RECEIPT_HASH', weight: rules.SAME_RECEIPT_HASH, matchedClaimId: historical.id, reason: 'Identical receipt file hash' });
      }

      // Same Merchant + Same Day
      if (isSameMerchant && isSameDate) {
        score += rules.SAME_MERCHANT_DAY;
        triggeredRules.push({ rule: 'SAME_MERCHANT_DAY', weight: rules.SAME_MERCHANT_DAY, matchedClaimId: historical.id, reason: 'Same merchant on the same day' });
      }

      // Same Merchant + Same Amount within 7 days
      if (isSameMerchant && isSameAmount && daysDiff <= 7 && daysDiff > 0) {
        score += rules.SAME_MERCHANT_7_DAYS;
        triggeredRules.push({ rule: 'SAME_MERCHANT_7_DAYS', weight: rules.SAME_MERCHANT_7_DAYS, matchedClaimId: historical.id, reason: 'Same merchant and amount within 7 days' });
      }

      // Identical Filename
      if (claim.attachmentFilename && historical.attachmentFilename === claim.attachmentFilename) {
        score += rules.IDENTICAL_FILENAME;
        triggeredRules.push({ rule: 'IDENTICAL_FILENAME', weight: rules.IDENTICAL_FILENAME, matchedClaimId: historical.id, reason: 'Identical attachment filename' });
      }
    }

    // Fuzzy Text Match via OpenSearch
    try {
      const fuzzyMatches = await this.openSearch.findFuzzyMatches(tenantId, claim.description);
      const validFuzzy = fuzzyMatches.filter(f => f.id !== claim.id && f.employeeId === claim.employeeId);
      if (validFuzzy.length > 0) {
        score += rules.FUZZY_TEXT;
        triggeredRules.push({ rule: 'FUZZY_TEXT', weight: rules.FUZZY_TEXT, matchedClaimId: validFuzzy[0].id, reason: 'Fuzzy text match on description' });
      }
    } catch (e) {
      console.warn('OpenSearch unavailable, skipping fuzzy match');
    }

    // Cap score at 100
    const finalScore = Math.min(score, 100);

    return { score: finalScore, triggeredRules };
  }
}
