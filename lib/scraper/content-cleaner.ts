import * as cheerio from "cheerio";

/**
 * Content cleaning engine - removes ads, duplicates, and promotional content
 * while preserving the full article content
 */
export function cleanArticleContent(html: string, isTechCrunch: boolean = false): string {
  if (!html || html.trim().length === 0) {
    return "";
  }

  const $ = cheerio.load(html, {
    decodeEntities: false,
  });

  // Remove scripts, styles, and meta tags
  $("script, style, noscript, meta, link[rel='stylesheet']").remove();

  // Remove promotional/advertisement elements
  const adSelectors = [
    // Common ad classes and IDs
    ".ad",
    ".ads",
    ".advertisement",
    ".advert",
    ".ad-wrapper",
    ".ad-container",
    ".ad-banner",
    ".ad-box",
    ".ad-block",
    "[class*='ad-']",
    "[class*='advertisement']",
    "[id*='ad-']",
    "[id*='advertisement']",
    "[id*='advert']",
    
    // Promotional sections
    ".promo",
    ".promotion",
    ".promotional",
    "[class*='promo']",
    "[class*='promotion']",
    
    // Newsletter/signup sections
    ".newsletter",
    ".newsletter-signup",
    ".email-signup",
    ".subscribe",
    ".subscription",
    "[class*='newsletter']",
    "[class*='signup']",
    "[class*='subscribe']",
    
    // Event banners
    ".event-banner",
    ".event-promo",
    "[class*='event']",
    "[class*='waitlist']",
    "[class*='disrupt']",
    
    // Social sharing widgets (often contain ads)
    ".social-share",
    ".share-widget",
    ".social-widget",
    "[class*='share']",
    
    // Related/recommended sections that are often ads
    ".related-articles",
    ".recommended",
    ".sponsored",
    ".sponsored-content",
    "[class*='sponsored']",
    
    // TechCrunch-specific sections to remove
    ".river-block",
    ".river",
    ".headlines-only",
    ".more-articles",
    ".article-nav",
    ".river-block__content",
    "[class*='river']",
    "[class*='headlines']",
    
    // Sidebars (often contain ads)
    "aside",
    ".sidebar",
    "[class*='sidebar']",
    
    // Popups and modals
    ".popup",
    ".modal",
    "[class*='popup']",
    "[class*='modal']",
    
    // Footer promotional content
    "footer .promo",
    "footer .ad",
    
    // Comments sections (can contain spam)
    ".comments",
    ".comment-section",
    "[class*='comment']",
    
    // Author bio boxes that are promotional
    ".author-bio",
    ".author-box",
  ];

  adSelectors.forEach((selector) => {
    try {
      $(selector).remove();
    } catch (e) {
      // Ignore selector errors
    }
  });

  // TechCrunch-specific cleaning
  if (isTechCrunch) {
    // Remove "Headlines Only" sections
    $("*").each((_, element) => {
      const $el = $(element);
      const text = $el.text().toLowerCase();
      if (text.includes("headlines only") || text.includes("more articles") || text.includes("related articles")) {
        // Check if this element is mostly links
        const linkCount = $el.find("a").length;
        const textLength = text.length;
        if (linkCount > 3 && textLength < 500) {
          $el.remove();
        }
      }
    });

    // Remove navigation lists (lists with mostly links)
    $("ul, ol").each((_, element) => {
      const $list = $(element);
      const linkCount = $list.find("a").length;
      const itemCount = $list.find("li").length;
      const textContent = $list.text().trim();
      
      // If it's mostly links and short text, it's probably navigation
      if (linkCount > 2 && itemCount > 0 && linkCount / itemCount > 0.7 && textContent.length < 1000) {
        // Check if parent is article content - if not, remove
        const $parent = $list.parent();
        if (!$parent.hasClass("article-content") && !$parent.closest(".article-content").length) {
          $list.remove();
        }
      }
    });
  }

  // Remove elements with promotional text patterns
  $("*").each((_, element) => {
    const $el = $(element);
    const text = $el.text().toLowerCase();
    const html = $el.html()?.toLowerCase() || "";

    // Patterns that indicate promotional content
    const promotionalPatterns = [
      "join the disrupt",
      "waitlist",
      "join waitlist",
      "disrupt 2026",
      "subscribe now",
      "sign up for",
      "newsletter",
      "get our newsletter",
      "sponsored by",
      "sponsored content",
      "advertisement",
      "this is a paid",
      "promoted",
      "promotion",
      "techcrunch event",
      "register now",
      "get tickets",
      "early bird",
    ];

    const hasPromotionalText = promotionalPatterns.some((pattern) =>
      text.includes(pattern) || html.includes(pattern)
    );

    if (hasPromotionalText && text.length < 500) {
      // Only remove if it's a small block (likely an ad, not main content)
      $el.remove();
    }
  });

  // Remove empty or near-empty elements
  $("*").each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    
    // Remove elements with only whitespace or very short text
    if (text.length < 10 && !$el.find("img, video, iframe").length) {
      // Keep if it has meaningful children
      if ($el.children().length === 0) {
        $el.remove();
      }
    }
  });

  // Remove duplicate paragraphs
  const seenParagraphs = new Set<string>();
  $("p").each((_, element) => {
    const $p = $(element);
    const text = $p.text().trim().toLowerCase();
    
    // Normalize text for comparison (remove extra spaces)
    const normalized = text.replace(/\s+/g, " ").substring(0, 200);
    
    if (normalized.length > 20) {
      // Only check substantial paragraphs
      if (seenParagraphs.has(normalized)) {
        $p.remove();
      } else {
        seenParagraphs.add(normalized);
      }
    }
  });

  // Remove duplicate headings
  const seenHeadings = new Set<string>();
  $("h1, h2, h3, h4, h5, h6").each((_, element) => {
    const $h = $(element);
    const text = $h.text().trim().toLowerCase();
    
    if (text.length > 5) {
      if (seenHeadings.has(text)) {
        // Check if it's a duplicate heading
        const $next = $h.next();
        if ($next.length && $next.text().trim().length < 50) {
          // If next element is also short, likely duplicate section
          $h.remove();
        }
      } else {
        seenHeadings.add(text);
      }
    }
  });

  // Clean up HTML structure - remove unnecessary divs but keep content
  $("div, span").each((_, element) => {
    const $el = $(element);
    
    // Remove divs/spans that only contain whitespace or are empty
    if ($el.children().length === 0 && $el.text().trim().length === 0) {
      $el.remove();
      return;
    }
    
    // Don't unwrap if it has important attributes or classes that might be needed for styling
    const hasImportantClass = $el.attr("class") && 
      !$el.attr("class")?.match(/(ad|promo|sponsored|newsletter|signup|subscribe)/i);
    
    // Unwrap divs that only contain a single block element (but be careful)
    if ($el.children().length === 1 && !hasImportantClass) {
      const child = $el.children().first();
      const childTag = child.prop("tagName")?.toLowerCase() || "";
      if (["p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "blockquote", "img", "figure"].includes(childTag)) {
        // Only unwrap if the div doesn't have meaningful attributes
        const attrs = Object.keys($el[0]?.attribs || {});
        if (attrs.length === 0 || (attrs.length === 1 && attrs[0] === "class")) {
          $el.replaceWith(child);
        }
      }
    }
  });

  // Remove attributes that are not needed (keep src, alt, href)
  $("*").each((_, element) => {
    const $el = $(element);
    const tagName = $el.prop("tagName")?.toLowerCase() || "";
    
    // Keep essential attributes
    const keepAttrs: string[] = [];
    if (tagName === "img") {
      keepAttrs.push("src", "alt", "width", "height");
    } else if (tagName === "a") {
      keepAttrs.push("href", "target", "rel");
    } else if (["h1", "h2", "h3", "h4", "h5", "h6", "p", "ul", "ol", "li", "blockquote", "strong", "em", "code", "pre"].includes(tagName)) {
      // Keep class for styling if needed, but remove most attributes
      const attrs = Object.keys($el[0]?.attribs || {});
      attrs.forEach((attr) => {
        if (!["class", "id"].includes(attr)) {
          $el.removeAttr(attr);
        }
      });
    } else {
      // For other elements, remove most attributes
      const attrs = Object.keys($el[0]?.attribs || {});
      attrs.forEach((attr) => {
        if (!keepAttrs.includes(attr) && !["class", "id"].includes(attr)) {
          $el.removeAttr(attr);
        }
      });
    }
  });

  // Clean up whitespace in text nodes
  $("*").contents().filter(function() {
    return this.nodeType === 3; // Text node
  }).each(function() {
    const text = $(this).text();
    $(this).replaceWith(text.replace(/\s+/g, " ").trim());
  });

  // Get the cleaned HTML
  let cleanedHtml = $.html();

  // Final cleanup: remove empty paragraphs and excessive line breaks
  cleanedHtml = cleanedHtml
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<p><\/p>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanedHtml;
}

