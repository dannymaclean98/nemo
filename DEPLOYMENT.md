# 🚀 Nemo Smart Contract Deployment Guide

This guide will walk you through deploying the Nemo NFT photo album smart contract to the Base network.

## 📋 Prerequisites

1. **Node.js** (version 18+)
2. **A wallet with ETH on Base** (for gas fees)
3. **WalletConnect Project ID** (for frontend)
4. **BaseScan API Key** (optional, for contract verification)

## 🔧 Setup Environment

1. **Copy environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in your environment variables:**
   ```bash
   # WalletConnect Project ID
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
   
   # Your wallet private key (NEVER commit this!)
   PRIVATE_KEY=your_private_key_here
   
   # BaseScan API key (optional)
   BASESCAN_API_KEY=your_basescan_api_key_here
   ```

## 🏗️ Compile Contracts

```bash
npm run compile
```

This will:
- Compile the Solidity contracts
- Generate TypeScript types
- Create deployment artifacts

## 🧪 Run Tests (Optional)

```bash
npm run test
```

## 🌐 Deploy to Networks

### Local Testing
```bash
# Start local Hardhat node
npm run node

# In another terminal, deploy to local network
npm run deploy:local
```

### Base Sepolia Testnet (Recommended for testing)
```bash
npm run deploy:base-sepolia
```

### Base Mainnet (Production)
```bash
npm run deploy:base
```

## ✅ Verify Contract (Optional)

After deployment, verify your contract on BaseScan:

```bash
# For Base Sepolia
npm run verify:base-sepolia <CONTRACT_ADDRESS>

# For Base Mainnet  
npm run verify:base <CONTRACT_ADDRESS>
```

## 📁 Deployment Artifacts

After deployment, you'll find:

1. **Contract address** in the console output
2. **Deployment info** saved in `deployments/<network>-deployment.json`
3. **Frontend config** auto-generated at `src/lib/contract-config.ts`

## 🔗 Getting Base ETH

### For Base Sepolia (Testnet):
1. Get Sepolia ETH from faucets like:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
2. Bridge to Base Sepolia using the [Base Bridge](https://bridge.base.org/)

### For Base Mainnet:
1. Buy ETH on Coinbase or other exchanges
2. Bridge to Base using the [Base Bridge](https://bridge.base.org/)

## 🎯 Contract Features

The deployed contract supports:

- **`createAlbum()`** - Mint multiple photos as an album
- **`getAlbum()`** - Get album details
- **`getUserAlbums()`** - Get all albums for a user
- **`totalAlbums()`** / **`totalPhotos()`** - Get statistics

## 🔍 Viewing Your Contract

After deployment, you can view your contract on:

- **Base Sepolia**: https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS
- **Base Mainnet**: https://basescan.org/address/YOUR_CONTRACT_ADDRESS

## 🚨 Security Notes

1. **NEVER commit your private key to git**
2. **Use a separate wallet for development**
3. **Test thoroughly on testnets before mainnet**
4. **Keep your BaseScan API key private**

## 📞 Troubleshooting

### Common Issues:

1. **"Insufficient funds"** - Make sure you have enough ETH for gas
2. **"Nonce too high"** - Reset your wallet nonce in MetaMask
3. **"Contract verification failed"** - Check that the contract source matches

### Get Help:
- Check the [Hardhat documentation](https://hardhat.org/docs)
- Ask questions in the [Base Discord](https://base.org/discord)

## 🎉 Next Steps

After successful deployment:

1. ✅ Update your frontend to use the real contract address
2. ✅ Test minting some NFTs
3. ✅ Set up IPFS integration for real photo storage
4. ✅ Deploy to production!

---

**Happy minting! 📸✨**

## Environment Configuration

The application supports deployment to different networks based on environment variables:

### Development (Base Sepolia)
```bash
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_SEPOLIA=0x2C64555E4F0Ba96fb193efCb3797ebF56123ab2F
```

### Production (Base Mainnet) 
```bash
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=0x6692e79CC2F109B692263E044FB37F2c09A9F9E3
```

## Vercel Deployment

### Environment Variables Setup

For **Development/Preview** deployments:
```
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE_SEPOLIA=your_base_sepolia_contract_address
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
```

For **Production** deployments:
```
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_CONTRACT_ADDRESS_BASE=your_base_mainnet_contract_address
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
PINATA_JWT=your_pinata_jwt_token
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
```

### Deploy Commands

1. **Development/Preview**: Automatically uses Base Sepolia when `NEXT_PUBLIC_ENVIRONMENT=development`
2. **Production**: Uses Base Mainnet when `NEXT_PUBLIC_ENVIRONMENT=production`

### Network Selection Logic

The contract address is automatically selected based on `NEXT_PUBLIC_ENVIRONMENT`:

```typescript
// Production uses Base Mainnet (Chain ID 8453)
if (environment === 'production') {
  return CONTRACT_ADDRESSES[8453]; // Base Mainnet
} else {
  return CONTRACT_ADDRESSES[84532]; // Base Sepolia
}
```

## Contract Deployment

### Base Sepolia (Testnet)
```bash
npm run deploy:base-sepolia
```

### Base Mainnet (Production)
```bash 
npm run deploy:base
```

Make sure to update the respective environment variables after deploying new contracts.

## Quick Setup

1. Copy `env.example` to `.env.local`
2. Set your environment variables
3. Deploy or verify contract addresses
4. Deploy to Vercel with appropriate environment variables

## Network Information

- **Base Sepolia**: Chain ID 84532 (Testnet)
- **Base Mainnet**: Chain ID 8453 (Production)

The application automatically connects to the correct network based on your environment configuration. 