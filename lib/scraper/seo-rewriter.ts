/**
 * SEO Rewriting Engine
 * Rewrites content to improve search visibility while maintaining original meaning
 */

interface RewriteOptions {
  preserveQuotes?: boolean;
  enhanceHeadings?: boolean;
  addKeywords?: boolean;
}

export function rewriteForSEO(html: string, options: RewriteOptions = {}): string {
  if (!html || html.trim().length === 0) {
    return html;
  }

  const {
    preserveQuotes = true,
    enhanceHeadings = true,
    addKeywords = true,
  } = options;

  // Extract text content and analyze
  const textContent = extractTextFromHTML(html);
  const keywords = extractKeywords(textContent);

  // Rewrite the HTML content
  let rewritten = html;

  // Enhance headings
  if (enhanceHeadings) {
    rewritten = enhanceHeadingsInHTML(rewritten, keywords);
  }

  // Improve paragraph structure
  rewritten = improveParagraphStructure(rewritten);

  // Add natural keywords to content
  if (addKeywords) {
    rewritten = addNaturalKeywords(rewritten, keywords);
  }

  // Improve meta descriptions in content
  rewritten = improveContentClarity(rewritten);

  return rewritten;
}

/**
 * Extract keywords from text content
 */
function extractKeywords(text: string): string[] {
  // Common stop words to exclude
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
  ]);

  // Extract words (3+ characters, alphanumeric)
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.has(word));

  // Count frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  // Get top keywords (appearing 2+ times)
  const keywords = Object.entries(wordCount)
    .filter(([_, count]) => count >= 2)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return keywords;
}

/**
 * Extract plain text from HTML
 */
function extractTextFromHTML(html: string): string {
  // Remove HTML tags but keep text
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Enhance headings in HTML
 */
function enhanceHeadingsInHTML(html: string, keywords: string[]): string {
  // This is a simplified version - in production, you'd use a proper HTML parser
  // For now, we'll focus on improving heading text when possible
  
  // The actual heading enhancement would require more sophisticated NLP
  // For this implementation, we'll ensure headings are properly structured
  return html;
}

/**
 * Improve paragraph structure
 */
function improveParagraphStructure(html: string): string {
  // Ensure paragraphs are well-structured
  // Split long paragraphs into shorter, more readable ones
  // This is a simplified version - full implementation would parse HTML properly
  
  return html
    .replace(/<p>([^<]{300,})<\/p>/gi, (match, content) => {
      // Split very long paragraphs (300+ chars) into multiple paragraphs
      const sentences = content.split(/([.!?]\s+)/);
      if (sentences.length > 6) {
        const midPoint = Math.floor(sentences.length / 2);
        const firstHalf = sentences.slice(0, midPoint).join('');
        const secondHalf = sentences.slice(midPoint).join('');
        return `<p>${firstHalf}</p><p>${secondHalf}</p>`;
      }
      return match;
    });
}

/**
 * Add natural keywords to content
 */
function addNaturalKeywords(html: string, keywords: string[]): string {
  // This is a simplified version
  // In production, you'd use more sophisticated NLP to naturally integrate keywords
  // For now, we'll focus on ensuring important terms are present in key places
  
  // The actual keyword integration would be more sophisticated
  // This is a placeholder for the concept
  return html;
}

/**
 * Improve content clarity
 */
function improveContentClarity(html: string): string {
  // Improve sentence structure and clarity
  // This would typically involve:
  // - Fixing passive voice where appropriate
  // - Improving sentence flow
  // - Ensuring clear, concise language
  
  // Simplified version - full implementation would use NLP
  return html
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s+</g, '<') // Remove space before tags
    .replace(/>\s+/g, '>') // Remove space after tags
    .trim();
}

/**
 * Check if content needs SEO rewriting
 */
export function needsSEORewrite(content: string | null | undefined): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }

  // Check if content has been SEO-optimized (look for markers)
  // For now, we'll check if content exists and has minimum length
  const textContent = extractTextFromHTML(content);
  
  // If content is very short, it might need expansion
  if (textContent.length < 500) {
    return true;
  }

  // Check for common issues that indicate non-SEO content
  // - Very long paragraphs without breaks
  const hasLongParagraphs = /<p>[^<]{500,}<\/p>/i.test(content);
  
  // - Missing headings structure
  const headingCount = (content.match(/<h[1-6][^>]*>/gi) || []).length;
  const paragraphCount = (content.match(/<p[^>]*>/gi) || []).length;
  const hasGoodHeadingRatio = headingCount > 0 && paragraphCount / headingCount < 10;

  // Content needs rewriting if it has issues
  return hasLongParagraphs || !hasGoodHeadingRatio;
}

