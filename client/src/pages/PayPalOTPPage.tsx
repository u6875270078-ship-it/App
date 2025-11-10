import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";

export default function PayPalOTPPage() {
  const [otp, setOtp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle OTP submission
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-24 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2">
            <CardContent className="pt-6 pb-8 px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 text-center">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    Vérification en deux étapes
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    Entrez le code de vérification que nous avons envoyé à votre appareil.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700">
                    Code de vérification
                  </Label>
                  <Input
                    id="otp"
                    data-testid="input-otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    className="h-12 text-center text-2xl tracking-widest"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold"
                  data-testid="button-submit"
                >
                  Vérifier
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#0070ba] hover:underline"
                    data-testid="button-resend"
                  >
                    Renvoyer le code
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
