'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Camera, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { mintPhotoAlbum, type UploadProgressCallback } from '../lib/nft-minting';
import { getCurrentNetworkInfo } from '@/lib/contract-config';
import heic2any from 'heic2any';

interface PhotoUploadProps {
  onPhotosChange: (files: File[]) => void;
  albumName: string;
}

interface MintProgress {
  isActive: boolean;
  progress: number;
  status: string;
  error?: string;
}

interface MintResult {
  success: boolean;
  transactionHash?: string;
  tokenIds?: string[];
  albumId?: string;
  error?: string;
}

export default function PhotoUpload({ onPhotosChange, albumName }: PhotoUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [mintProgress, setMintProgress] = useState<MintProgress>({
    isActive: false,
    progress: 0,
    status: ''
  });
  const [mintResult, setMintResult] = useState<MintResult | null>(null);

  const router = useRouter();
  const { address, isConnected, chain } = useAccount();

  // Helper function to check if file is HEIC
  const isHEICFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const heicExtensions = ['.heic', '.heif', '.heics', '.heifs'];
    return heicExtensions.some(ext => fileName.endsWith(ext));
  };

  // Convert HEIC file to JPEG
  const convertHEICToJPEG = async (file: File): Promise<File> => {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.9
      }) as Blob;

      // Create a new File object with the converted blob
      const convertedFile = new File(
        [convertedBlob], 
        file.name.replace(/\.(heic|heif|heics|heifs)$/i, '.jpg'),
        { 
          type: 'image/jpeg',
          lastModified: file.lastModified
        }
      );

      // Add original format info to the converted file for metadata transparency
      Object.defineProperty(convertedFile, 'originalFormat', { value: 'HEIC', writable: false });
      Object.defineProperty(convertedFile, 'wasConverted', { value: true, writable: false });

      return convertedFile;
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error(`Failed to convert ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => {
      // Check for standard image types
      if (file.type.startsWith('image/')) {
        return true;
      }
      
      // Handle HEIC files which browsers don't recognize as image type
      return isHEICFile(file);
    });

    if (imageFiles.length === 0) {
      return;
    }

    // Check if any files need conversion
    const heicFiles = imageFiles.filter(isHEICFile);
    if (heicFiles.length > 0) {
      setIsConverting(true);
    }

    try {
      // Process files - convert HEIC to JPEG if needed
      const processedFiles: File[] = [];
      const processedUrls: string[] = [];

      for (const file of imageFiles) {
        try {
          let processedFile = file;
          
          // Convert HEIC files to JPEG
          if (isHEICFile(file)) {
            console.log(`Converting HEIC file: ${file.name}`);
            processedFile = await convertHEICToJPEG(file);
            console.log(`Successfully converted ${file.name} to ${processedFile.name}`);
          }

          processedFiles.push(processedFile);
          processedUrls.push(URL.createObjectURL(processedFile));
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          alert(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update state with processed files
      const newFiles = [...uploadedFiles, ...processedFiles];
      setUploadedFiles(newFiles);
      onPhotosChange(newFiles);

      // Add new URLs
      setImageUrls(prev => [...prev, ...processedUrls]);
    } finally {
      setIsConverting(false);
    }
  }, [uploadedFiles, onPhotosChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.svg'],
      // HEIC files - browsers don't recognize them as image/* MIME type
      'image/heic': ['.heic'],
      'image/heif': ['.heif'],
      'image/heic-sequence': ['.heics'],
      'image/heif-sequence': ['.heifs']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    // Revoke the URL to free memory
    if (imageUrls[index]) {
      URL.revokeObjectURL(imageUrls[index]);
    }
    
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    
    setUploadedFiles(newFiles);
    setImageUrls(newUrls);
    onPhotosChange(newFiles);
  };

  const resetMinting = () => {
    setMintProgress({ isActive: false, progress: 0, status: '' });
    setMintResult(null);
  };

  const handleMint = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    const networkInfo = getCurrentNetworkInfo();
    if (chain?.id !== networkInfo.chainId) {
      alert(`Please switch to ${networkInfo.networkName}`);
      return;
    }

    if (uploadedFiles.length === 0) {
      alert('Please upload at least one photo');
      return;
    }

    if (!albumName.trim()) {
      alert('Please provide an album name');
      return;
    }

    resetMinting();
    setMintProgress({ isActive: true, progress: 0, status: 'Initializing...' });

    const progressCallback: UploadProgressCallback = (progress, status) => {
      setMintProgress(prev => ({ ...prev, progress, status }));
    };

    try {
      const result = await mintPhotoAlbum(
        uploadedFiles,
        albumName,
        `Photo album: ${albumName}`,
        progressCallback
      );

      setMintResult(result);
      
      if (result.success) {
        setMintProgress(prev => ({ 
          ...prev, 
          isActive: false, 
          progress: 100, 
          status: 'Collection created successfully!' 
        }));
      } else {
        setMintProgress(prev => ({ 
          ...prev, 
          isActive: false, 
          error: result.error 
        }));
      }

    } catch (error) {
      console.error('Minting failed:', error);
      setMintProgress(prev => ({ 
        ...prev, 
        isActive: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [imageUrls]);

  const canMint = isConnected && uploadedFiles.length > 0 && albumName.trim() && !mintProgress.isActive && !isConverting;

  return (
    <div className="w-full space-y-8">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`upload-zone cursor-pointer p-12 text-center min-h-[300px] flex flex-col items-center justify-center space-y-6 transition-all duration-200 ${
          isDragActive 
            ? 'border-white bg-gray-900'
            : isConverting
            ? 'border-blue-500 bg-blue-950 opacity-75 cursor-not-allowed'
            : 'hover:border-gray-600'
        }`}
      >
        <input {...getInputProps()} disabled={isConverting} />
        
        <div className="flex flex-col items-center space-y-4">
          {isConverting ? (
            <>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium text-white mb-2">
                  Converting HEIC Photos
                </p>
                <p className="text-blue-300">Please wait while we process your images...</p>
              </div>
            </>
          ) : isDragActive ? (
            <>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-black" />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium text-white mb-2">
                  Drop your photos here
                </p>
                <p className="text-gray-400">Release to add them to your collection</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-xl font-medium text-white mb-2">
                  Add photos to your collection
                </p>
                <p className="text-gray-400 mb-4">
                  Drag and drop your photos here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  Supports PNG, JPG, JPEG, GIF, WebP, HEIC
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Photos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-6 fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              {uploadedFiles.length} {uploadedFiles.length === 1 ? 'Photo' : 'Photos'} Added
            </h3>
            <p className="text-sm text-gray-500">
              Click on any photo to remove it
            </p>
          </div>
          
          <div className="photo-grid">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="photo-item group cursor-pointer relative" onClick={() => removeFile(index)}>
                <Image
                  src={imageUrls[index]}
                  alt={file.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all duration-200">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-black" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {mintProgress.isActive && (
        <div className="photo-card p-6 slide-up">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Creating Collection</span>
              <span className="text-sm text-gray-400">{mintProgress.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${mintProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">{mintProgress.status}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {mintResult && (
        <div className={`photo-card p-6 fade-in ${
          mintResult.success ? 'border-green-900' : 'border-red-900'
        }`}>
          <div className="flex items-start space-x-3">
            {mintResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
            )}
            <div className="flex-1">
              <h4 className="text-lg font-medium text-white mb-2">
                {mintResult.success ? 'Collection Created!' : 'Creation Failed'}
              </h4>

              {mintResult.success && mintResult.transactionHash && (
                <div className="space-y-3">
                  <p className="text-gray-400">
                    Your NFT collection has been successfully created and is now live on the blockchain.
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push('/profile')}
                      className="btn-secondary text-sm flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>View Your Collection</span>
                    </button>
                  </div>
                </div>
              )}

              {!mintResult.success && mintResult.error && (
                <p className="text-red-400 text-sm">{mintResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Collection Button */}
      <button
        onClick={handleMint}
        disabled={!canMint}
        className={`w-full btn-primary text-lg py-4 ${
          !canMint ? 'opacity-50' : ''
        }`}
      >
        {mintProgress.isActive ? (
          <>
            <Loader2 className="w-5 h-5 spinner" />
            Creating Collection...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            Create NFT Collection
          </>
        )}
      </button>

      {/* Help Text */}
      {uploadedFiles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">
            Start by adding some photos to create your first NFT collection
          </p>
        </div>
      )}
    </div>
  );
} 