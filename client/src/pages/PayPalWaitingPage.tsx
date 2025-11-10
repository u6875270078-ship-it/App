import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";

export default function PayPalWaitingPage() {
  const [, setLocation] = useLocation();
  const sessionId = new URLSearchParams(window.location.search).get("session");

  // Poll for redirect decision every 2 seconds
  const { data: redirectData } = useQuery<{ redirect?: string }>({
    queryKey: ["/api/paypal/check-redirect", sessionId],
    refetchInterval: 2000,
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (redirectData?.redirect) {
      window.location.href = redirectData.redirect;
    }
  }, [redirectData]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-24 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2">
            <CardContent className="pt-6 pb-8 px-8">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 animate-spin text-[#0070ba]" data-testid="icon-loading" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    Vérification en cours
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    Veuillez patienter pendant que nous vérifions vos informations...
                  </p>
                  <p className="text-sm text-gray-500" data-testid="text-session">
                    Session: {sessionId}
                  </p>
                </div>

                <div className="pt-4">
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-[#0070ba] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-[#0070ba] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-[#0070ba] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p data-testid="text-footer">Cela peut prendre quelques instants</p>
          </div>
        </div>
      </div>
    </div>
  );
}
