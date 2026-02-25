import { Injectable } from '@nestjs/common';
import { PaymentGatewayAdapter, PaymentBatchItem, PaymentBatchResult } from '../domain/payment-gateway.adapter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockPaymentAdapter implements PaymentGatewayAdapter {
  async initiateBatch(tenantId: string, items: PaymentBatchItem[]): Promise<PaymentBatchResult> {
    const transactions = items.map(item => ({
      claimId: item.claimId,
      externalTransactionId: `ext-txn-${uuidv4()}`,
      status: 'INITIATED' as const,
    }));

    return {
      batchReference: `batch-${uuidv4()}`,
      transactions,
    };
  }

  async checkStatus(externalTransactionId: string): Promise<string> {
    return 'SUCCESS';
  }

  verifyCallbackSignature(payload: any, signature: string): boolean {
    // Mock signature verification
    return signature === 'valid-signature';
  }
}
