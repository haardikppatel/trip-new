import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RuleConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveRules(tenantId: string): Promise<Record<string, number>> {
    const configs = await this.prisma.duplicateRuleConfig.findMany({
      where: {
        OR: [
          { tenantId },
          { tenantId: null }
        ],
        active: true
      },
      orderBy: { tenantId: 'asc' } // Tenant overrides global
    });

    const rules: Record<string, number> = {};
    for (const config of configs) {
      rules[config.ruleName] = config.weight;
    }

    // Defaults if not in DB
    return {
      EXACT_MATCH: rules['EXACT_MATCH'] ?? 60,
      NEAR_AMOUNT: rules['NEAR_AMOUNT'] ?? 25,
      SAME_RECEIPT_HASH: rules['SAME_RECEIPT_HASH'] ?? 80,
      SAME_MERCHANT_DAY: rules['SAME_MERCHANT_DAY'] ?? 30,
      SAME_MERCHANT_7_DAYS: rules['SAME_MERCHANT_7_DAYS'] ?? 40,
      IDENTICAL_FILENAME: rules['IDENTICAL_FILENAME'] ?? 10,
      FUZZY_TEXT: rules['FUZZY_TEXT'] ?? 20,
      THRESHOLD: rules['THRESHOLD'] ?? 70,
    };
  }
}
