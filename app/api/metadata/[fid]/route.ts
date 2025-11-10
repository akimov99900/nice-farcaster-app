import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } }
) {
  try {
    const fid = params.fid
    const searchParams = request.nextUrl.searchParams
    const user = searchParams.get('user') || `FID ${fid}`

    // Generate metadata for the BearBrick NFT
    const metadata = {
      name: `${user}'s BearBrick`,
      description: `A personalized BearBrick NFT generated for ${user} (FID: ${fid}). This unique BearBrick features colors sampled from the user's Farcaster avatar, creating a one-of-a-kind digital collectible that represents their identity in the Farcaster ecosystem.`,
      image: `${process.env.NEXT_PUBLIC_APP_URL}/api/image/${fid}?user=${encodeURIComponent(user)}`,
      external_url: process.env.NEXT_PUBLIC_APP_URL,
      attributes: [
        {
          trait_type: "Farcaster ID",
          value: fid
        },
        {
          trait_type: "User",
          value: user
        },
        {
          trait_type: "Collection",
          value: "BearBrick Farcaster"
        },
        {
          trait_type: "Platform",
          value: "Farcaster"
        },
        {
          trait_type: "Network",
          value: "Base"
        },
        {
          trait_type: "Royalty",
          value: "2%"
        }
      ],
      created_by: "BearBrick Mini App",
      created_at: new Date().toISOString()
    }

    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error generating metadata:', error)
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    )
  }
}