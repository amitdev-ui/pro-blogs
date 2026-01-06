import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';

  // Fetch all posts from database
  const posts = await prisma.post.findMany({
    select: {
      slug: true,
      updatedAt: true,
      date: true,
    },
    orderBy: {
      date: 'desc',
    },
  });

  // Generate sitemap entries for posts
  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/post/${post.slug}`,
    lastModified: post.updatedAt || post.date,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  return [...staticPages, ...postEntries];
}

