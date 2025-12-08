import * as cheerio from "cheerio";
import { fetchHTML } from "./utils";

/**
 * Image Fixer - Finds and fixes missing images in blog posts
 */

export interface ImageFixResult {
  success: boolean;
  thumbnail?: string;
  coverImage?: string;
  message: string;
}

/**
 * Fix missing images for a blog post by scraping the source URL
 */
export async function fixPostImages(sourceUrl: string | null | undefined): Promise<ImageFixResult> {
  if (!sourceUrl) {
    return {
      success: false,
      message: "No source URL provided",
    };
  }

  try {
    const html = await fetchHTML(sourceUrl);
    const $ = cheerio.load(html);

    // Extract featured/cover image from full post page
    let featuredImage = 
      $("meta[property='og:image']").attr("content") ||
      $("meta[name='twitter:image']").attr("content") ||
      $("meta[property='og:image:secure_url']").attr("content") ||
      $("link[rel='image_src']").attr("href") ||
      "";

    // Try to find large featured image in content
    if (!featuredImage) {
      const $featuredImg = $(".featured-image img, .cover-image img, .hero-image img, .post-cover img, article img[width][height]").first();
      if ($featuredImg.length) {
        featuredImage = $featuredImg.attr("src") || 
                         $featuredImg.attr("data-src") ||
                         $featuredImg.attr("data-lazy-src") ||
                         "";
      }
    }

    // Try to find thumbnail/card image
    let thumbnail = 
      $(".thumbnail img, .card-image img, .post-thumbnail img").first().attr("src") ||
      $(".thumbnail img, .card-image img, .post-thumbnail img").first().attr("data-src") ||
      "";

    // If no thumbnail, use featured image
    if (!thumbnail && featuredImage) {
      thumbnail = featuredImage;
    }

    // If no featured image, try any image in article
    if (!featuredImage) {
      const $anyImg = $("article img, .post-content img, .article-content img").first();
      if ($anyImg.length) {
        featuredImage = $anyImg.attr("src") || 
                       $anyImg.attr("data-src") ||
                       $anyImg.attr("data-lazy-src") ||
                       "";
        if (!thumbnail) {
          thumbnail = featuredImage;
        }
      }
    }

    // Make URLs absolute
    if (featuredImage && !featuredImage.startsWith("http")) {
      try {
        featuredImage = new URL(featuredImage, sourceUrl).href;
      } catch {
        featuredImage = "";
      }
    }

    if (thumbnail && !thumbnail.startsWith("http")) {
      try {
        thumbnail = new URL(thumbnail, sourceUrl).href;
      } catch {
        thumbnail = "";
      }
    }

    if (featuredImage || thumbnail) {
      return {
        success: true,
        thumbnail: thumbnail || featuredImage,
        coverImage: featuredImage || thumbnail,
        message: featuredImage ? "Images found and updated" : "Partial images found",
      };
    }

    return {
      success: false,
      message: "No images found on source page",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error fetching images: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Check if post needs image fixing
 */
export function needsImageFix(thumbnail: string | null | undefined, coverImage: string | null | undefined): boolean {
  // Check if images are missing or are placeholders
  const hasThumbnail = thumbnail && 
    !thumbnail.includes("unsplash.com/photo-1558655146") && // Default placeholder
    thumbnail.length > 10;
  
  const hasCoverImage = coverImage && 
    !coverImage.includes("unsplash.com/photo-1558655146") && // Default placeholder
    coverImage.length > 10;

  // Needs fix if both are missing or one is missing
  return !hasThumbnail || !hasCoverImage;
}

