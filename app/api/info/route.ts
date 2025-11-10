import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This would handle server-side Farcaster auth if needed
    // For now, return basic app info
    return NextResponse.json({
      name: 'BearBrick',
      version: '1.1.0',
      description: 'Personalized BearBrick NFT preview for Farcaster users',
      endpoints: {
        health: '/api/health',
        info: '/api/info',
      },
      features: [
        'Farcaster authentication via @lab/farcaster-auth',
        'Avatar-driven color extraction',
        'Inline BearBrick SVG preview with graceful fallbacks',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}