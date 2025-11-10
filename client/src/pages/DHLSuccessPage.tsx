import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import { useLanguage } from "@/hooks/use-language";

export default function DHLSuccessPage() {
  const { t } = useLanguage();
  const [transactionId] = useState(`TXN-${Date.now()}`);
  const [amount] = useState("€3.75");
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
    currentPath: "/success",
    paymentId,
    apiEndpoint: "/api/dhl/session",
    pathEndpoint: "/api/dhl/session/:sessionId/path",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-green-500">
        <CardHeader className="space-y-3 text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex justify-center">
            <div className="bg-white rounded-full p-4 animate-bounce">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {t('paymentSuccessful')}
          </CardTitle>
          <CardDescription className="text-white/90">
            {t('transactionSuccessful')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="flex justify-center -mt-2 mb-2">
            <img src="/dhl-logo.png" alt="DHL" className="h-8 opacity-80" />
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('amountPaid')}</span>
              <span className="text-lg font-bold text-green-700">{amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('transactionId')}</span>
              <span className="text-xs font-mono text-gray-700">{transactionId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('date')}</span>
              <span className="text-sm text-gray-700">
                {new Date().toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{t('status')}</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                {t('confirmed')}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{t('nextSteps')}</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>{t('confirmationEmailSent')}</li>
              <li>{t('packageShipped')}</li>
              <li>{t('trackingNumber')}</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full h-12 bg-gradient-to-r from-[#FFCC00] to-[#D40511] hover:opacity-90 text-white font-semibold"
              onClick={() => window.print()}
              data-testid="button-download"
            >
              <Download className="mr-2 h-5 w-5" />
              {t('downloadReceipt')}
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
            <p>{t('thankYou')}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('support')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
