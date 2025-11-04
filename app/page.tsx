'use client';

import { useState, useEffect } from 'react';
import { getTodaysWish, getWishIndex } from '../lib/hash';
import sdk from '@farcaster/frame-sdk';

interface User {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface WishStatus {
  wishIndex: number;
  hasVoted: boolean;
  likes: number;
  dislikes: number;
}

type AppState = 'loading' | 'not-revealed' | 'revealed-not-voted' | 'voted' | 'error';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [wishText, setWishText] = useState<string>('');
  const [wishStatus, setWishStatus] = useState<WishStatus | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [currentWishIndex, setCurrentWishIndex] = useState<number>(0);

  // Initialize Farcaster SDK and authentication
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize the SDK
        await sdk.actions.ready();
        
        // Get user data from SDK context
        const context = await sdk.context;
        if (context && context.user) {
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl
          });
        } else {
          // Fallback for development/testing
          setUser({
            fid: 12345,
            username: 'demo',
            displayName: 'Demo User'
          });
        }
      } catch (error) {
        console.error('SDK initialization error:', error);
        
        // Always try to call ready() even if there's an error
        try {
          await sdk.actions.ready();
        } catch (readyError) {
          console.error('Ready call failed:', readyError);
        }
        
        // Fallback for development
        setUser({
          fid: 12345,
          username: 'demo',
          displayName: 'Demo User'
        });
      }
    };

    init();
  }, []);

  // Check wish status when user is available
  useEffect(() => {
    if (user && user.fid) {
      checkWishStatus(user.fid);
    }
  }, [user]);

  const checkWishStatus = async (fid: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`/api/wish-status?fid=${fid}&date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setWishStatus(data);
        setCurrentWishIndex(data.wishIndex);
        
        // Determine app state based on whether user has already voted
        if (data.hasVoted) {
          setWishText(getTodaysWish(fid));
          setAppState('voted');
        } else {
          setAppState('not-revealed');
        }
      } else {
        setAppState('error');
      }
    } catch (error) {
      console.error('Failed to check wish status:', error);
      setAppState('error');
    }
  };

  const handleShowWish = async () => {
    if (!user) return;
    
    setWishText(getTodaysWish(user.fid));
    
    // Load current vote statistics
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/vote?date=${today}&wishIndex=${currentWishIndex}`);
      if (response.ok) {
        const data = await response.json();
        setWishStatus(prev => ({
          ...prev!,
          likes: data.likes,
          dislikes: data.dislikes
        }));
      }
    } catch (error) {
      console.error('Failed to load vote stats:', error);
    }
    
    setAppState('revealed-not-voted');
  };

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!user || isVoting) return;
    
    setIsVoting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fid: user.fid.toString(),
          wishIndex: currentWishIndex,
          vote: voteType,
          date: today
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setWishStatus({
          wishIndex: currentWishIndex,
          hasVoted: true,
          likes: data.likes,
          dislikes: data.dislikes
        });
        setAppState('voted');
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setIsVoting(false);
    }
  };

  if (appState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="wish-card">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your daily wish...</p>
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'error' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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

        {/* State A: Not Revealed */}
        {appState === 'not-revealed' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Get your daily wish!</h1>
            <p className="text-gray-600 mb-8">
              Your personalized positive wish is waiting for you
            </p>
            <button
              onClick={handleShowWish}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Show My Wish
            </button>
          </div>
        )}

        {/* State B: Revealed, Not Voted */}
        {appState === 'revealed-not-voted' && (
          <div>
            <div className="wish-text mb-6">
              "{wishText}"
            </div>

            {/* Current stats */}
            <div className="text-center mb-6">
              <div className="vote-stats">
                <span className="text-sm text-gray-600">
                  {wishStatus && wishStatus.likes + wishStatus.dislikes > 0 
                    ? `Current stats: ${wishStatus.likes} like${wishStatus.likes !== 1 ? 's' : ''}, ${wishStatus.dislikes} dislike${wishStatus.dislikes !== 1 ? 's' : ''}`
                    : 'Be the first to vote!'
                  }
                </span>
              </div>
            </div>
            
            {/* Voting buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleVote('like')}
                disabled={isVoting}
                className="vote-btn like-btn"
              >
                {isVoting ? '...' : '👍 Like'}
              </button>
              <button
                onClick={() => handleVote('dislike')}
                disabled={isVoting}
                className="vote-btn dislike-btn"
              >
                {isVoting ? '...' : '👎 Dislike'}
              </button>
            </div>
          </div>
        )}

        {/* State C: Voted */}
        {appState === 'voted' && (
          <div>
            <div className="wish-text mb-6">
              "{wishText}"
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-green-600 mb-4">
                🎉 Thank you!
              </p>
              <div className="vote-stats">
                <span className="text-sm text-gray-600">
                  {wishStatus && (
                    <>
                      Updated stats: {wishStatus.likes} like{wishStatus.likes !== 1 ? 's' : ''}, {wishStatus.dislikes} dislike{wishStatus.dislikes !== 1 ? 's' : ''}
                      {' '}({wishStatus.likes + wishStatus.dislikes} total vote{wishStatus.likes + wishStatus.dislikes !== 1 ? 's' : ''})
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-yellow-200 text-center">
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