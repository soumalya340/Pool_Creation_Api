# Meteora Bonding Curve API

An Express.js API server for creating and managing Meteora bonding curve pools on Solana.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your private key:

```env
PRIVATE_KEY=your_base58_private_key_here
PORT=3000
```

3. Start the server:

```bash
npm start
```

## API Endpoints

### Health Check

- **GET** `/health` - Check if the API is running
- **GET** `/` - Welcome message with available endpoints

### Pool Management

#### Create Pool

- **POST** `/api/pool/create`
- Creates both a config and a pool in sequence
- **Body:**

```json
{
  "privateKey": "base58_encoded_private_key",
  "payer": "payer_public_key_address",
  "poolData": {
    "name": "POOL_NAME",
    "symbol": "SYMBOL",
    "uri": "metadata_uri"
  }
}
```

- **Response:**

```json
{
  "success": true,
  "message": "Config and pool created successfully",
  "data": {
    "wallet": "wallet_address",
    "payer": "payer_address",
    "config": {
      "address": "config_address",
      "transactionSignature": "signature",
      "explorerUrl": "solscan_url"
    },
    "pool": {
      "address": "pool_address",
      "transactionSignature": "signature",
      "explorerUrl": "solscan_url"
    }
  }
}
```

#### Get Pool Information

- **GET** `/api/pool/info/:configAddress`
- Retrieves pool information and progress by config address
- **Response:**

```json
{
  "success": true,
  "message": "Pool information retrieved successfully",
  "data": {
    "config": {
      "address": "config_address"
    },
    "pool": {
      "address": "pool_address",
      "progress": {
        "decimal": 0.1234,
        "percentage": "12.3400%"
      }
    },
    "metadata": {
      "totalPools": 1,
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "allPools": [...]
  }
}
```

#### Get Pool Progress

- **GET** `/api/pool/progress/:poolAddress`
- Get progress for a specific pool address
- **Response:**

```json
{
  "success": true,
  "message": "Pool progress retrieved successfully",
  "data": {
    "pool": {
      "address": "pool_address",
      "progress": {
        "decimal": 0.1234,
        "percentage": "12.3400%"
      }
    },
    "metadata": {
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Architecture

- **`index.js`** - Main Express server entry point
- **`routes/create_pool.js`** - Handles pool creation (integrates createConfig.js and createPool.js logic)
- **`routes/get_pool_info.js`** - Handles pool information retrieval (integrates getPool.js logic)
- **`package.json`** - Dependencies and scripts

## Dependencies

- **Express.js** - Web framework
- **@solana/web3.js** - Solana JavaScript SDK
- **@meteora-ag/dynamic-bonding-curve-sdk** - Meteora SDK
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables
- **bs58** - Base58 encoding/decoding

## Networks

- **Development**: Solana Devnet (for pool creation)
- **Production**: Solana Mainnet (for pool information retrieval)

## Error Handling

The API includes comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (invalid parameters)
- `404` - Not Found (pool not found)
- `500` - Internal Server Error (processing errors)
