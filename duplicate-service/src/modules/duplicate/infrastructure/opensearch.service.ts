import { Injectable } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class OpenSearchService {
  private readonly client: Client;

  constructor() {
    this.client = new Client({
      node: process.env.OPENSEARCH_URL || 'http://localhost:9200',
    });
  }

  async indexClaim(claim: any): Promise<void> {
    await this.client.index({
      index: `claims-${claim.tenantId.toLowerCase()}`,
      id: claim.id,
      body: {
        tenantId: claim.tenantId,
        employeeId: claim.employeeId,
        amount: claim.amount,
        expenseDate: claim.expenseDate,
        merchantName: claim.merchantName,
        description: claim.description,
        receiptHash: claim.receiptHash,
        attachmentFilename: claim.attachmentFilename,
      },
    });
  }

  async findFuzzyMatches(tenantId: string, description: string): Promise<any[]> {
    if (!description) return [];

    const response = await this.client.search({
      index: `claims-${tenantId.toLowerCase()}`,
      body: {
        query: {
          match: {
            description: {
              query: description,
              fuzziness: 'AUTO',
            },
          },
        },
      },
    });

    return response.body.hits.hits.map((hit: any) => hit._source);
  }
}
