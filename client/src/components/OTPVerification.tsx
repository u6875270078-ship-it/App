import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import dhlLogo from "@assets/generated_images/DHL_official_logo_design_4b6a5523.png";

interface OTPVerificationProps {
  step: 1 | 2;
  onSubmit?: (otp: string) => void;
  onResend?: () => void;
}

export default function OTPVerification({ step, onSubmit, onResend }: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onSubmit?.(otpString);
    }
  };

  const stepText = step === 1 ? "2 sur 4" : "3 sur 4";
  const title = step === 1 ? "Première vérification" : "Deuxième vérification";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <img src={dhlLogo} alt="DHL Logo" className="h-12" data-testid="img-dhl-logo" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">{title}</h1>
            <p className="text-sm text-muted-foreground">Étape {stepText}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardDescription className="text-center">
              Entrez le code à 6 chiffres envoyé sur votre appareil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="h-12 text-center text-lg font-semibold"
                    data-testid={`input-otp-${index}`}
                  />
                ))}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={otp.join("").length !== 6}
                data-testid="button-verify"
              >
                Vérifier le code
              </Button>

              <button
                type="button"
                onClick={onResend}
                className="w-full text-sm text-primary underline hover-elevate active-elevate-2"
                data-testid="button-resend"
              >
                Renvoyer le code
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
