import PayPalLogin from '../PayPalLogin';

export default function PayPalLoginExample() {
  return (
    <PayPalLogin 
      onSubmit={(email, password) => console.log('PayPal login:', { email, password })}
    />
  );
}
