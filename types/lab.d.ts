declare module '@lab/farcaster-auth' {
  export type FarcasterUser = {
    fid: number
    username?: string
    displayName?: string
    pfpUrl?: string
  }

  export interface FarcasterAuthOptions {
    mockUser?: FarcasterUser
    fallbackUser?: FarcasterUser
    onReady?: (user: FarcasterUser) => void
  }

  export interface FarcasterAuthResult {
    status?: string
    state?: string
    user?: FarcasterUser | null
    error?: unknown
    mode?: string
    isMock?: boolean
  }

  export function useFarcasterAuth(options?: FarcasterAuthOptions): FarcasterAuthResult
  const defaultExport: typeof useFarcasterAuth
  export default defaultExport
}

declare module '@lab/color-extraction' {
  export interface ColorExtractionOptions {
    count?: number
    fallback?: string[]
  }

  export type ColorExtractionResult =
    | string
    | string[]
    | {
        colors?: string[]
        primary?: string
        secondary?: string
      }

  export function extractPalette(
    source: string,
    options?: ColorExtractionOptions
  ): Promise<ColorExtractionResult> | ColorExtractionResult

  export function extractColors(
    source: string,
    options?: ColorExtractionOptions
  ): Promise<ColorExtractionResult> | ColorExtractionResult

  const defaultExport: typeof extractPalette
  export default defaultExport
}

declare module '@lab/nft-utils' {
  export interface BearBrickOptions {
    primaryColor?: string
    secondaryColor?: string
    fid?: number
    username?: string
    displayName?: string
  }

  export type BearBrickResult =
    | string
    | {
        svg?: string
        markup?: string
      }

  export function createBearBrickSVG(options?: BearBrickOptions): BearBrickResult
  export function renderBearBrick(options?: BearBrickOptions): BearBrickResult
  export function generateBearBrick(options?: BearBrickOptions): BearBrickResult
  const defaultExport: typeof createBearBrickSVG
  export default defaultExport
}
