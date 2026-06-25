'use client'

import Image from 'next/image'
import { useState } from 'react'
import { withBasePath } from '@/lib/base-path'
import { cn } from '@/lib/utils'

function isBrowserImage(src: string): boolean {
  return src.startsWith('data:') || src.startsWith('blob:')
}

export function RecordImage({
  src,
  alt,
  className,
  priority,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const resolvedSrc = failed ? '/placeholder.svg' : src || '/placeholder.svg'

  if (isBrowserImage(resolvedSrc)) {
    return (
      // User-uploaded data URLs should render directly and survive static export.
      <img
        src={resolvedSrc}
        alt={alt}
        className={cn('absolute inset-0 h-full w-full', className)}
        loading="eager"
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <Image
      src={withBasePath(resolvedSrc)}
      alt={alt}
      fill
      sizes="(max-width: 448px) 100vw, 448px"
      className={className}
      priority={priority}
    />
  )
}
