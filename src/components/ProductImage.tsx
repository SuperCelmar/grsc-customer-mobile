import { useState } from 'react'

type Props = {
  src?: string | null
  alt: string
  size?: number
  className?: string
  imageClassName?: string
  fill?: boolean
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'high' | 'low' | 'auto'
}

export function ProductImage({
  src,
  alt,
  size = 72,
  className = '',
  imageClassName = '',
  fill = false,
  loading = 'lazy',
  fetchPriority = 'auto',
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hasImage = !!src && failedSrc !== src
  const wrapperStyle = fill
    ? { borderRadius: 6, backgroundColor: 'var(--muted)' }
    : { width: size, height: size, borderRadius: 6, backgroundColor: 'var(--muted)' }

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center overflow-hidden ${className}`}
      style={wrapperStyle}
    >
      {hasImage ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          className={`w-full h-full object-cover ${imageClassName}`}
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
