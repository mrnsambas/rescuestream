# Docs

- Architecture overview
- Demo script
- Diagrams
- Environments

## Environments

Relayer (.env):
- SOMNIA_RPC_URL= https RPC for Somnia Testnet (see documentation.md)
- PRIVATE_KEY= 0x...

Frontend (.env.local):
- VITE_SOMNIA_RPC_URL= https RPC for Somnia Testnet
- VITE_POSITION_SCHEMA_ID= 0x...
- VITE_POSITION_PUBLISHER= 0x...
- VITE_RESCUE_HELPER_ADDRESS= 0x...

Schema Ops:
- Use `rescuestream/relayer/scripts/publishSchema.ts` to register Position schema.
- Position writes produce deterministic dataId from positionId.

