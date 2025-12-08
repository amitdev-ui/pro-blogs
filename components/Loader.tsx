"use client";

import { Sparkles } from "lucide-react";

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = "Loading..." }: LoaderProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo/Icon */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#6B7280] to-[#111827] rounded-full blur-2xl opacity-30 animate-pulse scale-150" />
          
          {/* Main Icon Container */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#111827] via-[#374151] to-[#111827] shadow-2xl ring-4 ring-[#111827]/10">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
            <Sparkles className="h-12 w-12 text-white relative z-10 animate-pulse" />
          </div>
          
          {/* Rotating Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#111827] border-r-[#6B7280] animate-spin" style={{ animationDuration: '1.5s' }} />
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl font-semibold text-[#111827] bg-gradient-to-r from-[#111827] to-[#6B7280] bg-clip-text text-transparent">
            {message}
          </p>
          
          {/* Animated Dots */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#111827] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2.5 h-2.5 bg-[#6B7280] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2.5 h-2.5 bg-[#111827] rounded-full animate-bounce" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-72 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#111827] via-[#6B7280] to-[#111827] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}

