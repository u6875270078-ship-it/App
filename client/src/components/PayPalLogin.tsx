import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock } from "lucide-react";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";
import sslBadge from "@assets/generated_images/SSL_security_badge_5a63cf55.png";

interface PayPalLoginProps {
  onSubmit?: (email: string, password: string) => void;
}

export default function PayPalLogin({ onSubmit }: PayPalLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email, password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-6">
          <img src={paypalLogo} alt="PayPal Logo" className="h-10" data-testid="img-paypal-logo" />
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Connexion à votre compte
            </h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  placeholder="nom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    data-testid="input-password"
                    placeholder="Entrez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover-elevate active-elevate-2 p-1 rounded"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                data-testid="button-login"
              >
                Se connecter
              </Button>

              <button
                type="button"
                className="w-full text-sm text-primary underline hover-elevate active-elevate-2"
                data-testid="link-trouble-login"
              >
                Problème de connexion ?
              </button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Connexion sécurisée</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <img src={sslBadge} alt="SSL Security" className="h-6" data-testid="img-ssl-badge" />
            <p className="text-xs text-muted-foreground">Protection SSL 256-bit</p>
          </div>
        </div>
      </div>
    </div>
  );
}
