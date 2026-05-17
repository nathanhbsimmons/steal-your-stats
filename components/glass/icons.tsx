import React from 'react'

interface IconProps {
  d: string | React.ReactNode
  size?: number
  stroke?: number
  fill?: string
  className?: string
  style?: React.CSSProperties
}

export function Icon({ d, size = 18, stroke = 1.6, fill = 'none', className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {typeof d === 'string' ? <path d={d} /> : d}
    </svg>
  )
}

export const ICONS = {
  search:    "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3",
  home:      "M3 11l9-8 9 8M5 9.5V21h5v-7h4v7h5V9.5",
  music:     "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  clock:     "M12 8v5l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z",
  mic:       "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM19 11a7 7 0 0 1-14 0M12 18v3M8 21h8",
  pin:       "M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12zM12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
  calendar:  "M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  chart:     "M3 3v18h18M7 16l4-6 4 3 5-8",
  download:  "M12 4v12m0 0l-4-4m4 4l4-4M4 20h16",
  play:      "M6 4l14 8-14 8V4z",
  pause:     "M7 4h4v16H7zM13 4h4v16h-4z",
  next:      "M5 5l10 7-10 7V5zM18 5v14",
  prev:      "M19 5L9 12l10 7V5zM6 5v14",
  volume:    "M4 9v6h4l5 4V5L8 9H4zM16.5 7.5a5 5 0 0 1 0 9M19 4.5a9 9 0 0 1 0 15",
  shuffle:   "M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5",
  list:      "M9 6h12M9 12h12M9 18h12M5 6h.01M5 12h.01M5 18h.01",
  plus:      "M12 5v14M5 12h14",
  close:     "M6 6l12 12M18 6L6 18",
  check:     "M5 12l5 5L20 7",
  chevDown:  "M6 9l6 6 6-6",
  chevRight: "M9 6l6 6-6 6",
  chevLeft:  "M15 6l-6 6 6 6",
  arrowUp:   "M12 19V5M5 12l7-7 7 7",
  arrowR:    "M5 12h14M13 5l7 7-7 7",
  external:  "M14 4h6v6M10 14L20 4M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6",
  filter:    "M3 5h18l-7 9v6l-4-2v-4L3 5z",
  bolt:      "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  star:      "M12 3l3 6 6.5 1-4.7 4.6 1.1 6.4L12 18l-5.9 3 1.1-6.4L2.5 10 9 9z",
  history:   "M3 12a9 9 0 1 0 3-6.7M3 4v5h5",
  upload:    "M12 20V8m0 0l-4 4m4-4l4 4M4 4h16",
  share:     "M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8M16 6l-4-4-4 4M12 2v13",
  cog:       "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  globe:     "M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z",
  fullscreen:"M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
  planeTakeoff: "M2 22h20 M6.36 17.4L1 5.6 3.32 4l6 11 4.77-2.12L8 2l2.47-1.1L15 12.08l4.95-2.2a2 2 0 0 1 1.6 3.66z",
  planeLand:    "M2 22h20 M3.77 10.77L2 9V4l1.5 1.5 4.9 7.9L12 12l3.12 5.39 4.68-2.08a2 2 0 0 1 1.6 3.66L9.55 21.5a1 1 0 0 1-1.08 0z",
} as const

export type IconName = keyof typeof ICONS

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent-strong)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      <path d="M22 8 L12 22 L19 22 L17 32 L28 17 L21 17 Z" fill="url(#logoGrad)" />
    </svg>
  )
}
