import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com';
  const siteName = 'Blog Journal';
  const siteDescription = 'Discover curated articles, insights, and inspiration from top creators.';

  // Fetch latest 50 posts
  const posts = await prisma.post.findMany({
    select: {
      slug: true,
      title: true,
      description: true,
      date: true,
      author: true,
      category: true,
      coverImage: true,
      thumbnail: true,
    },
    orderBy: {
      date: 'desc',
    },
    take: 50,
  });

  const rssItems = posts.map((post) => {
    const imageUrl = post.coverImage || post.thumbnail || `${siteUrl}/og-default.jpg`;
    const description = post.description || post.title;
    const postUrl = `${siteUrl}/post/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();

    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <author>${post.author}</author>
      <category>${post.category || 'General'}</category>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${imageUrl}" type="image/jpeg" />
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title><![CDATA[${siteName}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>${siteName}</title>
      <link>${siteUrl}</link>
    </image>
${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

