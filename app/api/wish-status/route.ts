import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const date = searchParams.get('date');
    
    if (!fid || !date) {
      return NextResponse.json(
        { error: 'Missing required query parameters: fid and date' },
        { status: 400 }
      );
    }
    
    // Calculate wish index using the same logic as the client
    const fnv1aHash = (input: string): number => {
      const FNV_PRIME = 16777619;
      const FNV_OFFSET_BASIS = 2166136261;
      
      let hash = FNV_OFFSET_BASIS;
      
      for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash *= FNV_PRIME;
        hash &= 0xffffffff; // Keep it 32-bit
      }
      
      return Math.abs(hash);
    };
    
    const wishIndex = fnv1aHash(`${fid}-${date}`) % 25;
    
    // Try to get vote data from KV, but handle gracefully if not available
    let likes = 0;
    let dislikes = 0;
    let hasVoted = false;
    
    try {
      const { kv } = await import('@vercel/kv');
      
      const likesKey = `nice:vote:${date}:${wishIndex}:likes`;
      const dislikesKey = `nice:vote:${date}:${wishIndex}:dislikes`;
      const votersKey = `nice:vote:${date}:${wishIndex}:voters`;
      
      likes = await kv.get(likesKey) || 0;
      dislikes = await kv.get(dislikesKey) || 0;
      hasVoted = (await kv.sismember(votersKey, fid)) === 1;
    } catch (kvError) {
      // KV not available (development mode), use defaults
      console.log('KV not available, using defaults for wish status');
      likes = 0;
      dislikes = 0;
      hasVoted = false;
    }
    
    return NextResponse.json({ 
      wishIndex: Number(wishIndex), 
      hasVoted: Boolean(hasVoted), 
      likes: Number(likes), 
      dislikes: Number(dislikes) 
    });
    
  } catch (error) {
    console.error('Wish status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}