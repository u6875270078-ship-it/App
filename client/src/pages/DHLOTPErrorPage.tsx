import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";

export default function DHLOTPErrorPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    const pId = params.get("paymentId");
    if (id) setSessionId(id);
    if (pId) setPaymentId(pId);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/otp-error",
    paymentId,
    apiEndpoint: "/api/dhl/session",
    pathEndpoint: "/api/dhl/session/:sessionId/path",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-orange-500">
        <CardHeader className="space-y-3 text-center bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4">
              <AlertTriangle className="h-16 w-16 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Code OTP incorrect
          </CardTitle>
          <CardDescription className="text-white/90">
            Le code de vérification que vous avez entré est invalide
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800 font-medium mb-2">
              Que faire maintenant ?
            </p>
            <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
              <li>Vérifiez que vous avez entré le bon code</li>
              <li>Le code expire après quelques minutes</li>
              <li>Demandez un nouveau code si nécessaire</li>
              <li>Vérifiez vos SMS/emails</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-[#FFCC00] to-[#D40511] hover:opacity-90 text-white font-semibold"
              onClick={() => window.history.back()}
              data-testid="button-retry-otp"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Réessayer avec un nouveau code
            </Button>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => window.location.href = "/"}
              data-testid="button-home"
            >
              <Home className="mr-2 h-5 w-5" />
              Recommencer le paiement
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="mb-2">Problème avec le code ?</p>
            <p className="text-xs text-gray-500">
              Contactez le support : <br />
              <span className="font-semibold">+33 1 23 45 67 89</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
