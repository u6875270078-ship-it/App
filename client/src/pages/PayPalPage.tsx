import PayPalLogin from "@/components/PayPalLogin";

export default function PayPalPage() {
  const handlePayPalLogin = (email: string, password: string) => {
    console.log("PayPal login attempt:", { email, password });
  };

  return <PayPalLogin onSubmit={handlePayPalLogin} />;
}
