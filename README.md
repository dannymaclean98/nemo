# Nemo - NFT Photo Albums

Transform your memories into immutable NFT collections on the Base network. Nemo provides a seamless experience for minting photo albums as ERC1155 NFTs with minimal fees and maximum security.

## 🎯 Features

- **Photo Album NFTs**: Upload photos and mint them as a collection (single or multiple photos)
- **Individual Photo Tokens**: Each photo becomes its own ERC1155 token visible in wallets
- **IPFS Storage**: Decentralized storage via Pinata
- **Base Network**: Built on Base for low-cost transactions
- **Modern UI**: Clean, responsive interface with drag-and-drop upload
- **HEIC Support**: Supports HEIC files from iPhone cameras

## 💰 Pricing

- **Album Creation**: 0.00001 ETH per photo (~$0.0001 each)
- **Gas Fees**: ~0.001 ETH per transaction

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Base Sepolia ETH for testing (get from [faucets](https://docs.base.org/tools/network-faucets))

### Installation
```bash
git clone <your-repo>
cd nemo
npm install
```

### Environment Setup
Copy the example environment file and configure:
```bash
cp env.example .env.local
```

Edit `.env.local` and add:
- `PRIVATE_KEY`: Your wallet private key for contract deployment
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`: Get from [WalletConnect Cloud](https://cloud.walletconnect.com/)
- `BASESCAN_API_KEY`: Get from [BaseScan](https://basescan.org/apis) (optional)
- `NEXT_PUBLIC_PINATA_JWT_TOKEN`: Get from [Pinata](https://pinata.cloud/)

### Smart Contract Deployment

First, get Base Sepolia testnet ETH from a faucet:
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Chainlink Faucet](https://faucets.chain.link/base-sepolia)
- [Alchemy Faucet](https://www.alchemy.com/faucets/base-sepolia-faucet)

Then deploy the contract:
```bash
npm run deploy:base-sepolia
```

Update the contract address in `src/lib/contract-config.ts` with your deployed address.

### Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and start creating NFT albums!

## 📱 Usage

1. **Connect Wallet** (MetaMask, Coinbase Wallet, etc.)
2. **Switch to Base Sepolia** network
3. **Upload Photos** via drag-and-drop or file picker (supports PNG, JPG, JPEG, GIF, WebP, HEIC)
4. **Enter Album Details** (name and description)
5. **Create Album** - each photo becomes an individual NFT token

## 💡 How It Works

Each photo you upload becomes its own ERC1155 token that appears in your wallet. Photos are organized into albums on-chain but each maintains its individual token identity. Whether you upload 1 photo or 50 photos, each becomes a separate NFT token.

## 🛠 Technical Details

- **Cost**: 0.00001 ETH per photo + gas fees (~0.001 ETH total)
- **Network**: Base Sepolia (testnet) / Base (mainnet)
- **Storage**: IPFS via Pinata
- **Standard**: ERC1155 (each photo = unique token)
- **Features**: Album organization, batch operations, royalties
- **Contract Functions**:
  - `createAlbum()`: Create albums with photo NFTs (1 or more photos)

## Project Structure
```
nemo/
├── contracts/              # Smart contracts
├── src/
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   │   └── photo-upload.tsx  # Main minting interface
│   └── lib/
│       ├── nft-minting.ts    # IPFS & minting logic
│       ├── contract-config.ts # Contract configuration
│       └── config.ts         # App configuration
├── scripts/               # Deployment scripts
└── test/                 # Smart contract tests
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Smart Contracts
npm run compile         # Compile contracts
npm run test           # Run contract tests
npm run deploy:base-sepolia # Deploy to Base Sepolia

# Linting
npm run lint           # Run ESLint
```

## Troubleshooting

### Common Issues

**"Insufficient funds" error**
- Get testnet ETH from Base Sepolia faucets
- Ensure you have enough for both mint cost and gas

**"Wrong network" error**
- Switch MetaMask to Base Sepolia (Chain ID: 84532)

**Images not loading**
- Check browser console for errors
- Verify file types are supported

## License

MIT License - see LICENSE file for details

---

Ready to mint? Get some Base Sepolia ETH and start creating your NFT photo collection! 📸✨
