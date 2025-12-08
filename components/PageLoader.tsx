"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loader from "./Loader";

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  useEffect(() => {
    const handleStart = () => {
      // Determine message based on route
      const messages: Record<string, string> = {
        "/": "Loading Home...",
        "/articles": "Loading Articles...",
        "/admin": "Loading Admin...",
        "/admin/scraper": "Loading Scraper...",
        "/admin/posts": "Loading Posts...",
        "/admin/websites": "Loading Websites...",
      };

      setLoadingMessage(messages[pathname] || "Loading...");
      setLoading(true);
    };

    const handleComplete = () => {
      setLoading(false);
    };

    // Simulate loading on route change
    handleStart();
    const timer = setTimeout(handleComplete, 800); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return <Loader message={loadingMessage} />;
}

