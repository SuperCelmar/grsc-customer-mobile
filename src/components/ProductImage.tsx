import { useState } from 'react'

type Props = {
  src?: string | null
  alt: string
  size?: number
  className?: string
}

export function ProductImage({ src, alt, size = 72, className = '' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hasImage = !!src && failedSrc !== src

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        backgroundColor: 'var(--muted)',
      }}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <span
          className="select-none font-semibold"
          style={{
            fontFamily: 'serif',
            color: 'var(--primary)',
            fontSize: Math.round(size * 0.32),
            letterSpacing: 1,
          }}
        >
          GR
        </span>
      )}
    </div>
  )
}
