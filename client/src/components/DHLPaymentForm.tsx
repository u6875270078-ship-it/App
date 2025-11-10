import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import dhlLogo from "@assets/generated_images/DHL_official_logo_design_4b6a5523.png";
import sslBadge from "@assets/generated_images/SSL_security_badge_5a63cf55.png";

interface DHLPaymentFormProps {
  onSubmit?: (data: PaymentFormData) => void;
}

export interface PaymentFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export default function DHLPaymentForm({ onSubmit }: DHLPaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
  });

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (/^\d*$/.test(value) && value.length <= 16) {
      setFormData({ ...formData, cardNumber: value });
    }
  };

  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 2) {
      const num = parseInt(value);
      if (value === "" || (num >= 0 && num <= 12)) {
        setFormData({ ...formData, expiryMonth: value });
      }
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 2) {
      setFormData({ ...formData, expiryYear: value });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 3) {
      setFormData({ ...formData, cvv: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <img src={dhlLogo} alt="DHL Logo" className="h-12" data-testid="img-dhl-logo" />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Paiement Facture DHL</h1>
            <p className="text-sm text-muted-foreground">Étape 1 sur 4</p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <CardDescription>Paiement sécurisé</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Numéro de carte *</Label>
                <Input
                  id="cardNumber"
                  data-testid="input-card-number"
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(formData.cardNumber)}
                  onChange={handleCardNumberChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Date d'expiration *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="expiryMonth"
                      data-testid="input-expiry-month"
                      placeholder="MM"
                      value={formData.expiryMonth}
                      onChange={handleExpiryMonthChange}
                      required
                      className="h-12"
                    />
                    <Input
                      id="expiryYear"
                      data-testid="input-expiry-year"
                      placeholder="AA"
                      value={formData.expiryYear}
                      onChange={handleExpiryYearChange}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      data-testid="input-cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleCvvChange}
                      required
                      className="h-12"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholderName">Nom du titulaire *</Label>
                <Input
                  id="cardholderName"
                  data-testid="input-cardholder-name"
                  placeholder="Jean Dupont"
                  value={formData.cardholderName}
                  onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                data-testid="button-proceed"
              >
                Procéder à la vérification
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2">
          <img src={sslBadge} alt="SSL Security" className="h-6" data-testid="img-ssl-badge" />
          <p className="text-xs text-muted-foreground">Paiement sécurisé SSL</p>
        </div>
      </div>
    </div>
  );
}
