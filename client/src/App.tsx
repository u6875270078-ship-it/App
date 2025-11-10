import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import PayPalPage from "@/pages/PayPalPage";
import PayPalWaitingPage from "@/pages/PayPalWaitingPage";
import PayPalOTPPage from "@/pages/PayPalOTPPage";
import PayPalFailurePage from "@/pages/PayPalFailurePage";
import DHLWaitingPage from "@/pages/DHLWaitingPage";
import DHLOTPPage from "@/pages/DHLOTPPage";
import DHLErrorPage from "@/pages/DHLErrorPage";
import DHLOTPErrorPage from "@/pages/DHLOTPErrorPage";
import DHLSuccessPage from "@/pages/DHLSuccessPage";
import AdminPage from "@/pages/AdminPage";

function Router() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get("paymentId") || localStorage.getItem("dhlPaymentId") || "";

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/paypal" component={PayPalPage} />
      <Route path="/paypal/waiting" component={PayPalWaitingPage} />
      <Route path="/paypal/otp" component={PayPalOTPPage} />
      <Route path="/paypal/failure" component={PayPalFailurePage} />
      <Route path="/dhl/waiting" component={DHLWaitingPage} />
      <Route path="/otp1">
        {() => <DHLOTPPage step={1} paymentId={paymentId} />}
      </Route>
      <Route path="/otp2">
        {() => <DHLOTPPage step={2} paymentId={paymentId} />}
      </Route>
      <Route path="/error" component={DHLErrorPage} />
      <Route path="/otp-error" component={DHLOTPErrorPage} />
      <Route path="/success" component={DHLSuccessPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
