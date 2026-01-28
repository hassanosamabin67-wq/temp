import React, { useState } from 'react';
import { Modal, message } from 'antd';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AddCardInnerProps {
    userId: string;
    userInfo: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    onClose: () => void;
    onAdded: () => void;
}

const AddCardInner: React.FC<AddCardInnerProps> = ({ userId, userInfo, onClose, onAdded }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!stripe || !elements) return;
        setSubmitting(true);

        try {
            const res = await fetch('/api/stripe/payment-method/create-setup-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const { clientSecret, error } = await res.json();
            if (error || !clientSecret) throw new Error(error || 'No clientSecret');

            const card = elements.getElement(CardElement);
            const { setupIntent, error: confirmErr } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: card!,
                    billing_details: {
                        name: `${userInfo?.firstName} ${userInfo?.lastName}` || 'Cardholder',
                        email: userInfo?.email,
                    },
                },
            });
            if (confirmErr) throw confirmErr;

            message.success('Card added successfully');
            onAdded();
            onClose();
        } catch (e: any) {
            message.error(e?.message || 'Failed to add card');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Add Payment Method"
            open
            onCancel={onClose}
            onOk={handleSubmit}
            okButtonProps={{ loading: submitting }}
            destroyOnClose
        >
            <div style={{ padding: 8, border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
                <CardElement options={{ hidePostalCode: true }} />
            </div>
            <p style={{ color: '#888', marginTop: 8 }}>
                Card details are encrypted and sent directly to Stripe.
            </p>
        </Modal>
    );
};

interface AddCardModalProps {
    open: boolean;
    userId: string;
    userInfo: {
        firstName?: string;
        lastName?: string;
        email?: string;
    };
    onClose: () => void;
    onAdded: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ open, userId, userInfo, onClose, onAdded }) => {
    if (!open) return null;

    return (
        <Elements stripe={stripePromise}>
            <AddCardInner userId={userId} userInfo={userInfo} onClose={onClose} onAdded={onAdded} />
        </Elements>
    );
};