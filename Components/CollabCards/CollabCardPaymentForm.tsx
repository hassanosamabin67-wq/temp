'use client'

import React, { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button, Alert, Spin } from 'antd';
import { useNotification } from '../custom/custom-notification';
import { useRouter } from 'next/navigation';

interface CollabCardPaymentFormProps {
    userId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const CollabCardPaymentForm: React.FC<CollabCardPaymentFormProps> = ({
    userId,
    onSuccess,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const { notify } = useNotification();
    const router = useRouter();
    
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState<string>('');
    const [paymentIntentId, setPaymentIntentId] = useState('');

    useEffect(() => {
        // Create payment intent for Collab Card purchase
        const createPaymentIntent = async () => {
            try {
                const response = await fetch('/api/stripe/issuing/buy-card', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });

                const data = await response.json();

                if (data.success) {
                    setClientSecret(data.clientSecret);
                    setPaymentIntentId(data.paymentIntentId);
                } else {
                    setError(data.error || 'Failed to create payment');
                    notify({ type: 'error', message: data.error || 'Failed to create payment' });
                }
            } catch (err) {
                console.error('Error creating payment intent:', err);
                setError('Failed to create payment');
                notify({ type: 'error', message: 'Failed to create payment' });
            }
        };

        createPaymentIntent();
    }, [userId, notify]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        if (!stripe || !elements || !clientSecret) {
            setLoading(false);
            return;
        }

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message || 'Payment failed');
                setLoading(false);
                return;
            }

            // Check if payment intent is already succeeded
            if (paymentIntentId) {
                try {
                    const response = await fetch(`/api/stripe/check-payment-status?paymentIntentId=${paymentIntentId}`);
                    const data = await response.json();
                    
                    if (data.success && data.status === 'succeeded') {
                        notify({ type: 'success', message: 'Payment successful!' });
                        onSuccess();
                        return;
                    }
                } catch (err) {
                    console.error('Error checking payment status:', err);
                }
            }

            const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/collab-cards/success`
                },
                redirect: "if_required",
            });

            if (confirmError) {
                // Handle specific error for already succeeded payment
                if (confirmError.code === 'payment_intent_unexpected_state') {
                    notify({ type: 'success', message: 'Payment successful!' });
                    onSuccess();
                    return;
                }
                setError(confirmError.message || 'Payment failed');
                setLoading(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                notify({ type: 'success', message: 'Payment successful!' });
                onSuccess();
            } else {
                setError('Payment failed. Please try again.');
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('An unexpected error occurred. Please try again.');
        }

        setLoading(false);
    };

    if (!clientSecret) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Preparing payment...</div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
                <h3>Collab Card Purchase - $10</h3>
                <p>Complete your payment to get your Collab Card</p>
            </div>

            {error && (
                <Alert
                    message="Payment Error"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />
            )}

            <PaymentElement />

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    disabled={!stripe || !elements}
                >
                    Pay $10
                </Button>
            </div>
        </form>
    );
};

export default CollabCardPaymentForm; 