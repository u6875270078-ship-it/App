import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import { useLanguage } from "@/hooks/use-language";

export default function DHLWaitingPage() {
  const { t } = useLanguage();
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
            {t('verificationInProgress')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('pleaseWait')}
            <span className="inline-flex ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </p>
        </div>

        <div className="flex justify-center gap-2">
          <div className="h-3 w-3 bg-[#FFCC00] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="h-3 w-3 bg-[#FFCC00] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="h-3 w-3 bg-[#D40511] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>

        <div className="pt-8">
          <img 
            src="/dhl-logo.png" 
            alt="DHL" 
            className="h-10 mx-auto opacity-70"
          />
        </div>
      </div>
    </div>
  );
}
