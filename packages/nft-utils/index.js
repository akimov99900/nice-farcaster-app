function normaliseHex(color, fallback) {
  if (typeof color !== 'string' || color.trim().length === 0) {
    return fallback
  }
  let value = color.trim()
  if (value.startsWith('#')) {
    value = value.slice(1)
  }
  if (!/^[0-9a-fA-F]{3,8}$/.test(value)) {
    return fallback
  }
  if (value.length === 3 || value.length === 4) {
    value = value
      .slice(0, 3)
      .split('')
      .map((char) => char + char)
      .join('')
  }
  return `#${value.slice(0, 6).toLowerCase()}`
}

function initialsFromUser(options) {
  if (!options) return 'BB'
  const { username, displayName, fid } = options
  const label = displayName || username || (typeof fid === 'number' ? `FID ${fid}` : 'BB')
  return label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0] || '')
    .join('')
    .toUpperCase()
    .padEnd(2, 'B')
}

function createBearBrickSVG(options = {}) {
  const primary = normaliseHex(options.primaryColor, '#5ab0ff')
  const secondary = normaliseHex(options.secondaryColor, '#ff7bfb')
  const fidText = typeof options.fid === 'number' ? `FID ${options.fid}` : 'BearBrick'
  const subtitle = options.username || options.displayName || 'Farcaster'
  const initials = initialsFromUser(options)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="360" height="420" viewBox="0 0 360 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="bearbrickTitle bearbrickSubtitle">
  <title id="bearbrickTitle">BearBrick preview</title>
  <desc id="bearbrickSubtitle">Personalised BearBrick generated for ${subtitle} (${fidText}).</desc>
  <defs>
    <linearGradient id="bearGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${primary}" />
      <stop offset="100%" stop-color="${secondary}" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="360" height="420" rx="42" fill="rgba(12, 10, 25, 0.82)" />
  <rect x="18" y="18" width="324" height="384" rx="36" fill="rgba(22, 18, 48, 0.75)" stroke="rgba(255, 255, 255, 0.08)" />
  <g transform="translate(80, 60)">
    <ellipse cx="50" cy="38" rx="38" ry="40" fill="${secondary}" opacity="0.85" />
    <ellipse cx="150" cy="38" rx="38" ry="40" fill="${secondary}" opacity="0.85" />
    <path d="M40 90C40 58 66 32 98 32H102C134 32 160 58 160 90V210C160 238 138 260 110 260H90C62 260 40 238 40 210V90Z" fill="url(#bearGradient)" />
    <ellipse cx="80" cy="118" rx="18" ry="22" fill="#fff" opacity="0.92" />
    <ellipse cx="120" cy="118" rx="18" ry="22" fill="#fff" opacity="0.92" />
    <circle cx="80" cy="118" r="7" fill="#1b133f" />
    <circle cx="120" cy="118" r="7" fill="#1b133f" />
    <ellipse cx="100" cy="148" rx="30" ry="24" fill="#fdf6ff" opacity="0.95" />
    <circle cx="100" cy="146" r="8" fill="#1b133f" />
    <path d="M78 174C82 184 90 190 100 190C110 190 118 184 122 174" stroke="#1b133f" stroke-width="6" stroke-linecap="round" />
  </g>
  <text x="180" y="332" text-anchor="middle" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="22" fill="#f7f7ff" font-weight="600">${fidText}</text>
  <text x="180" y="360" text-anchor="middle" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="16" fill="rgba(247,247,255,0.72)">${subtitle}</text>
  <g transform="translate(140, 260)">
    <circle cx="40" cy="40" r="36" fill="rgba(0,0,0,0.25)" />
    <circle cx="40" cy="40" r="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.22)" />
    <text x="40" y="48" text-anchor="middle" font-family="'Space Grotesk', 'Inter', sans-serif" font-size="26" fill="#f7f7ff" font-weight="600">${initials}</text>
  </g>
</svg>`
}

const renderBearBrick = createBearBrickSVG
const generateBearBrick = createBearBrickSVG

module.exports = {
  createBearBrickSVG,
  renderBearBrick,
  generateBearBrick,
  default: createBearBrickSVG,
}
