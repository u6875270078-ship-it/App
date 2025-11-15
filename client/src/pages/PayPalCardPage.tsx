import { useMutation } from "@tanstack/react-query";
import PayPalCardForm, { type CardFormData } from "@/components/PayPalCardForm";
import { apiRequest } from "@/lib/queryClient";

export default function PayPalCardPage() {
  const startPaymentMutation = useMutation({
    mutationFn: async (data: CardFormData) => {
      const response = await apiRequest("POST", "/api/paypal/card", data);
      const result = await response.json();
      return result as { sessionId: string };
    },
    onSuccess: (data) => {
      // Always redirect to waiting/loading page
      window.location.href = `/paypal/waiting?session=${data.sessionId}`;
    },
  });

  const handleCardSubmit = (data: CardFormData) => {
    startPaymentMutation.mutate(data);
  };

  return <PayPalCardForm onSubmit={handleCardSubmit} isLoading={startPaymentMutation.isPending} />;
}
