import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://board-ten-orcin.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/board/'],
      disallow: ['/board/write', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
