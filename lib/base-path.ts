const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function withBasePath(src: string): string {
  if (
    !basePath ||
    src.startsWith(basePath) ||
    src.startsWith('blob:') ||
    src.startsWith('data:') ||
    /^https?:\/\//.test(src)
  ) {
    return src
  }

  return src.startsWith('/') ? `${basePath}${src}` : `${basePath}/${src}`
}
