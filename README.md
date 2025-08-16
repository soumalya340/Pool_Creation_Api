# Launchpad API

An Express.js API server for creating and managing bonding curve pools on Solana.

## Setup

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Create a `.env` file with the required environment variables:

```env
# Solana RPC URL (Required)
RPC_URL="https://devnet.helius-rpc.com/?api-key=your-api-key"

# Solana Private Key (base58 encoded) - Required for transactions
PRIVATE_KEY="your_base58_private_key_here"

# Server Configuration
PORT=3000

# Network Configuration
CLUSTER="devnet"
```

3. Start the server:

```bash
npm start
# or
node index.js
```

## API Endpoints

### Root Endpoint

- **GET** `/` - Welcome message with available endpoints

**Response:**

```json
{
  "message": "Welcome to Meteora Bonding Curve API",
  "endpoints": {
    "createPool": "POST /api/pool/create",
    "getPoolInfo": "GET /api/pool/info/poolProgression/:configAddress"
  }
}
```

### Pool Management

#### Create Pool

- **POST** `/api/pool/create`
- Creates both a config and a pool in sequence
- **Required Body Parameters:**

```json
{
  "feeclaimer": "feeclaimer_public_key_address",
  "quoteThreshold": 15000000,
  "poolData": {
    "name": "Test Pool",
    "symbol": "TEST",
    "uri": "https://example.com/metadata.json"
  }
}
```

**Field Descriptions:**

- `feeclaimer`: Solana public key address that will receive fees
- `quoteThreshold`: Migration threshold value (number)
- `poolData.name`: Name of the token/pool
- `poolData.symbol`: Symbol of the token
- `poolData.uri`: Metadata URI for the token

**Success Response:**

```json
{
  "success": true,
  "message": "Config and pool created successfully",
  "data": {
    "wallet": "wallet_address",
    "feeclaimer": "feeclaimer_address",
    "config": {
      "config_address": "config_address",
      "transactionSignature": "signature_hash",
      "explorerUrl": "https://solscan.io/tx/signature?cluster=devnet"
    },
    "pool": {
      "address": "pool_address",
      "transactionSignature": "signature_hash",
      "explorerUrl": "https://solscan.io/tx/signature?cluster=devnet"
    },
    "solSpent": 0.123
  }
}
```

#### Get Pool Progress

- **GET** `/api/pool/info/poolProgression/:configAddress`
- Get progress information for a specific config address
- **URL Parameter:** `configAddress` - The config address returned from pool creation

**Success Response:**

```json
{
  "success": true,
  "message": "Pool progress retrieved successfully",
  "data": {
    "pool": {
      "address": "pool_address",
      "progress": {
        "progress": 0.1234,
        "progressInPercent": "12.3400%"
      }
    },
    "metadata": {
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Example Usage

### Using cURL

**Create Pool:**

```bash
curl -X POST http://localhost:3000/api/pool/create \
  -H "Content-Type: application/json" \
  -d '{
    "feeclaimer": "CvBMs2LEp8KbfCvPNMawR5cFyQ1k9ac7xrtCoxu1Y2gH",
    "quoteThreshold": 15000000,
    "poolData": {
      "name": "Test Token",
      "symbol": "TEST",
      "uri": "https://example.com/metadata.json"
    }
  }'
```

**Get Pool Progress:**

```bash
curl http://localhost:3000/api/pool/info/poolProgression/YOUR_CONFIG_ADDRESS_HERE
```

### Using REST Client (test.rest)

```rest
### Create Pool
POST http://localhost:3000/api/pool/create
Content-Type: application/json

{
  "feeclaimer": "CvBMs2LEp8KbfCvPNMawR5cFyQ1k9ac7xrtCoxu1Y2gH",
  "quoteThreshold": 15000000,
  "poolData": {
    "name": "Test Pool",
    "symbol": "TEST",
    "uri": "https://example.com/metadata.json"
  }
}

### Get Pool Progress
GET http://localhost:3000/api/pool/info/poolProgression/CONFIG_ADDRESS_HERE
```

## Architecture

- **`index.js`** - Main Express server entry point with CORS, middleware, and route setup
- **`routes/create_pool.js`** - Handles complete pool creation flow (config + pool creation)
- **`routes/get_pool_info.js`** - Handles pool progress retrieval by config address
- **`package.json`** - Dependencies and npm scripts
- **`test.rest`** - REST API testing file for development

## Dependencies

- **Express.js** - Web framework
- **@solana/web3.js** - Solana JavaScript SDK
- **@meteora-ag/dynamic-bonding-curve-sdk** - Meteora bonding curve SDK
- **cors** - Cross-origin resource sharing middleware
- **dotenv** - Environment variables loader
- **bs58** - Base58 encoding/decoding for Solana keys
- **bn.js** - Big number arithmetic

## Network Support

Configurable via `CLUSTER` environment variable:

- **devnet** - Solana Devnet (default for testing)
- **mainnet** - Solana Mainnet (production)

Explorer URLs automatically adjust based on the cluster setting.

## Error Handling

The API includes comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (missing or invalid parameters)
- `404` - Not Found (route not found)
- `500` - Internal Server Error (blockchain or processing errors)

**Error Response Format:**

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "details": "Additional error context"
}
```

## Environment Variables

| Variable      | Required | Description                                 | Example                         |
| ------------- | -------- | ------------------------------------------- | ------------------------------- |
| `RPC_URL`     | Yes      | Solana RPC endpoint URL                     | `https://api.devnet.solana.com` |
| `PRIVATE_KEY` | Yes      | Base58 encoded private key for transactions | `your_private_key_here`         |
| `PORT`        | No       | Server port (default: 3000)                 | `3000`                          |
| `CLUSTER`     | No       | Solana cluster (default: devnet)            | `devnet` or `mainnet`           |

## Development

For development, you can use the included `test.rest` file with a REST client extension in VS Code or similar tools to test the API endpoints.

The server includes automatic restart capabilities when using `nodemon` for development.
