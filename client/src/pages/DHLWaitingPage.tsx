import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";

export default function DHLWaitingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    const pId = params.get("paymentId");
    if (id) {
      setSessionId(id);
    }
    if (pId) {
      setPaymentId(pId);
      localStorage.setItem("dhlPaymentId", pId);
    }
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/dhl/waiting",
    paymentId,
    apiEndpoint: "/api/dhl/session",
    pathEndpoint: "/api/dhl/session/:sessionId/path",
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-red-50">
      <div className="text-center space-y-8 p-8">
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 
              className="h-24 w-24 animate-spin text-[#FFCC00]" 
              strokeWidth={2.5}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#FFCC00] to-[#D40511] opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Vérification en cours
          </h1>
          <p className="text-lg text-gray-600">
            Veuillez patienter pendant que nous vérifions vos informations
            <span className="inline-flex ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </p>
          
          {sessionId && (
            <p className="text-sm text-gray-500 font-mono">
              Session: {sessionId}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-2">
          <div className="h-3 w-3 bg-[#FFCC00] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="h-3 w-3 bg-[#FFCC00] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="h-3 w-3 bg-[#D40511] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>

        <div className="pt-8">
          <img 
            src="https://www.dhl.com/content/dam/dhl/global/core/images/logos/dhl-logo.svg" 
            alt="DHL" 
            className="h-12 mx-auto opacity-60"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
