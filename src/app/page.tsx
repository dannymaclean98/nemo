'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Camera, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PhotoUpload from '@/components/photo-upload';

export default function Home() {
  const [albumName, setAlbumName] = useState('');
  const router = useRouter();

  const handleUserProfile = () => {
    router.push('/profile');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="logo-text text-xl sm:text-2xl text-white tracking-tight">
                Nemo
              </h1>
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="scale-90 sm:scale-100 origin-right">
                <ConnectButton 
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                  chainStatus={{
                    smallScreen: "icon",
                    largeScreen: "full",
                  }}
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                />
              </div>
              <button
                onClick={handleUserProfile}
                className="p-1.5 sm:p-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <h2 className="text-display font-display text-white">
              Create An Album
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Let your photos live forever on base.
            </p>
          </div>

          {/* Album Creation */}
          <div className="space-y-8">
            {/* Album Name Input */}
            <div className="photo-card p-8">
              <div className="space-y-4">
                <label className="block text-lg font-medium text-white">
                  Album Name
                </label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  placeholder="Give your collection a name..."
                  className="clean-input w-full"
                />
                <p className="text-sm text-gray-500">
                  Choose a name that captures the essence of your photos
                </p>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="photo-card p-8">
              <PhotoUpload onPhotosChange={() => {}} albumName={albumName} />
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-white">Upload & Create</h3>
              <p className="text-gray-400">
                Drag and drop your favorite photos to create beautiful NFT collections
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Own Forever</h3>
              <p className="text-gray-400">
                Your photos are stored permanently on IPFS and owned as NFTs
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white">Share & Discover</h3>
              <p className="text-gray-400">
                Connect with other photographers and discover amazing collections
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
