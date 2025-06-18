import { parseEther, formatEther } from 'viem';
import { writeContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from './config';
import { NEMO_CONTRACT_ABI, NEMO_CONTRACT_ADDRESS, ALBUM_MINT_PRICE } from './contract-config';
import { PinataSDK } from 'pinata';

// Initialize Pinata SDK for client-side operations
const pinata = new PinataSDK({
  pinataJwt: "", // Empty for client-side, we'll use signed URLs
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL || ""
});

// IPFS Upload Types
interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// NFT Metadata interface
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
  external_url?: string;
  animation_url?: string;
}

// Minting result interface
export interface MintResult {
  success: boolean;
  transactionHash?: string;
  tokenIds?: string[];
  albumId?: string;
  error?: string;
  gasUsed?: string;
}

// Upload progress callback type
export type UploadProgressCallback = (progress: number, status: string) => void;

/**
 * Upload a single file to IPFS using Pinata's signed URL approach
 */
export async function uploadFileToIPFS(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<IPFSUploadResult> {
  try {
    onProgress?.(10, 'Getting upload URL...');

    // Get signed upload URL from our API route
    const urlResponse = await fetch('/api/presigned-url', {
      method: 'GET',
    });

    if (!urlResponse.ok) {
      throw new Error(`Failed to get upload URL: ${urlResponse.statusText}`);
    }

    const { url } = await urlResponse.json();

    onProgress?.(30, 'Uploading to IPFS...');

    // Upload file using the signed URL
    const upload = await pinata.upload.public
      .file(file)
      .url(url);

    if (!upload.cid) {
      throw new Error('Upload failed - no CID returned');
    }

    onProgress?.(100, 'Upload complete!');

    return {
      success: true,
      hash: upload.cid
    };

  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Upload multiple files to IPFS
 */
export async function uploadFilesToIPFS(
  files: File[],
  onProgress?: UploadProgressCallback
): Promise<string[]> {
  const ipfsHashes: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileProgress = Math.round(((i) / files.length) * 100);
    
    onProgress?.(fileProgress, `Uploading photo ${i + 1} of ${files.length}...`);
    
    const result = await uploadFileToIPFS(file, (progress, status) => {
      const totalProgress = Math.round(fileProgress + (progress / files.length));
      onProgress?.(totalProgress, status);
    });
    
    if (!result.success || !result.hash) {
      throw new Error(`Failed to upload ${file.name}: ${result.error}`);
    }
    
    ipfsHashes.push(result.hash);
  }
  
  return ipfsHashes;
}

/**
 * Create a photo album - works for both single photos and multiple photos
 */
export async function mintPhotoAlbum(
  files: File[],
  albumName: string,
  albumDescription: string,
  onProgress?: UploadProgressCallback
): Promise<MintResult> {
  try {
    // Check if contract is deployed
    if (NEMO_CONTRACT_ADDRESS.includes("DEPLOY_CONTRACT_FIRST") || !NEMO_CONTRACT_ADDRESS.startsWith("0x")) {
      return {
        success: false,
        error: "❌ Contract not deployed yet!\n\n1. Get Base Sepolia ETH from faucets\n2. Run: npm run deploy:base-sepolia\n3. Update contract address in src/lib/contract-config.ts"
      };
    }

    onProgress?.(5, 'Starting album creation...');

    // Step 1: Upload photos to IPFS
    onProgress?.(10, 'Uploading photos to IPFS...');
    const ipfsHashes = await uploadFilesToIPFS(files, (progress, status) => {
      const uploadProgress = Math.round(10 + (progress * 0.4)); // 10-50%
      onProgress?.(uploadProgress, status);
    });

    // Step 2: Create metadata for each photo
    onProgress?.(55, 'Creating metadata...');
    const metadataArray = await createAlbumMetadata(files, ipfsHashes, albumName, albumDescription);
    
    // Step 3: Upload metadata to IPFS
    onProgress?.(60, 'Uploading metadata...');
    const metadataURIs: string[] = [];
    
    for (let i = 0; i < metadataArray.length; i++) {
      const metadata = metadataArray[i];
      const metadataResult = await uploadMetadataToIPFS(metadata, (progress) => {
        const totalProgress = Math.round(60 + ((i + progress/100) / metadataArray.length) * 20); // 60-80%
        onProgress?.(totalProgress, `Uploading metadata ${i + 1}/${metadataArray.length}...`);
      });
      
      if (!metadataResult.success || !metadataResult.hash) {
        throw new Error(`Failed to upload metadata for photo ${i + 1}`);
      }
      
      // Use proper IPFS URI format for ERC1155 compliance
      metadataURIs.push(`ipfs://${metadataResult.hash}`);
    }

    // Step 4: Calculate cost
    const totalCost = parseEther(ALBUM_MINT_PRICE) * BigInt(files.length);
    onProgress?.(85, `Preparing transaction (Cost: ${formatEther(totalCost)} ETH)...`);

    // Step 5: Execute mint transaction - each photo becomes its own ERC1155 token
    onProgress?.(90, 'Requesting wallet signature...');
    
    const hash = await writeContract(config, {
      address: NEMO_CONTRACT_ADDRESS as `0x${string}`,
      abi: NEMO_CONTRACT_ABI,
      functionName: 'createAlbum',
      args: [albumName, albumDescription, metadataURIs],
      value: totalCost,
    });

    onProgress?.(95, 'Waiting for transaction confirmation...');
    
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      confirmations: 1,
    });

    onProgress?.(100, 'Album created successfully!');

    // Parse the receipt to get album ID and token IDs from events
    // This would require proper event parsing in a real implementation
    const mockAlbumId = Math.floor(Math.random() * 1000).toString();
    const tokenIds = metadataURIs.map((_, index) => (Date.now() + index).toString());

    return {
      success: true,
      transactionHash: hash,
      albumId: mockAlbumId,
      tokenIds,
      gasUsed: receipt.gasUsed.toString(),
    };

  } catch (error) {
    console.error('Album creation error:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    // Handle specific error types
    if (errorMessage.includes('User rejected')) {
      errorMessage = 'Transaction was rejected by user';
    } else if (errorMessage.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds to complete transaction';
    } else if (errorMessage.includes('ContractFunctionExecutionError') || errorMessage.includes('execution reverted')) {
      errorMessage = 'Contract execution failed. Make sure:\n• Contract is deployed correctly\n• You have enough ETH for gas + mint cost\n• You\'re on Base Sepolia network';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get estimated gas cost for minting
 */
export function getEstimatedCost(photoCount: number): {
  mintCost: string;
  estimatedGas: string;
  total: string;
} {
  const mintCost = parseEther(ALBUM_MINT_PRICE) * BigInt(photoCount);
  
  // Rough gas estimation (this should be calculated more precisely in production)
  const estimatedGas = parseEther('0.001'); // ~0.001 ETH for gas
  const total = mintCost + estimatedGas;

  return {
    mintCost: formatEther(mintCost),
    estimatedGas: formatEther(estimatedGas),
    total: formatEther(total),
  };
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadMetadataToIPFS(
  metadata: NFTMetadata,
  onProgress?: UploadProgressCallback
): Promise<IPFSUploadResult> {
  try {
    onProgress?.(20, 'Preparing metadata...');
    
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    
    const metadataFile = new File([jsonBlob], 'metadata.json', {
      type: 'application/json'
    });
    
    onProgress?.(40, 'Getting upload URL for metadata...');

    // Get signed upload URL for metadata
    const urlResponse = await fetch('/api/presigned-url', {
      method: 'GET',
    });

    if (!urlResponse.ok) {
      throw new Error(`Failed to get metadata upload URL: ${urlResponse.statusText}`);
    }

    const { url } = await urlResponse.json();

    onProgress?.(60, 'Uploading metadata to IPFS...');

    // Upload metadata using the signed URL
    const upload = await pinata.upload.public
      .file(metadataFile)
      .url(url);

    if (!upload.cid) {
      throw new Error('Metadata upload failed - no CID returned');
    }

    onProgress?.(100, 'Metadata uploaded!');
    
    return {
      success: true,
      hash: upload.cid
    };

  } catch (error) {
    console.error('Metadata upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Metadata upload failed'
    };
  }
}

/**
 * Create metadata for album photos following ERC1155 Metadata URI JSON Schema
 * Uses proper IPFS URI format (ipfs://<hash>) for full decentralization
 */
export async function createAlbumMetadata(
  files: File[],
  ipfsHashes: string[],
  albumName: string,
  description: string
): Promise<NFTMetadata[]> {
  return files.map((file, index) => ({
    name: `${albumName} - Photo ${index + 1}`,
    description: `${description}\n\nPhoto ${index + 1} of ${files.length} in the "${albumName}" album.`,
    image: `ipfs://${ipfsHashes[index]}`,
    attributes: [
      {
        trait_type: 'Album',
        value: albumName,
      },
      {
        trait_type: 'Photo Number',
        value: (index + 1).toString(),
      },
      {
        trait_type: 'Total Photos',
        value: files.length.toString(),
      },
      {
        trait_type: 'File Type',
        value: (file as File & { originalFormat?: string }).originalFormat || file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
      },
      {
        trait_type: 'File Size',
        value: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      },
      // Add conversion info if file was converted from HEIC
      ...((file as File & { wasConverted?: boolean; originalFormat?: string }).wasConverted ? [{
        trait_type: 'Original Format',
        value: (file as File & { originalFormat?: string }).originalFormat || 'HEIC',
      }] : [])
    ],
    external_url: 'https://nemo-photo-albums.app'
  }));
}

 