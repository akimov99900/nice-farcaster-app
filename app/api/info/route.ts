import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      name: 'BearBrick',
      version: '1.1.0',
      description: 'Personalized BearBrick NFT preview and minting for Farcaster users',
      endpoints: {
        health: '/api/health',
        info: '/api/info',
        tokenUri: '/api/token-uri',
        image: '/api/image/[fid]',
        metadata: '/api/metadata/[fid]',
      },
      features: [
        'Farcaster authentication via @lab/farcaster-auth',
        'Avatar-driven color extraction',
        'Inline BearBrick SVG preview with graceful fallbacks',
        'NFT minting on Base network',
        'Metadata and token URI generation',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}