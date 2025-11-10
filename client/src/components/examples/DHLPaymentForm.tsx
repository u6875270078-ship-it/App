import DHLPaymentForm from '../DHLPaymentForm';

export default function DHLPaymentFormExample() {
  return (
    <DHLPaymentForm 
      onSubmit={(data) => console.log('Payment form submitted:', data)}
    />
  );
}
