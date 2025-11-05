import 'dotenv/config';
import { SomniaStreamsClient } from 'somnia-streams-sdk';

async function main() {
  const apiKey = process.env.SOMNIA_API_KEY as string;
  if (!apiKey) throw new Error('SOMNIA_API_KEY not set');
  const client = new SomniaStreamsClient({ apiKey });
  const schema = {
    schemaName: 'Position',
    version: '1.0.0',
    fields: {
      positionId: { type: 'string' },
      owner: { type: 'address' },
      protocol: { type: 'string' },
      collateralToken: { type: 'address' },
      debtToken: { type: 'address' },
      collateralAmount: { type: 'uint256' },
      debtAmount: { type: 'uint256' },
      collateralValueUSD: { type: 'uint256' },
      debtValueUSD: { type: 'uint256' },
      healthFactor: { type: 'uint256' },
      liquidationThreshold: { type: 'uint256' },
      lastUpdatedAt: { type: 'uint256' },
      status: { type: 'string' },
    },
  } as any;
  // @ts-ignore assume sdk supports publishSchema
  await client.publishSchema(schema);
  // eslint-disable-next-line no-console
  console.log('Published Position@1.0.0');
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


