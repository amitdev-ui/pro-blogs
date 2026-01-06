"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full border rounded p-6 space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-gray-600">
          Please try again or refresh the page.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Retry
          </button>
          <button
            onClick={() => location.reload()}
            className="px-4 py-2 border rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

