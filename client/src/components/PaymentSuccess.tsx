import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import dhlLogo from "@assets/generated_images/DHL_official_logo_design_4b6a5523.png";

interface PaymentSuccessProps {
  onReturnHome?: () => void;
  paymentDetails?: {
    amount?: string;
    transactionId?: string;
    date?: string;
  };
}

export default function PaymentSuccess({ onReturnHome, paymentDetails }: PaymentSuccessProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <img src={dhlLogo} alt="DHL Logo" className="h-12" data-testid="img-dhl-logo" />
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Étape 4 sur 4</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-primary/10 p-3">
                <CheckCircle2 className="h-16 w-16 text-primary" data-testid="icon-success" />
              </div>
              <h1 className="text-2xl font-bold text-center" data-testid="text-success-title">
                Merci de votre paiement
              </h1>
              <p className="text-muted-foreground text-center">
                Votre transaction a été effectuée avec succès
              </p>
            </div>

            {paymentDetails && (
              <div className="space-y-3 pt-4 border-t">
                {paymentDetails.transactionId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID Transaction:</span>
                    <span className="font-mono font-medium" data-testid="text-transaction-id">
                      {paymentDetails.transactionId}
                    </span>
                  </div>
                )}
                {paymentDetails.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-semibold" data-testid="text-amount">
                      {paymentDetails.amount}
                    </span>
                  </div>
                )}
                {paymentDetails.date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date:</span>
                    <span data-testid="text-date">{paymentDetails.date}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={onReturnHome}
              variant="secondary"
              className="w-full h-12"
              data-testid="button-return-home"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
