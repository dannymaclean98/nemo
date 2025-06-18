// Auto-generated contract configuration
export const CONTRACT_ADDRESSES = {
  8453: "0x6692e79CC2F109B692263E044FB37F2c09A9F9E3"
} as const;

export const NEMO_CONTRACT_ADDRESS = "0x6692e79CC2F109B692263E044FB37F2c09A9F9E3";

// Get current network information
// export function getCurrentNetworkInfo() {
//   return {
//     environment: 'development',
//     isProduction: false,
//     networkName: 'Base Sepolia',
//     chainId: 84532,
//     contractAddress: NEMO_CONTRACT_ADDRESS,
//     explorerUrl: 'https://sepolia.basescan.org'
//   };
// }
// export const NEMO_CONTRACT_ADDRESS = "0x6692e79CC2F109B692263E044FB37F2c09A9F9E3";

export function getCurrentNetworkInfo() {
  return {
    environment: 'production',
    isProduction: true,
    networkName: 'Base',
    chainId: 8453,
    contractAddress: NEMO_CONTRACT_ADDRESS,
    explorerUrl: 'https://basescan.org'
  };
}

// Contract ABI - Using JSON format for better compatibility
export const NEMO_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "albumName", "type": "string" },
      { "internalType": "string", "name": "albumDescription", "type": "string" },
      { "internalType": "string[]", "name": "photoMetadataURIs", "type": "string[]" }
    ],
    "name": "createAlbum",
    "outputs": [
      { "internalType": "uint256", "name": "albumId", "type": "uint256" },
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "mintAdditionalPhotoCopies",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "albumId", "type": "uint256" }
    ],
    "name": "getAlbum",
    "outputs": [
      { "internalType": "uint256", "name": "id", "type": "uint256" },
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" },
      { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" }
    ],
    "name": "getUserAlbums",
    "outputs": [
      { "internalType": "uint256[]", "name": "", "type": "uint256[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalAlbums",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPhotos",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "uri",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" },
      { "internalType": "uint256", "name": "id", "type": "uint256" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "albumMintPrice",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getTokenSupplyInfo",
    "outputs": [
      { "internalType": "uint256", "name": "current", "type": "uint256" },
      { "internalType": "uint256", "name": "max", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "albumId", "type": "uint256" }
    ],
    "name": "albumExists",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Pricing info - Album creation cost per photo
export const ALBUM_MINT_PRICE = "0.00001"; // ETH per photo (about $0.0001)
