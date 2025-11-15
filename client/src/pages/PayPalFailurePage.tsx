import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";
import { useLanguage } from "@/hooks/use-language";

export default function PayPalFailurePage() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    if (id) setSessionId(id);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/paypal/failure",
    apiEndpoint: "/api/paypal/session",
    pathEndpoint: "/api/paypal/session/:sessionId/path",
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-40 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2 border-red-500">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="bg-red-100 rounded-full p-4">
                    <XCircle className="h-20 w-20 text-red-600" data-testid="icon-error" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    {t("paypalLoginError")}
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    {t("paypalCouldNotVerify")}
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      window.location.href = "/paypal";
                    }}
                    className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full"
                    data-testid="button-retry"
                  >
                    {t("paypalRetry")}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      window.location.href = "/paypal";
                    }}
                    className="w-full h-12 border-2 border-foreground rounded-full"
                    data-testid="button-home"
                  >
                    {t("paypalBackToStart")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
