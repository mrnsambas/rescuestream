// Thin wrapper to abstract SDS writes with retries
import { setTimeout as sleep } from 'timers/promises';
import { SomniaStreamsClient } from 'somnia-streams-sdk';

export type PositionEntry = {
  positionId: string;
  owner: string;
  protocol?: string;
  collateralToken?: string;
  debtToken?: string;
  collateralAmount: string;
  debtAmount: string;
  collateralValueUSD?: string;
  debtValueUSD?: string;
  healthFactor: string; // 1e18 scale
  liquidationThreshold?: string;
  lastUpdatedAt: number;
  status?: string;
};

export class SomniaStreamsClientWrapper {
  private client: SomniaStreamsClient;
  constructor(apiKey: string) {
    this.client = new SomniaStreamsClient({ apiKey });
  }

  async writeWithRetry(schema: string, payload: PositionEntry, attempts = 5): Promise<void> {
    let delayMs = 250;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < attempts; i++) {
      try {
        // @ts-ignore assumed SDK shape
        await this.client.write(schema, payload);
        return;
      } catch (e) {
        if (i === attempts - 1) throw e;
        await sleep(delayMs);
        delayMs = Math.min(delayMs * 2, 5000);
      }
    }
  }
}


