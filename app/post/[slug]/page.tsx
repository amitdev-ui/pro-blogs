import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/date-utils";
import { getPostBySlug, getPostsFromDB, getAdsForPlacement, type PostWithContent } from "@/lib/post-utils";
import AdSlot from "@/components/AdSlot";
import ScrollableRelatedArticles from "@/components/ScrollableRelatedArticles";
import ScrollToTop from "@/components/ScrollToTop";
import * as cheerio from "cheerio";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The post you're looking for doesn't exist.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  const imageUrl = post.coverImage || post.thumbnail || `${siteUrl}/og-default.jpg`;
  const description = post.description || post.title;
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const keywords = [post.category, ...tags].filter(Boolean).join(", ");

  return {
    title: `${post.title} | Blog Journal`,
    description: description.slice(0, 160),
    keywords: keywords || undefined,
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: post.author,
    openGraph: {
      type: "article",
      title: post.title,
      description: description.slice(0, 160),
      url: `${siteUrl}/post/${slug}`,
      siteName: "Blog Journal",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      authors: [post.author],
      section: post.category || undefined,
      tags: tags.length > 0 ? tags : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: description.slice(0, 160),
      images: [imageUrl],
      creator: `@${post.author.replace(/\s+/g, "").toLowerCase()}`,
    },
    alternates: {
      canonical: `${siteUrl}/post/${slug}`,
    },
    other: {
      "article:published_time": post.date,
      "article:author": post.author,
      "article:section": post.category || "",
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <div className="container mx-auto max-w-[900px] px-6 md:px-8 py-16 md:py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#111827] mb-4">Post not found</h1>
          <p className="text-[#6B7280] mb-8">The post you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/articles"
            className="inline-block px-6 py-2 bg-[#111827] text-white rounded-md hover:bg-[#111827]/90 transition-colors"
          >
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const initials = post.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get related posts from database (prioritize same category, then recent others)
  const allPosts = await getPostsFromDB(60);
  
  // Get ads for sidebar (8 ads for 8 posts)
  const sidebarAds = await getAdsForPlacement("sidebar", 8);
  
  // Get ads for content (at 30%, 60%, and 90% of word count)
  const contentAds = await getAdsForPlacement("inline", 3);
  
  // Get mobile ads (fixed dimensions: 100% width × 250px height)
  const mobileAds = await getAdsForPlacement("mobile", 3);
  
  // Debug: Log ads to see if they're being fetched (server-side only)
  if (typeof window === 'undefined') {
    console.log("=== INLINE ADS DEBUG ===");
    console.log("Content ads count:", contentAds.length);
    if (contentAds.length > 0) {
      contentAds.forEach((ad: any, index: number) => {
        console.log(`Ad ${index + 1}:`, {
          id: ad.id,
          title: ad.title,
          placement: ad.placement,
          isActive: ad.isActive,
          hasAdCode: !!ad.adCode,
          adCodeLength: ad.adCode?.length || 0
        });
      });
    } else {
      console.log("⚠️ NO INLINE ADS FOUND!");
      console.log("Make sure you have ads with placement 'Blog Details Page (Inside Content)' and they are active.");
    }
    console.log("========================");
  }

  // Estimate content length in words to decide how many related posts to show
  const plainText = (post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = plainText ? plainText.split(" ").length : 0;

  // Dynamic related posts based on article length - more for longer articles
  let maxRelated = 6;
  if (wordCount > 2000) {
    // Very long article → show many related posts to fill sidebar
    maxRelated = 15;
  } else if (wordCount > 1500) {
    // Long article → show more related posts
    maxRelated = 12;
  } else if (wordCount > 900) {
    // Medium-long article
    maxRelated = 8;
  } else if (wordCount < 400) {
    // Very short article → only a couple of related items
    maxRelated = 2;
  } else if (wordCount < 700) {
    // Short / medium-short article
    maxRelated = 4;
  }

  const sameCategory =
    post.category
      ? allPosts.filter(
          (p) =>
            p.id !== post.id &&
            (p.category || "").toLowerCase() === post.category.toLowerCase()
        )
      : [];

  const others = allPosts.filter(
    (p) => p.id !== post.id && !sameCategory.find((c) => c.id === p.id)
  );

  const relatedPosts = [...sameCategory, ...others].slice(0, maxRelated);

  // Generate structured data (JSON-LD) for SEO
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com";
  const imageUrl = post.coverImage || post.thumbnail || `${siteUrl}/og-default.jpg`;
  const plainTextContent = (post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description || post.title,
    image: imageUrl,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: post.author,
      image: post.authorImage || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "Blog Journal",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/post/${slug}`,
    },
    articleSection: post.category || "General",
    keywords: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || post.category || "",
    wordCount: wordCount,
    timeRequired: post.readingTime || undefined,
  };

  return (
    <main className="w-full bg-[#F3F4F6]">
      {/* Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 py-6 md:py-10">
        {/* Header strip */}
        <header className="mb-4 md:mb-6 border-b border-[#E5E7EB] pb-3 md:pb-4 flex flex-row items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
            <nav className="mb-2">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#6B7280]">
            <Link href="/" className="hover:text-[#111827] transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-[#111827] transition-colors">
              Articles
            </Link>
                {post.category && (
                  <>
            <span>/</span>
            <span className="text-[#111827]">{post.category}</span>
                  </>
                )}
          </div>
        </nav>

            {/* Meta row to fill space */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#6B7280]">
              <span className="px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide bg-[#EEF2FF] text-[#3730A3]">
                Article
              </span>
              {post.category && (
                <span className="px-2 py-0.5 text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                  {post.category}
                </span>
              )}
              <span className="text-[#E5E7EB]">•</span>
              <span>{formatDate(post.date)}</span>
              {post.readingTime && (
                <>
                  <span className="text-[#E5E7EB]">•</span>
                  <span>{post.readingTime}</span>
                </>
              )}
            </div>
          </div>

          {/* Right-side action button to fill empty space */}
          <div className="flex items-center flex-shrink-0">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border border-[#E5E7EB] hover:border-[#111827] text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors whitespace-nowrap"
            >
              ← Back to articles
            </Link>
          </div>
        </header>

        {/* Main layout: article on the left, sidebar on the right */}
        <div className="grid gap-6 md:gap-8 lg:gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          {/* Article card */}
          <article className="bg-white border border-[#E5E7EB] shadow-md md:shadow-lg rounded-none px-5 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 lg:col-start-1">
        {/* Article Header */}
            <header className="mb-6 md:mb-10">
          {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[32px] font-semibold text-[#111827] leading-tight mb-3 md:mb-6">
            {post.title}
          </h1>

          {/* Metadata Row */}
              <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorImage} alt={post.author} />
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap items-center gap-2 text-sm md:text-[15px] text-[#6B7280]">
              <span className="font-medium text-[#111827]">{post.author}</span>
              <span className="text-[#E5E7EB]">•</span>
              <span>{formatDate(post.date)}</span>
              <span className="text-[#E5E7EB]">•</span>
              <span>{post.readingTime}</span>
            </div>
          </div>

              {/* Top Ad Slot - Fixed height range: 250px to 280px (Mobile & Desktop) */}
              {mobileAds.length > 0 && mobileAds[0] && (mobileAds[0] as any).adCode ? (
                <section className="mt-4 block" style={{ width: '100%', height: '250px', maxHeight: '280px', overflow: 'hidden' }}>
                  <div 
                    className="w-full h-full"
                    style={{ 
                      width: '100%', 
                      height: '250px',
                      maxHeight: '280px',
                      border: '1px solid #E5E7EB',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ __html: (mobileAds[0] as any).adCode }}
                  />
                </section>
              ) : (
                <section className="mt-4 block border-2 border-dashed border-[#D1D5DB] rounded-none p-4 bg-[#F9FAFB]">
                  <h3 className="text-sm font-semibold text-[#6B7280] mb-1">
                    Top Ad Slot (100% × 250-280px)
                </h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Add ads with placement "Mobile" to display here. Accepts ads from 250px to 280px height.
                </p>
              </section>
              )}
        </header>


        {/* Cover Image */}
        {(post.coverImage || post.thumbnail) && (
              <div className="-mx-5 sm:mx-0">
                <div className="relative w-full h-[220px] sm:h-[260px] md:h-[360px] lg:h-[420px] rounded-none overflow-hidden mb-6 sm:mb-8 md:mb-10 shadow-none bg-[#F9FAFB]">
            <Image
                    src={
                      post.coverImage ||
                      post.thumbnail ||
                      "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=1200&h=600&fit=crop&q=80"
                    }
              alt={post.title}
              fill
              className="object-cover"
              priority
                    unoptimized={(post.coverImage || post.thumbnail || "").startsWith("http")}
            />
                </div>
          </div>
        )}


        {/* Article Body */}
        <div className="max-w-none">
          <div className="text-base md:text-lg text-[#374151] leading-[1.75] space-y-6">
            {/* Introduction */}
                <p className="text-base sm:text-lg md:text-xl font-medium text-[#111827] leading-relaxed">
              {post.description}
            </p>

            {/* Content from database */}
            {post.content && post.content.trim().length > 0 ? (
              (() => {
                try {
                  const $ = cheerio.load(post.content);
                  const plainText = $.text();
                  const words = plainText.split(/\s+/).filter(w => w.length > 0);
                  const totalWords = words.length;
                  
                  // Calculate word positions for ads: 30%, 60%, and 90%
                  const adPositions = [
                    Math.floor(totalWords * 0.30),
                    Math.floor(totalWords * 0.60),
                    Math.floor(totalWords * 0.90)
                  ];
                  
                  // Debug info (server-side only)
                  if (typeof window === 'undefined') {
                    console.log('=== BLOG CONTENT ANALYSIS ===');
                    console.log('Total words:', totalWords);
                    console.log('Ad positions (30%, 60%, 90%):', adPositions);
                    console.log('Content ads count:', contentAds.length);
                    console.log('Has ads:', contentAds.length > 0);
                    console.log('Will insert ads:', totalWords >= 100 && contentAds.length > 0);
                    if (contentAds.length > 0) {
                      contentAds.forEach((ad: any, idx: number) => {
                        console.log(`Ad ${idx + 1}:`, {
                          id: ad.id,
                          title: ad.title,
                          hasAdCode: !!ad.adCode,
                          adCodeLength: ad.adCode?.length || 0
                        });
                      });
                    }
                  }
                  
                  // Always show content, but insert ads if conditions are met
                  const shouldInsertAds = totalWords >= 100 && contentAds.length > 0;
                  
                  // Helper function to create ad HTML
                  const createAdHtml = (ad: any, adIndex: number, position: string) => {
                    const adCode = ad.adCode as string | null | undefined;
                    
                    if (!adCode) {
                      return `
                        <div class="my-6 md:my-8 ad-slot-inline" style="width: 100%; max-width: 300px; height: 250px; margin: 24px auto; display: flex; align-items: center; justify-content: center; border: 2px dashed #E5E7EB; background: #F9FAFB;">
                          <div class="text-center p-4 text-sm text-[#6B7280]">
                            <p class="font-semibold">Ad Slot (${position})</p>
                            <p class="text-xs mt-1">No ad code configured for: ${ad.title || 'Unknown'}</p>
                          </div>
                        </div>
                      `;
                    }
                    
                    // Extract dimensions from ad code if not provided
                    let adWidth = ad.width as number | null | undefined;
                    let adHeight = ad.height as number | null | undefined;
                    
                    if (!adWidth || !adHeight) {
                      const widthMatch = adCode.match(/(?:width|w)\s*[=:]\s*["']?(\d+)/i);
                      const heightMatch = adCode.match(/(?:height|h)\s*[=:]\s*["']?(\d+)/i);
                      
                      if (widthMatch && !adWidth) adWidth = parseInt(widthMatch[1]);
                      if (heightMatch && !adHeight) adHeight = parseInt(heightMatch[1]);
                    }
                    
                    adWidth = adWidth || 300;
                    adHeight = adHeight || 250;
                    
                    const isColumnAd = adWidth <= 200;
                    const isBannerAd = adWidth >= 600;
                    const maxWidth = isColumnAd 
                      ? adWidth 
                      : isBannerAd 
                        ? Math.min(adWidth, 728) 
                        : adWidth;
                    
                    return `
                      <div class="my-6 md:my-8 ad-slot-inline" style="width: 100%; max-width: ${maxWidth}px; height: ${adHeight}px; min-height: ${Math.min(adHeight, 50)}px; margin: 24px auto; display: block; position: relative; border: 2px dashed #E5E7EB; background: #F9FAFB; padding: 8px;">
                        <div class="ad-content-wrapper" style="width: 100%; height: 100%; position: relative; overflow: visible; background: white; border: 1px solid #E5E7EB;">
                          ${adCode}
                        </div>
                        <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; padding: 2px 6px; font-size: 10px; border-radius: 3px; z-index: 10;">Ad ${adIndex + 1} (${position})</div>
                      </div>
                    `;
                  };
                  
                  // Method 1: Try block-level element insertion (preferred)
                  const blockElements = $('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, figure, img').toArray();
                  
                  if (blockElements.length > 0 && shouldInsertAds) {
                  let processedHtml = '';
                  let currentWordCount = 0;
                  let currentElements: any[] = [];
                    let adIndex = 0;
                    let insertedAdsCount = 0;
                  
                  blockElements.forEach((element) => {
                    const $el = $(element);
                    const elText = $el.text();
                    const elWords = elText.split(/\s+/).filter(w => w.length > 0);
                    
                    currentWordCount += elWords.length;
                    currentElements.push(element);
                    
                      // Check if we've reached an ad position
                      if (adIndex < adPositions.length && currentWordCount >= adPositions[adIndex] && adIndex < contentAds.length) {
                        // Add accumulated elements BEFORE the ad
                      currentElements.forEach(el => {
                        processedHtml += $.html($(el));
                      });
                      
                        const ad = contentAds[adIndex] as any;
                        const position = adIndex === 0 ? '30%' : adIndex === 1 ? '60%' : '90%';
                        
                        if (typeof window === 'undefined') {
                          console.log(`✅ INSERTING AD at ${position} (word ${currentWordCount} of ${totalWords}):`, {
                            adId: ad.id,
                            adTitle: ad.title,
                            hasAdCode: !!ad.adCode
                          });
                        }
                        
                        processedHtml += createAdHtml(ad, adIndex, position);
                        insertedAdsCount++;
                      currentElements = [];
                      adIndex++;
                    }
                  });
                  
                  // Add remaining elements
                  currentElements.forEach(el => {
                    processedHtml += $.html($(el));
                  });
                  
                    if (processedHtml && processedHtml.trim() !== '' && insertedAdsCount > 0) {
                      if (typeof window === 'undefined') {
                        console.log(`✅ METHOD 1 SUCCESS: Inserted ${insertedAdsCount} ads using block elements`);
                      }
                      return (
                        <div className="article-content space-y-6">
                          <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                        </div>
                      );
                    }
                  }
                  
                  // Method 2: Fallback - Split by paragraphs and insert ads
                  if (shouldInsertAds) {
                    const paragraphs = $('p').toArray();
                    
                    if (paragraphs.length >= 3) {
                      let processedHtml = '';
                      let currentWordCount = 0;
                      let adIndex = 0;
                      let insertedAdsCount = 0;
                      
                      paragraphs.forEach((para, paraIndex) => {
                        const $para = $(para);
                        const paraText = $para.text();
                        const paraWords = paraText.split(/\s+/).filter(w => w.length > 0);
                        
                        currentWordCount += paraWords.length;
                        processedHtml += $.html($para);
                        
                        // Insert ad after paragraph if we've reached a position
                        if (adIndex < adPositions.length && currentWordCount >= adPositions[adIndex] && adIndex < contentAds.length) {
                          const ad = contentAds[adIndex] as any;
                          const position = adIndex === 0 ? '30%' : adIndex === 1 ? '60%' : '90%';
                          
                          if (typeof window === 'undefined') {
                            console.log(`✅ INSERTING AD (Method 2) at ${position} (word ${currentWordCount} of ${totalWords}):`, {
                              adId: ad.id,
                              adTitle: ad.title,
                              paragraphIndex: paraIndex
                            });
                          }
                          
                          processedHtml += createAdHtml(ad, adIndex, position);
                          insertedAdsCount++;
                          adIndex++;
                        }
                      });
                      
                      // Add remaining content (non-paragraph elements)
                      $('*').not('p').each((_, el) => {
                        const $el = $(el);
                        if ($el.parent().length === 0 || $el.parent().is('body, html')) {
                          processedHtml += $.html($el);
                        }
                      });
                      
                      if (insertedAdsCount > 0) {
                        if (typeof window === 'undefined') {
                          console.log(`✅ METHOD 2 SUCCESS: Inserted ${insertedAdsCount} ads using paragraph splitting`);
                        }
                        return (
                          <div className="article-content space-y-6">
                            <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                          </div>
                        );
                      }
                    }
                  }
                  
                  // Method 3: Simple split - insert ads at fixed positions in HTML string
                  if (shouldInsertAds && contentAds.length > 0) {
                    const htmlContent = post.content;
                    const contentLength = htmlContent.length;
                    const insertPositions = [
                      Math.floor(contentLength * 0.30),
                      Math.floor(contentLength * 0.60),
                      Math.floor(contentLength * 0.90)
                    ];
                    
                    let processedHtml = htmlContent;
                    let insertedAdsCount = 0;
                    
                    // Insert ads in reverse order to maintain positions
                    for (let i = insertPositions.length - 1; i >= 0; i--) {
                      if (i < contentAds.length) {
                        const ad = contentAds[i] as any;
                        const position = i === 0 ? '30%' : i === 1 ? '60%' : '90%';
                        const adHtml = createAdHtml(ad, i, position);
                        const insertPos = insertPositions[i];
                        
                        // Find a safe insertion point (after closing tag)
                        const beforePos = processedHtml.substring(0, insertPos);
                        const afterPos = processedHtml.substring(insertPos);
                        
                        // Try to find end of paragraph or div
                        const tagMatch = beforePos.match(/<\/[^>]+>[\s\n]*$/);
                        if (tagMatch) {
                          const insertIndex = beforePos.lastIndexOf(tagMatch[0]) + tagMatch[0].length;
                          processedHtml = processedHtml.substring(0, insertIndex) + adHtml + processedHtml.substring(insertIndex);
                          insertedAdsCount++;
                          
                          if (typeof window === 'undefined') {
                            console.log(`✅ INSERTING AD (Method 3) at ${position}:`, {
                              adId: ad.id,
                              adTitle: ad.title
                            });
                          }
                        }
                      }
                    }
                    
                    if (insertedAdsCount > 0) {
                      if (typeof window === 'undefined') {
                        console.log(`✅ METHOD 3 SUCCESS: Inserted ${insertedAdsCount} ads using HTML string splitting`);
                      }
                    return (
                        <div className="article-content space-y-6">
                          <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
                        </div>
                      );
                    }
                  }
                  
                  // Fallback: Show content as-is with message
                  if (typeof window === 'undefined') {
                    console.log('⚠️ FALLBACK: Could not insert ads, showing content as-is');
                  }
                  
                  return (
                    <div className="article-content space-y-6">
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      {!shouldInsertAds && (
                        <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                          <p>
                            {totalWords < 100 
                              ? `Content is too short (${totalWords} words). Ads appear after 100+ words.`
                              : 'No ads configured. Add ads with placement "Blog Details Page (Inside Content)" in the admin panel.'}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                } catch (error: any) {
                  if (typeof window === 'undefined') {
                    console.error('❌ ERROR processing content:', error?.message || error);
                  }
                  return (
                    <div className="article-content space-y-6">
                      <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>
                  );
                }
              })()
            ) : (
              <div className="space-y-6">
                <p className="text-lg text-[#374151] leading-relaxed">{post.description}</p>
                <p className="text-base text-[#6B7280] leading-relaxed">
                  We&apos;re currently updating this article with the latest content. Please
                  check back soon for the full article.
                </p>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-8 border-t border-[#E5E7EB] mt-10">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-sm font-medium text-[#111827] bg-[#F9FAFB] rounded-md hover:bg-[#E5E7EB] transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
          </article>

          {/* Sidebar - Sticky positioning to fill space */}
          <aside className="space-y-3 lg:space-y-5 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
            {/* Sidebar Ad Slot - Fixed height range: 250px to 280px (Mobile & Desktop) */}
            {mobileAds.length > 1 && mobileAds[1] && (mobileAds[1] as any).adCode ? (
              <section className="block mb-4" style={{ width: '100%', height: '250px', maxHeight: '280px', overflow: 'hidden' }}>
                <div 
                  className="w-full h-full"
                  style={{ 
                    width: '100%', 
                    height: '250px',
                    maxHeight: '280px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                  dangerouslySetInnerHTML={{ __html: (mobileAds[1] as any).adCode }}
                />
              </section>
            ) : (
              <section className="block border-2 border-dashed border-[#D1D5DB] rounded-none p-4 bg-[#F9FAFB] mb-4">
                <h3 className="text-sm font-semibold text-[#6B7280] mb-1">
                  Sidebar Ad Slot (100% × 250-280px)
                </h3>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Add ads with placement "Mobile" to display here. Accepts ads from 250px to 280px height.
                </p>
              </section>
            )}


             {/* Related content */}
        {relatedPosts.length > 0 && (
          <ScrollableRelatedArticles 
            relatedPosts={relatedPosts.slice(0, 8).map(p => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              thumbnail: p.thumbnail,
              coverImage: p.coverImage,
              category: p.category,
              author: p.author,
              authorImage: p.authorImage,
              date: p.date,
              readingTime: p.readingTime
            }))}
            sidebarAds={sidebarAds}
          />
             )}

          </aside>
        </div>

        {/* Bottom Ad Slot - Fixed height range: 250px to 280px (Mobile & Desktop) */}
        {mobileAds.length > 2 && mobileAds[2] && (mobileAds[2] as any).adCode ? (
          <section className="mt-8 block" style={{ width: '100%', height: '250px', maxHeight: '280px', overflow: 'hidden' }}>
            <div 
              className="w-full h-full"
              style={{ 
                width: '100%', 
                height: '250px',
                maxHeight: '280px',
                border: '1px solid #E5E7EB',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: (mobileAds[2] as any).adCode }}
            />
          </section>
        ) : (
          <section className="mt-8 block border-2 border-dashed border-[#D1D5DB] rounded-none p-4 bg-[#F9FAFB]">
            <h3 className="text-sm font-semibold text-[#6B7280] mb-1">
              Bottom Ad Slot (100% × 250-280px)
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Add ads with placement "Mobile" to display here. Accepts ads from 250px to 280px height.
            </p>
          </section>
        )}
      </div>
      <ScrollToTop />
    </main>
  );
}
