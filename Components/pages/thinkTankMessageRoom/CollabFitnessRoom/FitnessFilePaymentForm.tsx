import React, { useEffect, useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { Button, Spin } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { FitnessFileRecord } from '@/utils/fitnessRoom';
import PaymentCard from '@/Components/custom/payment-card';

interface FitnessFilePaymentFormProps {
  file: FitnessFileRecord;
  onSuccess: () => void;
  onCancel: () => void;
  hostId: string;
}

const FitnessFilePaymentForm: React.FC<FitnessFilePaymentFormProps> = ({
  file,
  onSuccess,
  onCancel,
  hostId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const profile = useAppSelector((state) => state.auth);
  const { notify } = useNotification();

  useEffect(() => {
    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/fitness-file-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          buyerId: profile.profileId,
          amount: file.price || 0,
          hostId: hostId,
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

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Record the transaction
        await recordFilePurchase(paymentIntent.id, paymentIntent.status);

        notify({ type: 'success', message: `Successfully purchased "${file.name}"!` });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      notify({ type: 'error', message: 'Payment Error' });
    } finally {
      setLoading(false);
    }
  };

  const recordFilePurchase = async (paymentIntentId: string, paymentIntentStatus: any) => {
    try {
      const { error } = await supabase.from('transactions').insert({
        stripe_transaction_id: paymentIntentId,
        amount: file.price,
        user_id: hostId, // Host ID
        client_id: profile.profileId, // Buyer ID
        type: "Fitness File Purchase",
        category: "Fitness Room",
        status: paymentIntentStatus,
        purchase_name: `Purchased ${file.name} File`
      });

      if (error) {
        console.error('Error recording file purchase:', error);
        throw new Error('Failed to record purchase');
      }
    } catch (error) {
      console.error('Error in recordFilePurchase:', error);
      throw error;
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
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: 18, fontWeight: 800 }}>
        Complete Your Purchase
      </h3>

      <div style={{ background: '#f3f4f6', padding: 16, borderRadius: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>File:</span>
          <span style={{ fontWeight: 700 }}>{file.name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Price:</span>
          <span style={{ fontWeight: 700 }}>${file.price}</span>
        </div>
      </div>

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
              {loading ? 'Processing...' : `Pay $${file.price}`}
            </Button>
          </div>
        </form>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          Your payment is secure and processed by Stripe. A 20% platform fee will be deducted from the host's payment.
        </span>
      </div>
    </div>
  );
};

export default FitnessFilePaymentForm;