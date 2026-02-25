import { Test, TestingModule } from '@nestjs/testing';
import { RiskScoringEngine } from '../src/modules/duplicate/domain/risk-scoring.engine';
import { RuleConfigService } from '../src/modules/config/application/rule-config.service';
import { OpenSearchService } from '../src/modules/duplicate/infrastructure/opensearch.service';
import { RedisCacheService } from '../src/modules/duplicate/infrastructure/redis-cache.service';

describe('Duplicate Detection Risk Engine', () => {
  let engine: RiskScoringEngine;

  const mockRules = {
    EXACT_MATCH: 60,
    NEAR_AMOUNT: 25,
    SAME_RECEIPT_HASH: 80,
    SAME_MERCHANT_DAY: 30,
    SAME_MERCHANT_7_DAYS: 40,
    IDENTICAL_FILENAME: 10,
    FUZZY_TEXT: 20,
    THRESHOLD: 70,
  };

  const mockRedis = {
    getRecentClaims: jest.fn(),
  };

  const mockOpenSearch = {
    findFuzzyMatches: jest.fn().mockResolvedValue([]),
  };

  const mockConfig = {
    getActiveRules: jest.fn().mockResolvedValue(mockRules),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskScoringEngine,
        { provide: RuleConfigService, useValue: mockConfig },
        { provide: OpenSearchService, useValue: mockOpenSearch },
        { provide: RedisCacheService, useValue: mockRedis },
      ],
    }).compile();

    engine = module.get<RiskScoringEngine>(RiskScoringEngine);
  });

  it('should score 60 for exact match (amount, currency, date, employee)', async () => {
    const claim = { id: 'c1', employeeId: 'e1', amount: 100, currency: 'USD', expenseDate: '2026-02-20T10:00:00Z' };
    mockRedis.getRecentClaims.mockResolvedValueOnce([
      { id: 'c2', employeeId: 'e1', amount: 100, currency: 'USD', expenseDate: '2026-02-20T14:00:00Z' }
    ]);

    const result = await engine.evaluate(claim, 'tenant-1');
    expect(result.score).toBe(60);
    expect(result.triggeredRules[0].rule).toBe('EXACT_MATCH');
  });

  it('should score 80 for same receipt hash', async () => {
    const claim = { id: 'c1', employeeId: 'e1', amount: 100, currency: 'USD', expenseDate: '2026-02-20T10:00:00Z', receiptHash: 'hash123' };
    mockRedis.getRecentClaims.mockResolvedValueOnce([
      { id: 'c2', employeeId: 'e2', amount: 50, currency: 'EUR', expenseDate: '2026-02-10T10:00:00Z', receiptHash: 'hash123' }
    ]);

    const result = await engine.evaluate(claim, 'tenant-1');
    expect(result.score).toBe(80);
    expect(result.triggeredRules[0].rule).toBe('SAME_RECEIPT_HASH');
  });

  it('should cap score at 100', async () => {
    const claim = { id: 'c1', employeeId: 'e1', amount: 100, currency: 'USD', expenseDate: '2026-02-20T10:00:00Z', receiptHash: 'hash123' };
    mockRedis.getRecentClaims.mockResolvedValueOnce([
      { id: 'c2', employeeId: 'e1', amount: 100, currency: 'USD', expenseDate: '2026-02-20T14:00:00Z', receiptHash: 'hash123' }
    ]);

    const result = await engine.evaluate(claim, 'tenant-1');
    // EXACT_MATCH (60) + SAME_RECEIPT_HASH (80) = 140 -> Capped at 100
    expect(result.score).toBe(100);
    expect(result.triggeredRules.length).toBe(2);
  });

  it('should score 40 for same merchant and amount within 7 days', async () => {
    const claim = { id: 'c1', employeeId: 'e1', amount: 50, currency: 'USD', expenseDate: '2026-02-20T10:00:00Z', merchantName: 'Uber' };
    mockRedis.getRecentClaims.mockResolvedValueOnce([
      { id: 'c2', employeeId: 'e2', amount: 50, currency: 'USD', expenseDate: '2026-02-15T10:00:00Z', merchantName: 'Uber' }
    ]);

    const result = await engine.evaluate(claim, 'tenant-1');
    expect(result.score).toBe(40);
    expect(result.triggeredRules[0].rule).toBe('SAME_MERCHANT_7_DAYS');
  });
});
