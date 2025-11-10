import OTPVerification from '../OTPVerification';

export default function OTPVerificationExample() {
  return (
    <OTPVerification 
      step={1}
      onSubmit={(otp) => console.log('OTP submitted:', otp)}
      onResend={() => console.log('Resend OTP clicked')}
    />
  );
}
