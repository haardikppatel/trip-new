export interface PaymentBatchItem {
  claimId: string;
  amount: number;
  currency: string;
  bankDetails: any;
}

export interface PaymentBatchResult {
  batchReference: string;
  transactions: {
    claimId: string;
    externalTransactionId: string;
    status: 'INITIATED' | 'FAILED';
    failureReason?: string;
  }[];
}

export interface PaymentGatewayAdapter {
  initiateBatch(tenantId: string, items: PaymentBatchItem[]): Promise<PaymentBatchResult>;
  checkStatus(externalTransactionId: string): Promise<string>;
  verifyCallbackSignature(payload: any, signature: string): boolean;
}
