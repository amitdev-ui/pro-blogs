"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when user scrolls down more than 300px
      // Or when user is near the bottom (within 200px of bottom)
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollBottom = documentHeight - (scrollTop + windowHeight);

      // Show if scrolled down more than 300px OR within 200px of bottom
      if (scrollTop > 300 || scrollBottom < 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 bg-[#111827] text-white rounded-full shadow-lg hover:bg-[#111827]/90 transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2"
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

