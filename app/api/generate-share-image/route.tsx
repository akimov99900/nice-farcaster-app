import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { wishText, date, username } = await request.json();
    
    if (!wishText || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: wishText, date' },
        { status: 400 }
      );
    }

    // For now, return a placeholder image URL
    // In a real implementation, you would use @vercel/og or Canvas API
    const placeholderSvg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700" />
            <stop offset="100%" style="stop-color:#FFA500" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        
        <!-- Title -->
        <text x="400" y="100" font-family="system-ui, sans-serif" font-size="32" font-weight="bold" fill="#FF6B35" text-anchor="middle">
          ✨ Your Daily Wish ✨
        </text>
        
        <!-- Wish text background -->
        <rect x="150" y="150" width="500" height="200" rx="20" fill="rgba(255,255,255,0.9)" stroke="rgba(255,165,0,0.3)" stroke-width="2"/>
        
        <!-- Wish text -->
        <text x="400" y="220" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#333333" text-anchor="middle">
          "${wishText.substring(0, 50)}${wishText.length > 50 ? '...' : ''}"
        </text>
        
        <!-- Footer -->
        <text x="400" y="450" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#FF8C00" text-anchor="middle">
          — nice
        </text>
        
        <text x="400" y="480" font-family="system-ui, sans-serif" font-size="16" fill="#666666" text-anchor="middle">
          ${date}
        </text>
        
        ${username ? `
          <text x="400" y="510" font-family="system-ui, sans-serif" font-size="14" fill="#888888" font-style="italic" text-anchor="middle">
            @${username}
          </text>
        ` : ''}
        
        <!-- Decorative stars -->
        <text x="50" y="50" font-size="40">🌟</text>
        <text x="750" y="50" font-size="40">🌟</text>
        <text x="50" y="550" font-size="40">🌟</text>
        <text x="750" y="550" font-size="40">🌟</text>
      </svg>
    `;

    // Convert SVG to base64 data URL
    const base64 = Buffer.from(placeholderSvg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64}`;

    return NextResponse.json({ 
      imageUrl: dataUrl,
      success: true 
    });

  } catch (error) {
    console.error('Share image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate share image' },
      { status: 500 }
    );
  }
}