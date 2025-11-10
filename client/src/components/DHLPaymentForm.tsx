import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, CreditCard } from "lucide-react";
import sslBadge from "@assets/generated_images/SSL_security_badge_5a63cf55.png";
import { useLanguage } from "@/hooks/use-language";

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
  const { t } = useLanguage();
  const [formData, setFormData] = useState<PaymentFormData>({
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardholderName: "",
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
    const currentYear = now.getFullYear() % 100; // Get last 2 digits
    const currentMonth = now.getMonth() + 1;
    
    // Check if the card is expired
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
    
    // Reset errors
    setErrors({ cardNumber: "", expiryDate: "" });
    
    // Validate card number
    if (!isValidCardNumber(formData.cardNumber)) {
      setErrors(prev => ({ ...prev, cardNumber: "Invalid card number. Please check your card." }));
      return;
    }
    
    // Validate expiry date
    if (!isValidExpiryDate(formData.expiryMonth, formData.expiryYear)) {
      setErrors(prev => ({ ...prev, expiryDate: "Card has expired or invalid date." }));
      return;
    }
    
    onSubmit?.(formData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* DHL Header */}
      <header className="bg-[#FFCC00] border-b-4 border-[#D40511]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/dhl-logo.png" alt="DHL" className="h-10" data-testid="img-dhl-logo" />
            <span className="text-[#D40511] font-semibold text-sm hidden sm:inline">
              {t('shipNow')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white border-2 border-[#D40511] text-[#D40511] hover:bg-[#D40511] hover:text-white font-semibold h-9"
              data-testid="button-connect"
            >
              {t('login')}
            </Button>
            <Button 
              size="sm"
              className="bg-[#D40511] hover:bg-[#B8040E] text-white font-semibold h-9"
              data-testid="button-register"
            >
              {t('register')}
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 text-sm">
            <button className="py-3 text-foreground hover:text-[#D40511] font-medium hover-elevate active-elevate-2">
              {t('ship')}
            </button>
            <button className="py-3 text-foreground hover:text-[#D40511] font-medium hover-elevate active-elevate-2">
              {t('track')}
            </button>
            <button className="py-3 text-foreground hover:text-[#D40511] font-medium hover-elevate active-elevate-2">
              {t('myShipments')}
            </button>
            <button className="py-3 text-foreground hover:text-[#D40511] font-medium hover-elevate active-elevate-2">
              {t('supportNav')}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {t('dhlInvoicePayment')}
            </h1>
            <p className="text-muted-foreground">
              {t('completePayment')}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>{t('sslSecure')}</span>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#D40511] text-white flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="w-16 h-0.5 bg-border"></div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-border text-muted-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="w-16 h-0.5 bg-border"></div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-border text-muted-foreground flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="w-16 h-0.5 bg-border"></div>
            </div>
            <div className="w-8 h-8 rounded-full bg-border text-muted-foreground flex items-center justify-center text-sm font-semibold">
              4
            </div>
          </div>

          {/* Payment Card */}
          <Card className="border-2">
            <CardHeader className="space-y-1 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D40511]" />
                  <h2 className="text-xl font-semibold">{t('paymentInformation')}</h2>
                </div>
                <img src={sslBadge} alt="SSL" className="h-6" data-testid="img-ssl-badge" />
              </div>
              <CardDescription>
                {t('enterCardDetails')}
              </CardDescription>
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
                        value={formData.cvv}
                        onChange={handleCvvChange}
                        required
                        className="h-12 text-base pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardholderName" className="text-sm font-semibold">
                    {t('cardholderName')} *
                  </Label>
                  <Input
                    id="cardholderName"
                    data-testid="input-cardholder-name"
                    placeholder="JEAN DUPONT"
                    value={formData.cardholderName}
                    onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })}
                    required
                    className="h-12 text-base uppercase"
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#D40511] hover:bg-[#B8040E] text-white font-semibold text-base"
                    data-testid="button-proceed"
                  >
                    {t('continueVerification')}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('termsAccept')}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Footer */}
          <div className="text-center space-y-3 pt-4">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {t('securePayment')}
              </span>
              <span>•</span>
              <span>{t('ssl256')}</span>
              <span>•</span>
              <span>{t('dataProtected')}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>{t('copyright')}</p>
            <div className="flex items-center justify-center gap-4">
              <button className="hover:text-[#D40511] hover-elevate active-elevate-2">
                {t('termsOfUse')}
              </button>
              <span>•</span>
              <button className="hover:text-[#D40511] hover-elevate active-elevate-2">
                {t('privacyPolicy')}
              </button>
              <span>•</span>
              <button className="hover:text-[#D40511] hover-elevate active-elevate-2">
                {t('help')}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
