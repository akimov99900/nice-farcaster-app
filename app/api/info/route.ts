import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // This would handle server-side Farcaster auth if needed
    // For now, return basic app info
    return NextResponse.json({
      name: 'nice',
      version: '1.0.0',
      description: 'A daily dose of positive wishes and inspiration',
      endpoints: {
        health: '/api/health',
        info: '/api/info',
        vote: '/api/vote'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}