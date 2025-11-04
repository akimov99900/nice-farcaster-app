'use client';

import { useState, useEffect } from 'react';
import { getTodaysWish, getWishForDate } from '../lib/hash';

interface User {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todaysWish, setTodaysWish] = useState<string>('');
  const [tomorrowsWish, setTomorrowsWish] = useState<string>('');
  const [showTomorrow, setShowTomorrow] = useState(false);

  // Initialize Farcaster Quick Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if running in Farcaster environment
        if (typeof window !== 'undefined' && window.parent !== window) {
          // Try to get user data from Farcaster context
          const farcasterUser = await getFarcasterUser();
          if (farcasterUser) {
            setUser(farcasterUser);
          } else {
            // Fallback for development/testing
            setUser({
              fid: 12345,
              username: 'demo',
              displayName: 'Demo User'
            });
          }
        } else {
          // Fallback for development - use a mock user
          const mockFid = Math.floor(Math.random() * 1000000) + 1;
          setUser({
            fid: mockFid,
            username: 'demo',
            displayName: 'Demo User'
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Fallback for development
        setUser({
          fid: 12345,
          username: 'demo',
          displayName: 'Demo User'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Get wishes when user is available
  useEffect(() => {
    if (user && user.fid) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      setTodaysWish(getTodaysWish(user.fid));
      setTomorrowsWish(getWishForDate(user.fid, tomorrowStr));
    }
  }, [user]);

  const getFarcasterUser = async (): Promise<User | null> => {
    return new Promise((resolve) => {
      // In a real Farcaster mini-app, this would use the Farcaster Auth Kit
      // For now, we'll simulate the auth process
      
      // Try to get user data from parent window (Farcaster client)
      try {
        // Check if we have access to Farcaster context
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'FARCASTER_AUTH_REQUEST',
            origin: window.location.origin
          }, '*');

          const handleMessage = (event: MessageEvent) => {
            // Security check - only accept messages from same origin
            if (event.origin !== window.location.origin) return;
            
            if (event.data.type === 'FARCASTER_AUTH_RESPONSE') {
              window.removeEventListener('message', handleMessage);
              resolve(event.data.user || null);
            }
          };

          window.addEventListener('message', handleMessage);

          // Timeout fallback - return null to use mock user
          setTimeout(() => {
            window.removeEventListener('message', handleMessage);
            resolve(null);
          }, 3000);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.log('Farcaster auth not available, using fallback');
        resolve(null);
      }
    });
  };

  const handleNewWish = () => {
    setShowTomorrow(true);
  };

  const handleBackToToday = () => {
    setShowTomorrow(false);
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your daily wish...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="wish-card">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to nice</h1>
            <p className="text-gray-600 mb-6">
              Please open this app in Farcaster to receive your daily positive wish.
            </p>
            <div className="text-sm text-gray-500">
              This app requires Farcaster authentication to work properly.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWish = showTomorrow ? tomorrowsWish : todaysWish;
  const currentDate = showTomorrow 
    ? new Date(Date.now() + 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="wish-card">
        {/* User Info */}
        <div className="flex items-center justify-center mb-6">
          {user.pfpUrl && (
            <img 
              src={user.pfpUrl} 
              alt={user.displayName || user.username}
              className="w-12 h-12 rounded-full mr-3"
            />
          )}
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Hello, {user.displayName || user.username}!
            </h2>
            <p className="text-sm text-gray-600">{currentDate}</p>
          </div>
        </div>

        {/* Wish Display */}
        <div className="wish-text">
          "{currentWish}"
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {!showTomorrow ? (
            <button 
              onClick={handleNewWish}
              className="btn-primary"
            >
              ✨ Preview Tomorrow's Wish
            </button>
          ) : (
            <button 
              onClick={handleBackToToday}
              className="btn-primary"
            >
              📅 Back to Today's Wish
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-yellow-200 text-center">
          <p className="text-xs text-gray-500">
            Your wish is personalized just for you based on your Farcaster ID
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Come back tomorrow for a new inspiration!
          </p>
        </div>
      </div>

      {/* App Branding */}
      <div className="mt-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <svg width="24" height="24" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <circle cx="90" cy="90" r="85" fill="#FFD700" stroke="#FFA500" strokeWidth="5"/>
            <circle cx="90" cy="90" r="75" fill="#FFED4E"/>
            <path d="M60 75C60 75 70 85 90 85C110 85 120 75 120 75" stroke="#FF8C00" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="65" cy="65" r="8" fill="#FF6B35"/>
            <circle cx="115" cy="65" r="8" fill="#FF6B35"/>
            <path d="M75 100C85 110 95 110 105 100" stroke="#FF8C00" strokeWidth="3" strokeLinecap="round"/>
            <path d="M45 120C55 130 125 130 135 120" stroke="#FFA500" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span className="font-bold text-gray-700">nice</span>
        </div>
        <p className="text-xs text-gray-500">
          Daily positive wishes for everyone
        </p>
      </div>
    </div>
  );
}