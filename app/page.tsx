'use client'

import { useEffect, useMemo, useState } from 'react'
import * as FarcasterAuth from '@lab/farcaster-auth'
import * as ColorExtraction from '@lab/color-extraction'
import * as NftUtils from '@lab/nft-utils'
import { 
  checkMintStatus, 
  mintWithFarcasterWallet, 
  mintWithMetaMask, 
  generateOpenSeaLink,
  generateBlockExplorerLink,
  type MintStatus,
  type MintData
} from '../lib/viem-client'

type BearBrickUser = {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

type AuthResult = {
  status?: string
  state?: string
  user?: BearBrickUser | null
  error?: unknown
  mode?: string
  isMock?: boolean
}

type AppState = 'loading' | 'ready' | 'error'

type ColorPair = {
  primary: string
  secondary: string
}

const DEFAULT_COLORS: ColorPair = {
  primary: '#5ab0ff',
  secondary: '#ff7bfb',
}

const FALLBACK_USER: BearBrickUser = {
  fid: 777000,
  username: 'bearbrick-demo',
  displayName: 'BearBrick Explorer',
}

function useFallbackAuth(options?: { mockUser?: BearBrickUser }): AuthResult {
  const [state, setState] = useState<'loading' | 'authenticated'>('loading')
  const [user, setUser] = useState<BearBrickUser | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const mock = options?.mockUser ?? FALLBACK_USER
      setUser(mock)
      setState('authenticated')
    }, 500)

    return () => clearTimeout(timeout)
  }, [options?.mockUser])

  return {
    status: state,
    user,
    mode: 'mock',
    isMock: true,
  }
}

const useAuthHook: (options?: unknown) => AuthResult = (
  ((FarcasterAuth as unknown as { useFarcasterAuth?: (options?: unknown) => AuthResult; default?: (options?: unknown) => AuthResult }).useFarcasterAuth ??
    (FarcasterAuth as unknown as { useFarcasterAuth?: (options?: unknown) => AuthResult; default?: (options?: unknown) => AuthResult }).default ??
    useFallbackAuth)
) as (options?: unknown) => AuthResult

function normalizeHex(input: string): string | null {
  if (!input) return null
  let value = input.trim().replace(/^0x/i, '')
  if (!value) return null
  if (value.startsWith('#')) {
    value = value.slice(1)
  }
  if (!/^[0-9a-f]{3,8}$/i.test(value)) {
    return null
  }
  if (value.length === 3 || value.length === 4) {
    value = value
      .slice(0, 3)
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (value.length !== 6) {
    value = value.padEnd(6, value[value.length - 1] ?? 'f').slice(0, 6)
  }
  return `#${value.toLowerCase()}`
}

function normalizeColor(color: string | undefined, fallback: string): string {
  const fallbackHex = normalizeHex(fallback) ?? DEFAULT_COLORS.primary
  if (!color) return fallbackHex
  const trimmed = color.trim()
  if (/^rgb/i.test(trimmed)) {
    const channelMatches = trimmed.match(/\d+/g)
    if (channelMatches && channelMatches.length >= 3) {
      const [r, g, b] = channelMatches.slice(0, 3).map((value) => {
        const parsed = Number.parseInt(value, 10)
        if (Number.isNaN(parsed)) return 0
        return Math.max(0, Math.min(255, parsed))
      })
      return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
    }
    return fallbackHex
  }
  const normalised = normalizeHex(trimmed)
  return normalised ?? fallbackHex
}

function lightenColor(hexColor: string, factor = 0.25): string {
  const base = normalizeHex(hexColor)
  if (!base) return hexColor
  const value = base.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * Math.min(Math.max(factor, 0), 1))
  return `#${[mix(r), mix(g), mix(b)].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function withOpacity(hexColor: string, alpha: number): string {
  const base = normalizeHex(hexColor) ?? normalizeHex(DEFAULT_COLORS.primary)
  if (!base) {
    return `rgba(255, 255, 255, ${alpha})`
  }
  const value = base.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function extractArrayOfColors(result: unknown): string[] {
  if (!result) return []
  if (typeof result === 'string') return [result]
  if (Array.isArray(result)) return result.filter((value): value is string => typeof value === 'string')
  if (typeof result === 'object') {
    const output: string[] = []
    const maybeRecord = result as Record<string, unknown>
    if (typeof maybeRecord.primary === 'string') output.push(maybeRecord.primary)
    if (typeof maybeRecord.secondary === 'string') output.push(maybeRecord.secondary)
    if (Array.isArray(maybeRecord.colors)) {
      output.push(...maybeRecord.colors.filter((value): value is string => typeof value === 'string'))
    }
    return output
  }
  return []
}

export default function Home() {
  const auth = useAuthHook({
    mockUser: FALLBACK_USER,
    fallbackUser: FALLBACK_USER,
  })

  const user = auth?.user ?? null
  const statusText = `${auth?.status ?? auth?.state ?? ''}`.toLowerCase()

  let appState: AppState = 'loading'
  if (auth?.error || statusText.includes('error') || statusText.includes('fail')) {
    appState = 'error'
  } else if (user) {
    appState = 'ready'
  }

  const [colors, setColors] = useState<ColorPair>(DEFAULT_COLORS)
  const [colorSource, setColorSource] = useState<'avatar' | 'fallback'>('fallback')
  
  // Mint state
  const [mintStatus, setMintStatus] = useState<MintStatus>('idle')
  const [mintData, setMintData] = useState<MintData>({})
  const [isCheckingMintStatus, setIsCheckingMintStatus] = useState(false)
  
  // Token URI cache per FID
  const [tokenUriCache, setTokenUriCache] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    const extractor =
      (ColorExtraction as unknown as {
        extractPalette?: (source: string, options?: unknown) => unknown
        extractColors?: (source: string, options?: unknown) => unknown
        default?: (source: string, options?: unknown) => unknown
      }).extractPalette ??
      (ColorExtraction as unknown as {
        extractPalette?: (source: string, options?: unknown) => unknown
        extractColors?: (source: string, options?: unknown) => unknown
        default?: (source: string, options?: unknown) => unknown
      }).extractColors ??
      (ColorExtraction as unknown as {
        extractPalette?: (source: string, options?: unknown) => unknown
        extractColors?: (source: string, options?: unknown) => unknown
        default?: (source: string, options?: unknown) => unknown
      }).default

    if (!user?.pfpUrl || typeof extractor !== 'function') {
      setColors(DEFAULT_COLORS)
      setColorSource('fallback')
      return
    }

    let cancelled = false

    const runExtraction = async () => {
      try {
        const result = await Promise.resolve(extractor(user.pfpUrl!, { count: 2 }))
        if (cancelled) return
        const palette = extractArrayOfColors(result)
        if (palette.length === 0) {
          setColors(DEFAULT_COLORS)
          setColorSource('fallback')
          return
        }
        const primary = normalizeColor(palette[0], DEFAULT_COLORS.primary)
        const secondaryCandidate = palette[1] ? normalizeColor(palette[1], DEFAULT_COLORS.secondary) : null
        const secondary = secondaryCandidate ?? normalizeColor(lightenColor(primary, 0.32), DEFAULT_COLORS.secondary)
        setColors({ primary, secondary })
        setColorSource('avatar')
      } catch (error) {
        if (cancelled) return
        console.warn('Color extraction failed, using defaults.', error)
        setColors(DEFAULT_COLORS)
        setColorSource('fallback')
      }
    }

    runExtraction()

    return () => {
      cancelled = true
    }
  }, [user?.pfpUrl])

  // Check mint status when user is available
  useEffect(() => {
    if (!user?.fid || isCheckingMintStatus) return

    const checkStatus = async () => {
      setIsCheckingMintStatus(true)
      setMintStatus('checking')
      
      try {
        const result = await checkMintStatus(user.fid)
        if (result.hasMinted) {
          setMintStatus('already-minted')
          setMintData({ tokenId: result.tokenId })
        } else {
          setMintStatus('eligible')
        }
      } catch (error) {
        console.error('Error checking mint status:', error)
        setMintStatus('idle')
      } finally {
        setIsCheckingMintStatus(false)
      }
    }

    checkStatus()
  }, [user?.fid, isCheckingMintStatus])

  const handleMint = async () => {
    if (!user?.fid || mintStatus === 'minting') return

    try {
      setMintStatus('minting')
      
      // Check cache first
      let tokenUri = tokenUriCache.get(user.fid)
      
      if (!tokenUri) {
        // Call token-uri endpoint to generate metadata and tokenUri
        const response = await fetch('/api/token-uri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid: user.fid,
            username: user.username,
            displayName: user.displayName,
            primaryColor: colors.primary,
            secondaryColor: colors.secondary,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to generate token URI')
        }

        const { tokenUri: generatedTokenUri } = await response.json()
        tokenUri = generatedTokenUri
        
        if (!tokenUri) {
          throw new Error('No token URI received from endpoint')
        }
        
        // Cache the result
        setTokenUriCache(prev => {
          const updated = new Map(prev)
          updated.set(user.fid, tokenUri as string)
          return updated
        })
      }
      
      if (!tokenUri) {
        throw new Error('Failed to obtain token URI')
      }
      
      // Try Farcaster wallet first, then fallback to MetaMask
      let result
      if (typeof window !== 'undefined' && (window as any).__farcasterSdk?.wallet) {
        setMintStatus('awaiting-signature')
        result = await mintWithFarcasterWallet(user.fid, tokenUri, (window as any).__farcasterSdk.wallet)
      } else {
        setMintStatus('awaiting-signature')
        result = await mintWithMetaMask(user.fid, tokenUri)
      }

      setMintStatus('confirmed')
      setMintData({
        tokenId: result.tokenId,
        transactionHash: result.transactionHash
      })
    } catch (error) {
      console.error('Mint failed:', error)
      setMintStatus('failed')
      setMintData({ error: error instanceof Error ? error.message : 'Mint failed' })
    }
  }

  const bearBrickMarkup = useMemo(() => {
    const generator =
      (NftUtils as unknown as {
        createBearBrickSVG?: (options?: unknown) => unknown
        renderBearBrick?: (options?: unknown) => unknown
        generateBearBrick?: (options?: unknown) => unknown
        default?: (options?: unknown) => unknown
      }).createBearBrickSVG ??
      (NftUtils as unknown as {
        createBearBrickSVG?: (options?: unknown) => unknown
        renderBearBrick?: (options?: unknown) => unknown
        generateBearBrick?: (options?: unknown) => unknown
        default?: (options?: unknown) => unknown
      }).renderBearBrick ??
      (NftUtils as unknown as {
        createBearBrickSVG?: (options?: unknown) => unknown
        renderBearBrick?: (options?: unknown) => unknown
        generateBearBrick?: (options?: unknown) => unknown
        default?: (options?: unknown) => unknown
      }).generateBearBrick ??
      (NftUtils as unknown as {
        createBearBrickSVG?: (options?: unknown) => unknown
        renderBearBrick?: (options?: unknown) => unknown
        generateBearBrick?: (options?: unknown) => unknown
        default?: (options?: unknown) => unknown
      }).default

    if (typeof generator !== 'function') {
      return null
    }

    try {
      const result = generator({
        primaryColor: colors.primary,
        secondaryColor: colors.secondary,
        fid: user?.fid,
        username: user?.username,
        displayName: user?.displayName,
      })
      if (typeof result === 'string') return result
      if (result && typeof result === 'object') {
        const maybeRecord = result as Record<string, unknown>
        if (typeof maybeRecord.svg === 'string') return maybeRecord.svg
        if (typeof maybeRecord.markup === 'string') return maybeRecord.markup
      }
    } catch (error) {
      console.error('BearBrick generation failed.', error)
    }

    return null
  }, [colors.primary, colors.secondary, user?.displayName, user?.fid, user?.username])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="bearbrick-shell">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="profile-ring" aria-hidden={!user?.pfpUrl}>
                {user?.pfpUrl ? (
                  <img src={user.pfpUrl} alt={`${user.displayName ?? user.username ?? 'Farcaster user'} avatar`} />
                ) : (
                  <span role="img" aria-label="BearBrick">
                    🧸
                  </span>
                )}
              </div>
              <div>
                <p className="bearbrick-status">BearBrick</p>
                <h1 className="bearbrick-headline">Personalized NFT Preview</h1>
              </div>
            </div>
            <p className="bearbrick-subtitle">
              {user?.displayName ?? user?.username
                ? `${user.displayName ?? user.username}\u2019s BearBrick is styled with tones sampled from their Farcaster avatar.`
                : 'Authenticate with Farcaster to see a BearBrick companion styled with tones sampled from your avatar.'}
            </p>
          </div>

          <div className="flex items-start justify-end">
            <span className="fid-badge">
              <span>FID</span>
              <strong>{user?.fid ?? '—'}</strong>
            </span>
          </div>
        </div>

        <div className="section-divider" aria-hidden="true" />

        {appState === 'loading' && (
          <section className="flex flex-col items-center gap-6 text-center" aria-live="polite">
            <div className="bearbrick-preview">
              <div className="bearbrick-fallback">
                <div className="bearbrick-fallback-icon" role="img" aria-label="Loading BearBrick preview">
                  🧩
                </div>
                <p>Preparing your BearBrick preview—syncing identity data.</p>
              </div>
            </div>
            <p className="muted-note">Connecting to Farcaster and aligning your avatar palette.</p>
          </section>
        )}

        {appState === 'error' && (
          <section className="flex flex-col items-center gap-6 text-center" aria-live="assertive">
            <div className="bearbrick-preview">
              <div className="bearbrick-fallback">
                <div className="bearbrick-fallback-icon" role="img" aria-label="Authentication error">
                  ⚠️
                </div>
                <p>We couldn’t verify your Farcaster account.</p>
                <p className="muted-note">Open BearBrick inside the Farcaster client or try again shortly.</p>
              </div>
            </div>
          </section>
        )}

        {appState === 'ready' && (
          <section className="flex flex-col gap-8" aria-live="polite">
            <div className="bearbrick-preview" style={{
              background: `linear-gradient(135deg, ${withOpacity(colors.primary, 0.18)} 0%, ${withOpacity(colors.secondary, 0.3)} 100%)`,
            }}>
              {bearBrickMarkup ? (
                <div aria-label="BearBrick NFT preview" dangerouslySetInnerHTML={{ __html: bearBrickMarkup }} />
              ) : (
                <div className="bearbrick-fallback">
                  <div className="bearbrick-fallback-icon" role="img" aria-label="BearBrick preview placeholder">
                    🧸
                  </div>
                  <p>BearBrick render will appear once the generator responds.</p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="color-pill"
                style={{
                  borderColor: withOpacity(colors.primary, 0.35),
                  background: withOpacity(colors.primary, 0.12),
                }}
              >
                <span className="color-swatch" style={{ background: colors.primary }} aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Primary hue</p>
                  <p className="text-base font-semibold">{colors.primary}</p>
                </div>
              </div>

              <div
                className="color-pill"
                style={{
                  borderColor: withOpacity(colors.secondary, 0.35),
                  background: withOpacity(colors.secondary, 0.12),
                }}
              >
                <span className="color-swatch" style={{ background: colors.secondary }} aria-hidden="true" />
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/60">Accent hue</p>
                  <p className="text-base font-semibold">{colors.secondary}</p>
                </div>
              </div>
            </div>

            <p className="muted-note">
              Palette source: {colorSource === 'avatar' ? 'derived from your Farcaster avatar' : 'default BearBrick spectrum'}.
            </p>

            {/* Mint Section */}
            <div className="flex flex-col gap-6">
              {isCheckingMintStatus && (
                <div className="text-center">
                  <p className="text-sm text-white/60">Checking mint eligibility...</p>
                </div>
              )}

              {mintStatus === 'eligible' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">Mint Your BearBrick NFT</h3>
                    <p className="text-sm text-white/70 mb-4">
                      Mint your personalized BearBrick on Base for 0.00001 ETH
                    </p>
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={['minting', 'awaiting-signature', 'pending'].includes(mintStatus)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {['minting', 'awaiting-signature', 'pending'].includes(mintStatus) ? 'Processing...' : 'Mint for 0.00001 ETH'}
                  </button>
                </div>
              )}

              {mintStatus === 'already-minted' && mintData.tokenId && (
                <div className="flex flex-col items-center gap-4 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Already Minted!</h3>
                    <p className="text-sm text-white/70 mb-2">
                      Your BearBrick NFT (Token ID: {mintData.tokenId.toString()}) is ready
                    </p>
                  </div>
                  <a
                    href={generateOpenSeaLink(mintData.tokenId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    View on OpenSea
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-white/50 text-center">
                    2% royalty supports the BearBrick ecosystem
                  </p>
                </div>
              )}

              {(mintStatus === 'awaiting-signature' || mintStatus === 'minting' || mintStatus === 'pending') && (
                <div className="flex flex-col items-center gap-4 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                      {mintStatus === 'awaiting-signature' ? 'Awaiting Signature' : 
                       mintStatus === 'minting' ? 'Minting...' : 'Confirming Transaction'}
                    </h3>
                    <p className="text-sm text-white/70">
                      {mintStatus === 'awaiting-signature' 
                        ? 'Please approve the transaction in your wallet'
                        : 'Your BearBrick is being minted on Base'}
                    </p>
                  </div>
                </div>
              )}

              {mintStatus === 'confirmed' && mintData.tokenId && mintData.transactionHash && (
                <div className="flex flex-col items-center gap-4 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Successfully Minted! 🎉</h3>
                    <p className="text-sm text-white/70 mb-2">
                      Your BearBrick NFT (Token ID: {mintData.tokenId.toString()}) is ready
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={generateOpenSeaLink(mintData.tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View on OpenSea
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <a
                      href={generateBlockExplorerLink(mintData.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      View Transaction
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </a>
                  </div>
                  <p className="text-xs text-white/50 text-center">
                    2% royalty supports the BearBrick ecosystem
                  </p>
                </div>
              )}

              {mintStatus === 'failed' && (
                <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Mint Failed</h3>
                    <p className="text-sm text-white/70 mb-4">
                      {mintData.error || 'Something went wrong during minting'}
                    </p>
                    <button
                      onClick={handleMint}
                      className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
