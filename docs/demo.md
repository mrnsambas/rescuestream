# Demo Script

1. Start relayer (local):
   - Set `SOMNIA_RPC_URL`, `LENDING_ADDR` in env
   - Run: `npm run dev --workspace rescuestream/relayer`
2. Start frontend:
   - `npm run dev --workspace rescuestream/frontend`
3. Simulate a rescue:
   - Update a position (via Hardhat script or adapter)
   - Observe live stream entries; click Rescue on at-risk
4. Show tx hash and UI update.

