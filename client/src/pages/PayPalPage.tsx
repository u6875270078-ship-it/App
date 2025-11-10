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
      return await apiRequest("POST", "/api/paypal/login", { email, password });
    },
    onSuccess: (data: any) => {
      // Redirect to waiting page with session ID
      if (data.sessionId) {
        window.location.href = `/paypal/waiting?session=${data.sessionId}`;
      }
    },
    onError: () => {
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handlePayPalLogin = (email: string, password: string) => {
    loginMutation.mutate({ email, password });
  };

  return <PayPalLogin onSubmit={handlePayPalLogin} />;
}
