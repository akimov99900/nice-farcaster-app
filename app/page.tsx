'use client'

import { useEffect, useMemo, useState } from 'react'
import * as FarcasterAuth from '@lab/farcaster-auth'
import * as ColorExtraction from '@lab/color-extraction'
import * as NftUtils from '@lab/nft-utils'

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
        const result = await Promise.resolve(extractor(user.pfpUrl, { count: 2 }))
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
          </section>
        )}
      </div>
    </main>
  )
}
