import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";
import sslBadge from "@assets/generated_images/SSL_security_badge_5a63cf55.png";
import { useLanguage } from "@/hooks/use-language";

interface PayPalCardFormProps {
  onSubmit?: (data: CardFormData) => void;
  isLoading?: boolean;
}

export interface CardFormData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export default function PayPalCardForm({ onSubmit, isLoading }: PayPalCardFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  });
  const [errors, setErrors] = useState({
    cardNumber: "",
    expiryDate: "",
  });

  // Luhn algorithm to validate card number
  const isValidCardNumber = (number: string): boolean => {
    if (number.length < 13 || number.length > 19) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  // Validate expiry date is in the future
  const isValidExpiryDate = (month: string, year: string): boolean => {
    if (!month || !year || month.length !== 2 || year.length !== 2) return false;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
  };

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
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 2) {
      setFormData({ ...formData, expiryMonth: value });
    }
  };

  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 2) {
      setFormData({ ...formData, expiryYear: value });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setFormData({ ...formData, cvv: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ cardNumber: "", expiryDate: "" });

    if (!isValidCardNumber(formData.cardNumber)) {
      setErrors(prev => ({ ...prev, cardNumber: "Invalid card number" }));
      return;
    }

    if (!isValidExpiryDate(formData.expiryMonth, formData.expiryYear)) {
      setErrors(prev => ({ ...prev, expiryDate: "Invalid expiry date" }));
      return;
    }

    if (onSubmit) {
      onSubmit(formData);
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
            <CardHeader className="space-y-1 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#0070ba]" />
                  <h2 className="text-xl font-semibold">{t('paymentInformation')}</h2>
                </div>
                <img src={sslBadge} alt="SSL" className="h-6" data-testid="img-ssl-badge" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('enterCardDetails')}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber" className="text-sm font-semibold">
                    {t('cardNumber')} *
                  </Label>
                  <Input
                    id="cardNumber"
                    data-testid="input-card-number"
                    placeholder="1234 5678 9012 3456"
                    value={formatCardNumber(formData.cardNumber)}
                    onChange={handleCardNumberChange}
                    required
                    className={`h-12 text-base ${errors.cardNumber ? 'border-red-500' : ''}`}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      {t('expiryDate')} *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="expiryMonth"
                        data-testid="input-expiry-month"
                        placeholder="MM"
                        value={formData.expiryMonth}
                        onChange={handleExpiryMonthChange}
                        required
                        className={`h-12 text-base ${errors.expiryDate ? 'border-red-500' : ''}`}
                      />
                      <Input
                        id="expiryYear"
                        data-testid="input-expiry-year"
                        placeholder="AA"
                        value={formData.expiryYear}
                        onChange={handleExpiryYearChange}
                        required
                        className={`h-12 text-base ${errors.expiryDate ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cvv" className="text-sm font-semibold">
                      {t('cvvCode')} *
                    </Label>
                    <div className="relative">
                      <Input
                        id="cvv"
                        data-testid="input-cvv"
                        placeholder="123"
                        type="password"
                        value={formData.cvv}
                        onChange={handleCvvChange}
                        required
                        className="h-12 text-base"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full text-base"
                    disabled={isLoading}
                    data-testid="button-submit"
                  >
                    {isLoading ? "Processing..." : "Continue"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <span>{t('securePayment')}</span>
                  </div>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t text-center space-y-2">
                <p className="text-xs text-gray-500">
                  Secured by PayPal • SSL Encryption
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
