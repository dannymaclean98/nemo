const { ethers } = require("hardhat");
const { writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");

async function main() {
  console.log("🚀 Starting deployment of NemoPhotoAlbums contract...");
  
  // Get the contract factory
  const NemoPhotoAlbums = await ethers.getContractFactory("NemoPhotoAlbums");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const nemoPhotoAlbums = await NemoPhotoAlbums.deploy();
  
  await nemoPhotoAlbums.waitForDeployment();
  
  const contractAddress = await nemoPhotoAlbums.getAddress();
  
  console.log("✅ NemoPhotoAlbums deployed to:", contractAddress);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId, ")");
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    networkName: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contractName: "NemoPhotoAlbums",
    symbol: "NEMO"
  };
  
  const deploymentPath = join(__dirname, "../deployments");
  const deploymentFile = join(deploymentPath, `${network.name}-deployment.json`);
  
  // Create deployments directory if it doesn't exist
  try {
    mkdirSync(deploymentPath, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore error
  }
  
  writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);
  
  // Update the frontend config
  updateFrontendConfig(contractAddress, Number(network.chainId));
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Next steps:");
  console.log("1. Verify the contract on BaseScan (optional):");
  console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
  console.log("2. Update your frontend to use the real contract address");
  console.log("3. Test minting some NFTs!");
}

function updateFrontendConfig(contractAddress, chainId) {
  const configPath = join(__dirname, "../src/lib/contract-config.ts");
  
  const configContent = `// Auto-generated contract configuration
export const CONTRACT_ADDRESSES = {
  ${chainId}: "${contractAddress}"
} as const;

export const NEMO_CONTRACT_ADDRESS = "${contractAddress}";

// Contract ABI - Using JSON format for better compatibility
export const NEMO_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "albumName", "type": "string" },
      { "internalType": "string", "name": "albumDescription", "type": "string" },
      { "internalType": "string[]", "name": "photoURIs", "type": "string[]" }
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
`;

  writeFileSync(configPath, configContent);
  console.log("📝 Frontend config updated at:", configPath);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
}); 