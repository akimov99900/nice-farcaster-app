import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fid, wishIndex, vote, date } = await request.json();
    
    // Validate input
    if (!fid || wishIndex === undefined || !vote || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (vote !== 'like' && vote !== 'dislike') {
      return NextResponse.json(
        { error: 'Invalid vote type' },
        { status: 400 }
      );
    }
    
    const likesKey = `nice:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `nice:vote:${date}:${wishIndex}:dislikes`;
    const votersKey = `nice:vote:${date}:${wishIndex}:voters`;
    
    // Check if already voted
    const hasVoted = await kv.sismember(votersKey, fid.toString());
    
    if (hasVoted) {
      // Return current stats
      const likes = await kv.get(likesKey) || 0;
      const dislikes = await kv.get(dislikesKey) || 0;
      return NextResponse.json({ 
        hasVoted: true, 
        likes: Number(likes), 
        dislikes: Number(dislikes) 
      });
    }
    
    // Record vote
    if (vote === 'like') {
      await kv.incr(likesKey);
    } else {
      await kv.incr(dislikesKey);
    }
    
    await kv.sadd(votersKey, fid.toString());
    
    const likes = await kv.get(likesKey) || 0;
    const dislikes = await kv.get(dislikesKey) || 0;
    
    return NextResponse.json({ 
      hasVoted: true, 
      likes: Number(likes), 
      dislikes: Number(dislikes) 
    });
    
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const wishIndex = searchParams.get('wishIndex');
    
    if (!date || !wishIndex) {
      return NextResponse.json(
        { error: 'Missing required query parameters' },
        { status: 400 }
      );
    }
    
    const likesKey = `nice:vote:${date}:${wishIndex}:likes`;
    const dislikesKey = `nice:vote:${date}:${wishIndex}:dislikes`;
    
    const likes = await kv.get(likesKey) || 0;
    const dislikes = await kv.get(dislikesKey) || 0;
    
    return NextResponse.json({ 
      likes: Number(likes), 
      dislikes: Number(dislikes) 
    });
    
  } catch (error) {
    console.error('Vote stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}