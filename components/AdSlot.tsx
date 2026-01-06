"use client";

import { useEffect, useRef, useState } from "react";

interface AdSlotProps {
  ad: {
    id: string;
    title: string;
    imageUrl?: string | null;
    linkUrl: string;
    adCode?: string | null;
    width?: number | null;
    height?: number | null;
    placement: string;
  };
  className?: string;
}

export default function AdSlot({ ad, className = "" }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ad.adCode) {
      console.log("AdSlot: No adCode provided for ad:", ad.id, ad.title);
      setIsLoading(false);
      return;
    }
    
    if (!containerRef.current || !adRef.current) {
      setIsLoading(false);
      return;
    }
    
    console.log("AdSlot: Rendering ad with code length:", ad.adCode.length);

    // Use provided dimensions first
    if (ad.width && ad.height) {
      setDimensions({ width: ad.width, height: ad.height });
      setIsLoading(false);
      return;
    }

    // Try to extract dimensions from ad code
    const extractDimensionsFromCode = (code: string) => {
      let width: number | null = null;
      let height: number | null = null;

      // Try common patterns: width="300", width:300, width='300', width=300
      const widthPatterns = [
        /width\s*=\s*["']?(\d+)/i,
        /width\s*:\s*(\d+)/i,
        /w\s*=\s*["']?(\d+)/i,
        /"width"\s*:\s*(\d+)/i,
      ];
      
      const heightPatterns = [
        /height\s*=\s*["']?(\d+)/i,
        /height\s*:\s*(\d+)/i,
        /h\s*=\s*["']?(\d+)/i,
        /"height"\s*:\s*(\d+)/i,
      ];

      for (const pattern of widthPatterns) {
        const match = code.match(pattern);
        if (match) {
          width = parseInt(match[1]);
          break;
        }
      }

      for (const pattern of heightPatterns) {
        const match = code.match(pattern);
        if (match) {
          height = parseInt(match[1]);
          break;
        }
      }

      return { width, height };
    };

    // Extract dimensions from code
    const extracted = extractDimensionsFromCode(ad.adCode);
    if (extracted.width && extracted.height) {
      setDimensions({ width: extracted.width, height: extracted.height });
      setIsLoading(false);
      return;
    }

    // If dimensions not found in code, try to measure after rendering
    const measureAd = () => {
      try {
        // Insert the ad code
        adRef.current!.innerHTML = ad.adCode!;

        // Wait for ad to load and measure
        const checkDimensions = () => {
          const adElement = adRef.current?.firstElementChild as HTMLElement;
          if (adElement && (adElement.offsetWidth > 0 || adElement.offsetHeight > 0)) {
            let width = adElement.offsetWidth || adElement.getBoundingClientRect().width;
            let height = adElement.offsetHeight || adElement.getBoundingClientRect().height;

            // Set minimum dimensions for very small ads
            if (width && width < 50) width = 50;
            if (height && height < 50) height = 50;

            if (width && height && width > 0 && height > 0) {
              setDimensions({ width, height });
              setIsLoading(false);
              return;
            }
          }
        };

        // Try multiple times as ads may load asynchronously
        const timeouts = [100, 500, 1000, 2000];
        timeouts.forEach((delay) => {
          setTimeout(checkDimensions, delay);
        });

        // Final fallback
        setTimeout(() => {
          if (!dimensions) {
            // Default responsive behavior if dimensions can't be detected
            setDimensions({ width: 300, height: 250 });
            setIsLoading(false);
          }
        }, 3000);
      } catch (error) {
        console.error("Error measuring ad:", error);
        setIsLoading(false);
        setDimensions({ width: 300, height: 250 }); // Default fallback
      }
    };

    measureAd();
  }, [ad.adCode, ad.width, ad.height]);

  // If ad has code, render it with auto-sizing
  if (ad.adCode) {
    const width = dimensions?.width || ad.width || 300;
    const height = dimensions?.height || ad.height || 250;

    // Determine if this is a column ad (narrow width)
    const isColumnAd = width <= 200;
    const isBannerAd = width >= 600;

    const containerStyle: React.CSSProperties = {
      width: '100%',
      maxWidth: isColumnAd ? `${width}px` : isBannerAd ? `${Math.min(width, 728)}px` : `${width}px`,
      height: `${height}px`,
      minHeight: `${Math.min(height, 50)}px`,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid #E5E7EB', // Match slider/related articles style
      background: 'white', // Match slider/related articles style
    };

    return (
      <div
        ref={containerRef}
        className={`ad-slot-container ${className}`}
        style={containerStyle}
      >
        <div
          ref={adRef}
          className="ad-content"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
          dangerouslySetInnerHTML={{ __html: ad.adCode }}
        />
        {/* Note: Ad networks like Adsterra require domain registration. 
            Ads will appear once the site is hosted and domain is added to the ad platform. */}
      </div>
    );
  }

  // Fallback to image/link ad if no code provided
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border-2 border-[#111827] rounded-none p-4 bg-transparent shadow-none hover:bg-[#F9FAFB] transition-colors ${className}`}
    >
      <p className="text-[11px] font-semibold text-[#111827] uppercase tracking-wide mb-2">
        Sponsored
      </p>
      {ad.imageUrl && (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-auto mb-2"
        />
      )}
      <h3 className="text-base md:text-lg font-semibold text-[#111827] mb-2">
        {ad.title}
      </h3>
      <p className="text-sm text-[#6B7280] leading-relaxed truncate">
        {ad.linkUrl}
      </p>
    </a>
  );
}

