import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";

interface PayPalLoginProps {
  onSubmit?: (email: string, password: string) => void;
}

export default function PayPalLogin({ onSubmit }: PayPalLoginProps) {
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("password");
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(email, password);
  };

  const handleEditEmail = () => {
    setStep("email");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-16 w-auto" data-testid="img-paypal-logo" />
          </div>

          {/* Email Step */}
          {step === "email" && (
            <div className="space-y-6">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Input
                    id="email"
                    type="email"
                    data-testid="input-email"
                    placeholder="Email o numero di cellulare"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-border focus:border-[#0070ba] rounded-lg"
                  />
                  
                  <button
                    type="button"
                    className="text-sm text-[#0070ba] hover:underline"
                    data-testid="link-forgot-email"
                  >
                    Hai dimenticato l'indirizzo email?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full text-base"
                  data-testid="button-next"
                >
                  Avanti
                </Button>
              </form>

              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  oppure
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-foreground text-foreground hover:bg-muted/50 font-semibold rounded-full text-base"
                  data-testid="button-register"
                >
                  Registrati gratis
                </Button>
              </div>
            </div>
          )}

          {/* Password Step */}
          {step === "password" && (
            <div className="space-y-6">
              {/* Email display with edit link */}
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="font-medium" data-testid="text-email-display">{email}</span>
                <button
                  type="button"
                  onClick={handleEditEmail}
                  className="text-[#0070ba] hover:underline"
                  data-testid="button-edit-email"
                >
                  Modifica
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Input
                    id="password"
                    type="password"
                    data-testid="input-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 text-base border-2 border-border focus:border-[#0070ba] rounded-lg"
                  />
                  
                  <button
                    type="button"
                    className="text-sm text-[#0070ba] hover:underline"
                    data-testid="link-forgot-password"
                  >
                    Password dimenticata?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full text-base"
                  data-testid="button-login"
                >
                  Accedi
                </Button>
              </form>

              <div className="space-y-4">
                <div className="text-center text-sm text-muted-foreground">
                  oppure
                </div>

                <Button
                  variant="outline"
                  className="w-full h-12 border-2 border-foreground text-foreground hover:bg-muted/50 font-semibold rounded-full text-base"
                  data-testid="button-register-2"
                >
                  Registrati gratis
                </Button>
              </div>
            </div>
          )}

          {/* Language Selector */}
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="text-base">🇮🇹</span>
              <button className="hover:underline">Italiano</button>
            </div>
            <button className="hover:underline">English</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <button className="hover:underline">Contattaci</button>
            <button className="hover:underline">Privacy</button>
            <button className="hover:underline">Accordi legali</button>
            <button className="hover:underline">Nel mondo</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
