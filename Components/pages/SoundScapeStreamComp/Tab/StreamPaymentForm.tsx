import React, { useState, useEffect, ReactNode } from 'react';
import { useStripe, useElements, PaymentElement, CardElement } from '@stripe/react-stripe-js';
import { Button, InputNumber, Spin, Card, Typography, Divider } from 'antd';
import PaymentCard from '@/Components/custom/payment-card';

const { Text, Title } = Typography;

interface StreamPaymentFormProps {
    amount: number;
    setAmount: (amount: number) => void;
    hostId: string;
    streamId: string;
    userId: string;
    onSuccess: (paymentIntentId: string, amount: number, paymentIntentStatus: any) => void;
    onCancel: () => void;
    apiEndpoint: string;
    title: string;
    icon: ReactNode;
    description: string;
    buttonLabel: string;
    notify: (args: { type: string; message: string }) => void;
}

const StreamPaymentForm: React.FC<StreamPaymentFormProps> = ({
    amount,
    setAmount,
    hostId,
    streamId,
    userId,
    onSuccess,
    onCancel,
    apiEndpoint,
    title,
    icon,
    description,
    buttonLabel,
    notify
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState<string | null>(null);

    const presetAmounts = [1, 5, 10, 25, 50, 100];

    useEffect(() => {
        createPaymentIntent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [amount]);

    const createPaymentIntent = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    amount: amount,
                    description: `${title} - $${amount}`,
                    hostId: hostId,
                    streamId: streamId
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment intent');
            }

            setClientSecret(data.clientSecret);
        } catch (err: any) {
            setError(err.message);
            notify({ type: 'error', message: 'Payment Error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                throw new Error(submitError.message);
            }

            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                notify({ type: "error", message: "Card input not found. Please refresh and try again." });
                setLoading(false);
                return;
            }

            const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            // const { paymentIntent, error: confirmError } = await stripe.confirmPayment({
            //     elements,
            //     clientSecret,
            //     confirmParams: {
            //         return_url: `${window.location.origin}/payment-success?amount=${amount}`,
            //     },
            //     redirect: 'if_required',
            // });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess(paymentIntent.id, amount, paymentIntent.status);
            }
        } catch (err: any) {
            setError(err.message);
            notify({ type: 'error', message: 'Payment Error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !clientSecret) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px' }}>Setting up payment...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {icon}
                <Title level={3}>{title}</Title>
                <Text type="secondary">
                    {description}
                </Text>
            </div>

            <Card style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                    <Text strong>Choose Amount:</Text>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {presetAmounts.map((presetAmount) => (
                        <Button
                            key={presetAmount}
                            type={amount === presetAmount ? 'primary' : 'default'}
                            onClick={() => setAmount(presetAmount)}
                            style={{ minWidth: '60px' }}
                        >
                            ${presetAmount}
                        </Button>
                    ))}
                </div>
                <div>
                    <Text strong>Custom Amount:</Text>
                    <InputNumber
                        value={amount}
                        onChange={(value) => setAmount(value || 1)}
                        min={1}
                        max={1000}
                        style={{ width: '100%', marginTop: '8px' }}
                        addonBefore="$"
                        precision={2}
                    />
                </div>
            </Card>

            {error && (
                <div style={{
                    color: '#ff4d4f',
                    backgroundColor: '#fff2f0',
                    border: '1px solid #ffccc7',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px'
                }}>
                    {error}
                </div>
            )}

            {clientSecret && (
                <form onSubmit={handleSubmit}>
                    {/* <Card style={{ marginBottom: '24px' }}>
                        <PaymentElement />
                    </Card> */}
                    <div style={{ marginBottom: '24px' }}>
                        <PaymentCard />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            onClick={onCancel}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            disabled={!stripe || !elements}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Processing...' : `${buttonLabel} $${amount}`}
                        </Button>
                    </div>
                </form>
            )}

            <Divider />

            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Your payment is secure and processed by Stripe.
                </Text>
            </div>
        </div>
    );
};

export default StreamPaymentForm; 