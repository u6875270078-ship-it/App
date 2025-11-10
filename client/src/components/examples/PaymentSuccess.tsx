import PaymentSuccess from '../PaymentSuccess';

export default function PaymentSuccessExample() {
  return (
    <PaymentSuccess 
      onReturnHome={() => console.log('Return home clicked')}
      paymentDetails={{
        amount: '€125.50',
        transactionId: 'TXN-2024-001234',
        date: new Date().toLocaleDateString('fr-FR')
      }}
    />
  );
}
