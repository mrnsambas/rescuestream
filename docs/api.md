# RescueStream API Documentation

## Overview

The RescueStream relayer exposes a REST API for querying metrics, bot status, price oracle data, and transaction history.

**Base URL**: `http://localhost:8080` (configurable via `PORT` environment variable)

## Endpoints

### Health & Metrics

#### GET /healthz

Simple health check endpoint.

**Response:**
```
200 OK
ok
```

#### GET /metrics

Get relayer metrics and statistics.

**Response:**
```json
{
  "writeCount": 1234,
  "failureCount": 5,
  "lastErrorTs": 1699123456,
  "startTs": 1699000000,
  "wsConnected": true,
  "lastEventBlock": 12345
}
```

**Fields:**
- `writeCount`: Number of successful position writes to streams
- `failureCount`: Number of failed writes
- `lastErrorTs`: Timestamp of last error (Unix seconds)
- `startTs`: Relayer start timestamp (Unix seconds)
- `wsConnected`: Whether WebSocket connection is active
- `lastEventBlock`: Last processed block number

### Price Oracle

#### GET /oracle/stats

Get price cache statistics.

**Response:**
```json
{
  "size": 5,
  "entries": [
    {
      "token": "0x123...",
      "age": 120000,
      "source": "oracle",
      "staleness": 30
    }
  ]
}
```

#### GET /oracle/price/:tokenAddress

Get current price for a token.

**Parameters:**
- `tokenAddress` (path): Token address
- `type` (query, optional): `collateral` or `debt` (default: `collateral`)

**Response:**
```json
{
  "tokenAddress": "0x123...",
  "price": "2000000000000000000",
  "source": {
    "priceUSD": "2000000000000000000",
    "timestamp": 1699123456,
    "source": "oracle",
    "staleness": 30
  }
}
```

#### POST /oracle/refresh/:tokenAddress

Force refresh price for a token (bypass cache).

**Parameters:**
- `tokenAddress` (path): Token address

**Body:**
```json
{
  "type": "collateral"
}
```

**Response:**
```json
{
  "tokenAddress": "0x123...",
  "price": "2000000000000000000",
  "refreshed": true
}
```

### Bot Management

#### GET /bot/status

Get current bot status and configuration.

**Response:**
```json
{
  "enabled": true,
  "lastCheck": 1699123456,
  "rescuesExecuted": 5,
  "lastRescueTime": 1699123400,
  "errors": 0,
  "lastError": null
}
```

#### GET /bot/history

Get bot rescue execution history.

**Response:**
```json
{
  "history": [
    {
      "positionId": "0xabc...",
      "timestamp": 1699123400,
      "txHash": "0xdef..."
    }
  ]
}
```

#### POST /bot/config

Update bot configuration.

**Body:**
```json
{
  "enabled": true,
  "autoRescue": true,
  "minHealthFactor": "1.0",
  "maxTopUpAmount": "100000000000000000",
  "rateLimit": {
    "maxRescuesPerHour": 10,
    "minDelayBetweenRescues": 300
  },
  "monitoredPositions": ["0x123...", "0x456..."]
}
```

**Response:**
```json
{
  "success": true,
  "config": {
    "enabled": true,
    "lastCheck": null,
    "rescuesExecuted": 0,
    "lastRescueTime": null,
    "errors": 0,
    "lastError": null
  }
}
```

### Transaction History

#### GET /transactions

Get transaction history with filtering and pagination.

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `positionId` (optional): Filter by position ID
- `owner` (optional): Filter by owner address

**Response:**
```json
{
  "transactions": [
    {
      "txHash": "0xabc...",
      "positionId": "0x123...",
      "owner": "0xdef...",
      "timestamp": 1699123456,
      "status": "confirmed",
      "blockNumber": 12345
    }
  ],
  "total": 50,
  "limit": 100,
  "offset": 0
}
```

#### POST /transactions

Record a new transaction.

**Body:**
```json
{
  "txHash": "0xabc...",
  "positionId": "0x123...",
  "owner": "0xdef...",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "txHash": "0xabc...",
    "positionId": "0x123...",
    "owner": "0xdef...",
    "timestamp": 1699123456,
    "status": "pending"
  }
}
```

#### POST /transactions/:txHash/update

Update transaction status by fetching from blockchain.

**Parameters:**
- `txHash` (path): Transaction hash

**Response:**
```json
{
  "success": true,
  "transaction": {
    "txHash": "0xabc...",
    "positionId": "0x123...",
    "owner": "0xdef...",
    "timestamp": 1699123456,
    "status": "confirmed",
    "blockNumber": 12345
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables

The relayer requires the following environment variables:

- `SOMNIA_RPC_URL`: RPC endpoint URL (required)
- `SOMNIA_WS_URL`: WebSocket RPC URL (optional)
- `LENDING_ADDR`: LendingAdapter contract address (required)
- `RESCUE_HELPER_ADDR`: RescueHelper contract address (optional, for bot)
- `PRIVATE_KEY`: Private key for stream writes (required)
- `PORT`: HTTP server port (default: 8080)
- `LOG_LEVEL`: Logging level (default: info)

**Price Oracle Configuration:**
- `CHAINLINK_<TOKEN_ADDRESS>_AGGREGATOR`: Chainlink aggregator address for token
- `UNISWAP_V2_<TOKEN_ADDRESS>_<QUOTE_TOKEN>_PAIR`: Uniswap V2 pair address
- `UNISWAP_V3_<TOKEN_ADDRESS>_<QUOTE_TOKEN>_POOL_<FEE>`: Uniswap V3 pool address

**Bot Configuration:**
- `BOT_ENABLED`: Enable bot (true/false)
- `BOT_AUTO_RESCUE`: Enable auto-rescue (true/false)
- `BOT_MIN_HEALTH_FACTOR`: Minimum health factor threshold
- `BOT_MAX_TOP_UP`: Maximum top-up amount in wei
- `BOT_MAX_RESCUES_PER_HOUR`: Rate limit
- `BOT_MIN_DELAY`: Minimum delay between rescues (seconds)
- `BOT_MONITORED_POSITIONS`: Comma-separated list of position IDs to monitor
- `BOT_PRIVATE_KEY`: Bot wallet private key

## Example Usage

### Fetch Metrics

```bash
curl http://localhost:8080/metrics
```

### Get Token Price

```bash
curl http://localhost:8080/oracle/price/0x123...?type=collateral
```

### Update Bot Configuration

```bash
curl -X POST http://localhost:8080/bot/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "autoRescue": true,
    "minHealthFactor": "1.0",
    "maxTopUpAmount": "100000000000000000"
  }'
```

### Get Transaction History

```bash
curl "http://localhost:8080/transactions?limit=10&offset=0&positionId=0x123..."
```

