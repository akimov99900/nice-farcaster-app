import { NextRequest, NextResponse } from 'next/server'
import * as NftUtils from '@lab/nft-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = params.fid
    const searchParams = request.nextUrl.searchParams
    const user = searchParams.get('user') || `FID ${fid}`

    // Extract colors from user if available (for now, use defaults)
    // In a real implementation, you might fetch user data and extract colors
    const primaryColor = '#5ab0ff'
    const secondaryColor = '#ff7bfb'

    // Generate BearBrick SVG
    const generator = 
      (NftUtils as any).createBearBrickSVG || 
      (NftUtils as any).renderBearBrick || 
      (NftUtils as any).generateBearBrick || 
      (NftUtils as any).default

    if (typeof generator !== 'function') {
      throw new Error('BearBrick generator not available')
    }

    const svgMarkup = generator({
      primaryColor,
      secondaryColor,
      fid: parseInt(fid),
      username: user.includes('FID') ? undefined : user,
      displayName: user.includes('FID') ? undefined : user,
    })

    if (!svgMarkup || typeof svgMarkup !== 'string') {
      throw new Error('Failed to generate BearBrick SVG')
    }

    // Convert SVG to PNG-like response (return as SVG with proper headers)
    return new NextResponse(svgMarkup, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}