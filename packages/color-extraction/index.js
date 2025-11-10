const DEFAULT_PALETTE = ['#5ab0ff', '#ff7bfb']

function hashString(input) {
  const str = typeof input === 'string' ? input : JSON.stringify(input ?? '')
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function clampHex(value) {
  const hex = value.toString(16).padStart(6, '0').slice(0, 6)
  return `#${hex}`
}

function deriveColor(source, shift) {
  const base = hashString(source) + shift * 9973
  const r = (base & 0xff0000) >> 16
  const g = (base & 0x00ff00) >> 8
  const b = base & 0x0000ff
  const mixed = (r << 16) | (g << 8) | b
  return clampHex(mixed)
}

function normalizePalette(palette, count) {
  const result = Array.from(palette).filter((entry) => typeof entry === 'string' && entry.trim().length > 0)
  while (result.length < count) {
    result.push(DEFAULT_PALETTE[result.length % DEFAULT_PALETTE.length])
  }
  return result.slice(0, count)
}

function extractPalette(source, options = {}) {
  const count = Math.max(2, Number(options.count) || 2)
  const fallback = Array.isArray(options.fallback) ? options.fallback : []
  const palette = []
  const key = typeof source === 'string' && source.length > 0 ? source : 'bearbrick'

  for (let index = 0; index < count; index += 1) {
    palette.push(deriveColor(key, index + 1))
  }

  const merged = fallback.concat(palette)
  return normalizePalette(merged, count)
}

const extractColors = extractPalette

module.exports = {
  extractPalette,
  extractColors,
  default: extractPalette,
}
