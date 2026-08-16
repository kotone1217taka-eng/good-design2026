const githubPagesBasePath = '/good-design2026'
const isGithubPages = process.env.GITHUB_PAGES === 'true'
const basePath = isGithubPages ? githubPagesBasePath : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  output: isGithubPages ? 'export' : undefined,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

export default nextConfig
