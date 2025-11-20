import { useEffect, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

interface VisitorTrackingData {
  sessionId?: string;
  page: string;
  userAgent?: string;
  ip?: string;
  enabled?: boolean;
}

export function useVisitorTracking(data: VisitorTrackingData) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Skip if explicitly disabled
    if (data.enabled === false) {
      return;
    }

    // Skip if already tracked (prevents duplicates)
    if (hasTracked.current) {
      return;
    }

    // For session-based pages, wait until sessionId is available
    // For non-session pages (like /card, /paypal), track immediately
    const shouldWait = data.sessionId !== undefined;
    if (shouldWait && !data.sessionId) {
      return;
    }

    const trackVisitor = async () => {
      try {
        await apiRequest("POST", "/api/visitor/track", {
          sessionId: data.sessionId || "no-session",
          flowType: data.page.includes('paypal') ? 'paypal' : 'dhl',
          currentPage: data.page,
          userAgent: navigator.userAgent,
          isBot: "false", // Will be determined server-side based on user agent
        });
        hasTracked.current = true;
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    trackVisitor();
  }, [data.sessionId, data.page, data.enabled]);
}
