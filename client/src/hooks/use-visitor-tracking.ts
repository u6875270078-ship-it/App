import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface VisitorTrackingData {
  sessionId?: string;
  page: string;
  userAgent?: string;
  ip?: string;
}

export function useVisitorTracking(data: VisitorTrackingData) {
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        await apiRequest("POST", "/api/visitor-logs", {
          sessionId: data.sessionId || "unknown",
          page: data.page,
          userAgent: navigator.userAgent,
          ip: "auto", // IP will be captured server-side
        });
      } catch (error) {
        console.error("Failed to track visitor:", error);
      }
    };

    trackVisitor();
  }, [data.sessionId, data.page]);
}
