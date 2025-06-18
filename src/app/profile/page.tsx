'use client';

import { useState, useEffect, useCallback } from 'react';
import { Camera, ArrowLeft, ChevronLeft, ChevronRight, Calendar, Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { readContract } from '@wagmi/core';
import { config } from '@/lib/config';
import { NEMO_CONTRACT_ABI, NEMO_CONTRACT_ADDRESS, getCurrentNetworkInfo } from '@/lib/contract-config';

// Real album interface matching contract data
interface Album {
  id: string;
  name: string;
  description: string;
  creator: string;
  tokenIds: string[];
  createdAt: Date;
  photos: PhotoNFT[];
}

interface PhotoNFT {
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadataUri: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata from IPFS (supporting both ipfs:// and http:// URLs)
  const fetchIPFSMetadata = useCallback(async (uri: string): Promise<{
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
  }> => {
    try {
      let fetchUrl = uri;
      
      // Convert ipfs:// to HTTP gateway URL
      if (uri.startsWith('ipfs://')) {
        const hash = uri.replace('ipfs://', '');
        fetchUrl = `https://gateway.pinata.cloud/ipfs/${hash}`;
      }
      
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error fetching IPFS metadata:', err);
      return {
        name: 'Unknown Photo',
        description: 'Metadata unavailable',
        image: '',
        attributes: []
      };
    }
  }, []);

  const fetchUserAlbums = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get user's album IDs
      const albumIds = await readContract(config, {
        address: NEMO_CONTRACT_ADDRESS as `0x${string}`,
        abi: NEMO_CONTRACT_ABI,
        functionName: 'getUserAlbums',
        args: [address!],
      }) as bigint[];

      if (albumIds.length === 0) {
        setAlbums([]);
        return;
      }

      // Step 2: Fetch details for each album
      const albumPromises = albumIds.map(async (albumId) => {
        try {
          // Get album details
          const albumData = await readContract(config, {
            address: NEMO_CONTRACT_ADDRESS as `0x${string}`,
            abi: NEMO_CONTRACT_ABI,
            functionName: 'getAlbum',
            args: [albumId],
          }) as [bigint, string, string, string, bigint[], bigint];

          const [id, name, description, creator, tokenIds, createdAt] = albumData;

          // Fetch photo NFT data for each token
          const photoPromises = tokenIds.map(async (tokenId) => {
            try {
              // Get metadata URI
              const metadataUri = await readContract(config, {
                address: NEMO_CONTRACT_ADDRESS as `0x${string}`,
                abi: NEMO_CONTRACT_ABI,
                functionName: 'uri',
                args: [tokenId],
              }) as string;

              // Fetch metadata from IPFS
              const metadata = await fetchIPFSMetadata(metadataUri);
              
              return {
                tokenId: tokenId.toString(),
                name: metadata.name || `Photo #${tokenId}`,
                description: metadata.description || '',
                imageUrl: metadata.image || '',
                metadataUri,
                attributes: metadata.attributes || [],
              };
            } catch (err) {
              console.error(`Error fetching photo ${tokenId}:`, err);
              return {
                tokenId: tokenId.toString(),
                name: `Photo #${tokenId}`,
                description: 'Failed to load metadata',
                imageUrl: '',
                metadataUri: '',
                attributes: [],
              };
            }
          });

          const photos = await Promise.all(photoPromises);

          return {
            id: id.toString(),
            name,
            description,
            creator,
            tokenIds: tokenIds.map(t => t.toString()),
            createdAt: new Date(Number(createdAt) * 1000),
            photos,
          };
        } catch (err) {
          console.error(`Error fetching album ${albumId}:`, err);
          return null;
        }
      });

      const albumResults = await Promise.all(albumPromises);
      const validAlbums = albumResults.filter(album => album !== null) as Album[];
      
      // Sort by creation date (newest first)
      validAlbums.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setAlbums(validAlbums);
    } catch (err) {
      console.error('Error fetching user albums:', err);
      setError('Failed to load your albums. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [address, fetchIPFSMetadata]);

  // Fetch user's albums from the blockchain
  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false);
      return;
    }

    fetchUserAlbums();
  }, [isConnected, address, fetchUserAlbums]);

  const handleBackToHome = () => {
    router.push('/');
  };

  const getIPFSImageUrl = (ipfsUrl: string) => {
    if (!ipfsUrl) return '';
    if (ipfsUrl.startsWith('ipfs://')) {
      const hash = ipfsUrl.replace('ipfs://', '');
      return `https://gateway.pinata.cloud/ipfs/${hash}`;
    }
    return ipfsUrl;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="photo-card max-w-md mx-auto p-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-3">
              Connect Your Wallet
            </h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Please connect your wallet to view your NFT photo collections
            </p>
            <button
              onClick={handleBackToHome}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Back Button */}
            <button
              onClick={handleBackToHome}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Camera className="w-8 h-8 text-white" />
              <h1 className="logo-text text-2xl text-white tracking-tight">
                Nemo
              </h1>
            </div>
            
            {/* Wallet Address */}
            <div className="text-xs text-gray-400 font-mono">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-display font-display text-white mb-4">
            Your Collections
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            Your photo albums on the blockchain
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your albums from the blockchain...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="photo-card max-w-md mx-auto p-12">
              <div className="w-16 h-16 bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">
                Failed to Load
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed">
                {error}
              </p>
              <button
                onClick={fetchUserAlbums}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Albums Display */}
        {!loading && !error && (
          <>
            {albums.length > 0 ? (
              <div className="space-y-12">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} getIPFSImageUrl={getIPFSImageUrl} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="photo-card max-w-md mx-auto p-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3">
                    No collections yet
                  </h3>
                  <p className="text-gray-400 mb-8 leading-relaxed">
                    Start by creating your first NFT photo collection
                  </p>
                  <button
                    onClick={handleBackToHome}
                    className="btn-primary"
                  >
                    Create Collection
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AlbumCard({ album, getIPFSImageUrl }: { album: Album; getIPFSImageUrl: (url: string) => string }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState<{[key: string]: boolean}>({});
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === album.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? album.photos.length - 1 : prev - 1
    );
  };

  const handleImageLoad = (tokenId: string) => {
    setImageLoading(prev => ({ ...prev, [tokenId]: false }));
  };

  const handleImageError = (tokenId: string) => {
    setImageLoading(prev => ({ ...prev, [tokenId]: false }));
    setImageErrors(prev => ({ ...prev, [tokenId]: true }));
  };

  const currentPhoto = album.photos[currentPhotoIndex];
  const currentImageUrl = getIPFSImageUrl(currentPhoto?.imageUrl || '');

  return (
    <div className="photo-card p-8 fade-in">
      {/* Album Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex-1">
          <h3 className="text-title text-white mb-2 font-display">
            {album.name}
          </h3>
          <p className="text-gray-400 text-sm mb-3 leading-relaxed">
            {album.description}
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <ImageIcon className="w-4 h-4" />
              <span>{album.photos.length} {album.photos.length === 1 ? 'NFT' : 'NFTs'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{album.createdAt.toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 font-mono">
            Album #{album.id}
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="space-y-6">
        {/* Main Photo Display */}
        <div className="relative">
          <div className="aspect-[16/10] bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
            {currentPhoto && currentImageUrl && !imageErrors[currentPhoto.tokenId] ? (
              <>
                {imageLoading[currentPhoto.tokenId] !== false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  </div>
                )}
                <Image
                  src={currentImageUrl}
                  alt={currentPhoto.name}
                  fill
                  className="object-cover"
                  onLoad={() => handleImageLoad(currentPhoto.tokenId)}
                  onError={() => handleImageError(currentPhoto.tokenId)}
                />
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center">
                <Camera className="w-16 h-16 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Navigation Buttons */}
          {album.photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Photo Info Overlay */}
          {currentPhoto && (
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg max-w-xs">
              <div className="font-medium mb-1">{currentPhoto.name}</div>
              <div className="text-xs text-gray-300">Token #{currentPhoto.tokenId}</div>
            </div>
          )}

          {/* Photo Counter */}
          {album.photos.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full">
              {currentPhotoIndex + 1} of {album.photos.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {album.photos.length > 1 && (
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {album.photos.map((photo, index) => {
              const thumbUrl = getIPFSImageUrl(photo.imageUrl);
              return (
                <button
                  key={photo.tokenId}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                    index === currentPhotoIndex 
                      ? 'border-white' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {thumbUrl && !imageErrors[photo.tokenId] ? (
                    <Image
                      src={thumbUrl}
                      alt={photo.name}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(photo.tokenId)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-500 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* NFT Attributes */}
        {currentPhoto && currentPhoto.attributes.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {currentPhoto.attributes.slice(0, 4).map((attr, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="text-xs text-gray-400 mb-1">{attr.trait_type}</div>
                <div className="text-sm text-white font-medium">{attr.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex space-x-3">
            <a
              href={`${getCurrentNetworkInfo().explorerUrl}/address/${NEMO_CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Explorer</span>
            </a>
            {currentPhoto && (
              <button 
                onClick={() => navigator.clipboard.writeText(`https://nemo-photos.vercel.app/nft/${currentPhoto.tokenId}`)}
                className="btn-secondary text-sm"
              >
                Share NFT
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500">
            ERC1155 Collection
          </div>
        </div>
      </div>
    </div>
  );
} 