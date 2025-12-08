import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/date-utils";
import { getPostBySlug, getPostsFromDB, getAdsForPlacement, type PostWithContent } from "@/lib/post-utils";
import * as cheerio from "cheerio";

interface PostPageProps {
  params: Promise<{ slug: string }>;
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
  
  // Get ads for content (after heading/paragraph and every 170 words)
  const contentAds = await getAdsForPlacement("inline", 10);

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

  return (
    <main className="w-full bg-[#F3F4F6]">
      <div className="container mx-auto max-w-[1280px] px-4 md:px-8 py-6 md:py-10">
        {/* Header strip */}
        <header className="mb-4 md:mb-6 border-b border-[#E5E7EB] pb-3 md:pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
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
          <div className="flex items-center">
            <Link
              href="/articles"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-medium border border-[#E5E7EB] hover:border-[#111827] text-[#111827] bg-white hover:bg-[#F9FAFB] transition-colors"
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

              {/* Mobile slot directly under title */}
              <section className="mt-4 block md:hidden border-2 border-[#111827] rounded-none p-4 bg-transparent">
                <h3 className="text-sm font-semibold text-[#111827] mb-1">
                  Recommended for you
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Use this space for a small promotion, newsletter signup, or important note related
                  to this article.
                </p>
              </section>
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
        <div className="prose prose-lg max-w-none">
          <div className="text-base md:text-lg text-[#374151] leading-[1.75] space-y-6">
            {/* Introduction */}
                <p className="text-base sm:text-lg md:text-xl font-medium text-[#111827] leading-relaxed">
              {post.description}
            </p>

            {/* Ad Slot - After Heading and Paragraph */}
            {contentAds.length > 0 && contentAds[0] && (
              <div className="my-6 md:my-8">
                <a
                  href={contentAds[0].linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                >
                  <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
                    Sponsored
                  </p>
                  <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
                    {contentAds[0].title}
                  </h3>
                  <p className="text-sm text-[#6B7280] leading-relaxed truncate">
                    {contentAds[0].linkUrl}
                  </p>
                </a>
              </div>
            )}

            {/* Content from database */}
            {post.content && post.content.trim().length > 0 ? (
              (() => {
                try {
                  const $ = cheerio.load(post.content);
                  const plainText = $.text();
                  const words = plainText.split(/\s+/).filter(w => w.length > 0);
                  const wordsPerAd = 170;
                  
                  if (words.length < wordsPerAd || contentAds.length <= 1) {
                    // Content too short or no ads, just show it
                    return (
                      <div 
                        className="article-content space-y-6"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    );
                  }
                  
                  // Get all block-level elements
                  const blockElements = $('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, figure, img, div').toArray();
                  
                  let processedHtml = '';
                  let currentWordCount = 0;
                  let currentElements: any[] = [];
                  let adIndex = 1; // Start from index 1 (index 0 is after heading/paragraph)
                  
                  blockElements.forEach((element) => {
                    const $el = $(element);
                    const elText = $el.text();
                    const elWords = elText.split(/\s+/).filter(w => w.length > 0);
                    
                    currentWordCount += elWords.length;
                    currentElements.push(element);
                    
                    // Insert ad after every 170 words
                    if (currentWordCount >= wordsPerAd && adIndex < contentAds.length) {
                      // Add accumulated elements
                      currentElements.forEach(el => {
                        processedHtml += $.html($(el));
                      });
                      
                      // Insert ad HTML
                      const ad = contentAds[adIndex];
                      const escapedTitle = $('<div>').text(ad.title).html() || '';
                      const escapedUrl = $('<div>').text(ad.linkUrl).html() || '';
                      processedHtml += `
                        <div class="my-6 md:my-8">
                          <a href="${escapedUrl.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer" class="block border-2 border-[#111827] rounded-none p-4 md:p-6 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors">
                            <p class="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">Sponsored</p>
                            <h3 class="text-base md:text-lg font-semibold text-[#111827] mb-2">${escapedTitle}</h3>
                            <p class="text-sm text-[#6B7280] leading-relaxed truncate">${escapedUrl}</p>
                          </a>
                        </div>
                      `;
                      
                      currentElements = [];
                      currentWordCount = 0;
                      adIndex++;
                    }
                  });
                  
                  // Add remaining elements
                  currentElements.forEach(el => {
                    processedHtml += $.html($(el));
                  });
                  
                  if (!processedHtml || processedHtml.trim() === '') {
                    return (
                      <div 
                        className="article-content space-y-6"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    );
                  }
                  
                  return (
                    <div 
                      className="article-content space-y-6"
                      dangerouslySetInnerHTML={{ __html: processedHtml }}
                    />
                  );
                } catch (error) {
                  return (
              <div 
                className="article-content space-y-6"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
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
            {/* Mobile slot above related articles */}
            <section className="block md:hidden border-2 border-[#111827] rounded-none p-4 bg-transparent">
              <h3 className="text-sm font-semibold text-[#111827] mb-1">
                Discover more topics
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Highlight categories or collections here to help mobile readers explore more
                content.
              </p>
            </section>


             {/* Related content */}
        {relatedPosts.length > 0 && (
               <section className="bg-white border border-[#E5E7EB] shadow-sm md:shadow-md rounded-none p-4 md:p-5 lg:p-6">
                 <h2 className="text-lg md:text-xl font-semibold text-[#111827] mb-4 md:mb-5">
              Related articles
            </h2>
                 <div className="relative h-[600px] overflow-hidden">
                   <div className="animate-scroll-infinite space-y-4">
                     {/* Create multiple copies for seamless infinite loop */}
                     {Array.from({ length: 5 }).map((_, copyIndex) => 
                       relatedPosts.slice(0, 8).map((relatedPost, index) => {
                         const ad = sidebarAds[index] || sidebarAds[0];
                         const thumb =
                           relatedPost.thumbnail ||
                           relatedPost.coverImage ||
                           "https://images.unsplash.com/photo-1558655146-364adaf1fcc9?w=800&h=500&fit=crop&q=80";
                         const initialsRelated = relatedPost.author
                           .split(" ")
                           .map((n) => n[0])
                           .join("")
                           .toUpperCase()
                           .slice(0, 2);

                         return (
                           <div key={`copy-${copyIndex}-${relatedPost.id}`} className="space-y-4">
                             <article className="border border-[#E5E7EB] rounded-none overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                               <Link href={`/post/${relatedPost.slug}`}>
                                 <div className="relative w-full aspect-[4/3] overflow-hidden">
                                   <Image
                                     src={thumb}
                                     alt={relatedPost.title}
                                     fill
                                     className="object-cover"
                                     unoptimized={thumb.startsWith("http")}
                                   />
                                 </div>
                               </Link>
                               <div className="p-4 space-y-2">
                                 {relatedPost.category && (
                                   <span className="inline-block px-2 py-0.5 text-[11px] font-medium bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                                     {relatedPost.category}
                                   </span>
                                 )}
                                 <Link
                                   href={`/post/${relatedPost.slug}`}
                                   className="block hover:text-[#111827]/80 transition-colors"
                                 >
                                   <h3 className="text-sm md:text-base font-semibold text-[#111827] leading-snug line-clamp-2">
                                     {relatedPost.title}
                                   </h3>
                                 </Link>
                                 <div className="flex items-center gap-2 pt-1 text-xs text-[#6B7280]">
                                   <Avatar className="h-6 w-6">
                                     <AvatarImage src={relatedPost.authorImage} alt={relatedPost.author} />
                                     <AvatarFallback className="text-[10px]">{initialsRelated}</AvatarFallback>
                                   </Avatar>
                                   <div className="flex flex-col">
                                     <span className="font-medium text-[#111827] text-[11px]">
                                       {relatedPost.author}
                                     </span>
                                     <div className="flex items-center gap-1 text-[11px]">
                                       <span>{formatDate(relatedPost.date)}</span>
                                       {relatedPost.readingTime && (
                                         <>
                                           <span className="text-[#E5E7EB]">•</span>
                                           <span>{relatedPost.readingTime}</span>
                                         </>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             </article>
                             
                             {/* Ad Slot - After each article */}
                             {ad && (
                               <div>
                                 <a
                                   href={ad.linkUrl}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="block border-2 border-[#111827] rounded-none p-4 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors"
                                 >
                                   <p className="text-[10px] font-semibold text-[#111827] uppercase tracking-wide mb-1">
                                     Sponsored
                                   </p>
                                   <h3 className="text-xs md:text-sm font-semibold text-[#111827] mb-1 line-clamp-2">
                                     {ad.title}
                                   </h3>
                                   <p className="text-[10px] text-[#6B7280] leading-relaxed truncate">
                                     {ad.linkUrl}
                                   </p>
                                 </a>
                               </div>
                             )}
                           </div>
                         );
                       })
                     )}
                   </div>
                 </div>
               </section>
             )}

          </aside>
        </div>

        {/* Mobile bottom slot */}
        <section className="mt-8 block md:hidden border-2 border-[#111827] rounded-none p-4 bg-transparent">
          <h3 className="text-sm font-semibold text-[#111827] mb-1">
            Keep exploring
          </h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            Use this final slot on mobile for a strong call-to-action, such as subscribing, joining
            a community, or visiting a key landing page.
          </p>
        </section>
      </div>
    </main>
  );
}
