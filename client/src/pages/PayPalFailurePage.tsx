import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";

export default function PayPalFailurePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-24 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2 border-red-200">
            <CardContent className="pt-6 pb-8 px-8">
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-red-600" data-testid="icon-error" />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    Connexion échouée
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    Nous n'avons pas pu vérifier vos informations de connexion.
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => window.location.href = '/paypal'}
                    className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold"
                    data-testid="button-retry"
                  >
                    Réessayer
                  </Button>
                  
                  <p className="text-sm text-gray-500" data-testid="text-help">
                    Besoin d'aide ? <a href="https://www.paypal.com/help" className="text-[#0070ba] underline">Contactez-nous</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
