import * as fs from 'fs';
import * as path from 'path';

function getLatestDeploymentFile(): string | null {
  const dir = path.join(__dirname, '../../deploy/deployments');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  if (!files.length) return null;
  const sorted = files.sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]));
  return path.join(dir, sorted[sorted.length - 1]);
}

function main() {
  const file = getLatestDeploymentFile();
  if (!file) throw new Error('No deployments json found');
  const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as { rescueHelper: string };
  const envPath = path.join(__dirname, '../.env.local');
  const lines = [
    `VITE_RESCUE_HELPER_ADDRESS=${data.rescueHelper}`,
    `VITE_SOMNIA_RPC_URL=${process.env.SOMNIA_RPC_URL || ''}`,
  ].join('\n');
  fs.writeFileSync(envPath, lines + '\n');
  // eslint-disable-next-line no-console
  console.log('Wrote', envPath);
}

main();


