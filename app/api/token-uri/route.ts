import { NextRequest, NextResponse } from 'next/server'
import * as NftUtils from '@lab/nft-utils'

// In-memory cache for token URIs per FID per session
const tokenUriCache = new Map<string, { metadata: any; tokenUri: string; timestamp: number }>()

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000

function normalizeColor(hex: string | undefined): string | null {
  if (!hex) return null
  let value = hex.trim()
  if (value.startsWith('#')) {
    value = value.slice(1)
  }
  if (!/^[0-9a-f]{6}$/i.test(value)) {
    return null
  }
  return `#${value.toLowerCase()}`
}

function generateBearBrickSVG(options: {
  fid: number
  username?: string
  displayName?: string
  primaryColor: string
  secondaryColor: string
}): string {
  const generator = (NftUtils as any).createBearBrickSVG ||
    (NftUtils as any).renderBearBrick ||
    (NftUtils as any).generateBearBrick ||
    (NftUtils as any).default

  if (typeof generator !== 'function') {
    throw new Error('BearBrick generator not available')
  }

  const svg = generator({
    primaryColor: options.primaryColor,
    secondaryColor: options.secondaryColor,
    fid: options.fid,
    username: options.username,
    displayName: options.displayName,
  })

  if (!svg || typeof svg !== 'string') {
    throw new Error('Failed to generate BearBrick SVG')
  }

  return svg
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, username, displayName, primaryColor, secondaryColor } = body

    // Validate required inputs
    if (typeof fid !== 'number' || fid <= 0) {
      return NextResponse.json(
        { error: 'Invalid fid: must be a positive number' },
        { status: 400 }
      )
    }

    if (typeof primaryColor !== 'string' || typeof secondaryColor !== 'string') {
      return NextResponse.json(
        { error: 'Invalid colors: both primaryColor and secondaryColor are required' },
        { status: 400 }
      )
    }

    // Normalize and validate colors
    const normalizedPrimary = normalizeColor(primaryColor)
    const normalizedSecondary = normalizeColor(secondaryColor)

    if (!normalizedPrimary || !normalizedSecondary) {
      return NextResponse.json(
        { error: 'Invalid color format: colors must be valid hex codes' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `${fid}:${normalizedPrimary}:${normalizedSecondary}`
    const cachedResult = tokenUriCache.get(cacheKey)
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      return NextResponse.json(cachedResult)
    }

    // Generate BearBrick SVG
    const svgMarkup = generateBearBrickSVG({
      fid,
      username,
      displayName,
      primaryColor: normalizedPrimary,
      secondaryColor: normalizedSecondary,
    })

    // Generate metadata JSON
    const userLabel = displayName || username || `FID ${fid}`
    const metadata = {
      name: `${userLabel}'s BearBrick`,
      description: `A personalized BearBrick NFT generated for ${userLabel} (FID: ${fid}). This unique BearBrick features colors sampled from the user's Farcaster avatar, creating a one-of-a-kind digital collectible that represents their identity in the Farcaster ecosystem.`,
      image: `data:image/svg+xml;base64,${Buffer.from(svgMarkup).toString('base64')}`,
      external_url: process.env.NEXT_PUBLIC_APP_URL || 'https://bearbrick.vercel.app',
      attributes: [
        {
          trait_type: 'Farcaster ID',
          value: fid.toString(),
        },
        {
          trait_type: 'User',
          value: userLabel,
        },
        {
          trait_type: 'Primary Color',
          value: normalizedPrimary,
        },
        {
          trait_type: 'Secondary Color',
          value: normalizedSecondary,
        },
        {
          trait_type: 'Collection',
          value: 'BearBrick Farcaster',
        },
        {
          trait_type: 'Platform',
          value: 'Farcaster',
        },
        {
          trait_type: 'Network',
          value: 'Base',
        },
        {
          trait_type: 'Royalty',
          value: '2%',
        },
      ],
      created_by: 'BearBrick Mini App',
      created_at: new Date().toISOString(),
    }

    // Encode metadata as base64 data URL (tokenUri)
    const metadataJson = JSON.stringify(metadata)
    const tokenUri = `data:application/json;base64,${Buffer.from(metadataJson).toString('base64')}`

    const result = { metadata, tokenUri }

    // Cache result
    tokenUriCache.set(cacheKey, {
      ...result,
      timestamp: Date.now(),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating token URI:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate token URI',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
