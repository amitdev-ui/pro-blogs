import { NextRequest } from "next/server";
import { getProgressStore, getProgress } from "@/lib/scraper/progress-store";

export function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId') || 'default';
  const progressStore = getProgressStore();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial status
      const sendUpdate = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error("Error sending update:", error);
        }
      };

      // Send current status (convert Date to string for JSON)
      try {
        const currentStatus = getProgress(sessionId);
        const statusToSend = {
          ...currentStatus,
          startTime: currentStatus.startTime instanceof Date 
            ? currentStatus.startTime.toISOString() 
            : currentStatus.startTime,
          endTime: currentStatus.endTime instanceof Date 
            ? currentStatus.endTime.toISOString() 
            : currentStatus.endTime,
        };
        sendUpdate(statusToSend);
      } catch (error) {
        console.error("Error sending initial status:", error);
        sendUpdate({ status: 'idle', message: 'Ready to scrape' });
      }

      // Poll for updates every 500ms
      const interval = setInterval(() => {
        try {
          const status = progressStore.get(sessionId);
          if (status) {
            const statusToSend = {
              ...status,
              startTime: status.startTime instanceof Date 
                ? status.startTime.toISOString() 
                : status.startTime,
              endTime: status.endTime instanceof Date 
                ? status.endTime.toISOString() 
                : status.endTime,
            };
            sendUpdate(statusToSend);
            
            // Stop streaming if completed, error, or cancelled
            if (status.status === 'completed' || status.status === 'error' || status.status === 'cancelled') {
              clearInterval(interval);
              setTimeout(() => {
                try {
                  controller.close();
                } catch (closeError) {
                  // Ignore close errors
                }
              }, 2000);
            }
          }
        } catch (error) {
          console.error("Error in progress polling:", error);
        }
      }, 500);

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        try {
          clearInterval(interval);
          controller.close();
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

