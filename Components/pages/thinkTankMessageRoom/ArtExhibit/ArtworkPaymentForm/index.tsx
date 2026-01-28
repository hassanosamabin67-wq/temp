import React, { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, CardElement } from '@stripe/react-stripe-js';
import { Button, Spin, Card, Typography, Divider, message } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { Artwork } from '../types';
import PaymentCard from '@/Components/custom/payment-card';

const { Text, Title } = Typography;

interface ArtworkPaymentFormProps {
  artwork: Artwork;
  onSuccess: () => void;
  onCancel: () => void;
  hostId: string;
  createdBy: string
}

const ArtworkPaymentForm: React.FC<ArtworkPaymentFormProps> = ({
  artwork,
  onSuccess,
  onCancel,
  hostId,
  createdBy
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

      const response = await fetch('/api/stripe/artwork-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artworkId: artwork.id,
          buyerId: profile.profileId,
          amount: artwork.price || 0,
          hostId: hostId,
          createdBy: createdBy
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
      //   elements,
      //   clientSecret,
      //   confirmParams: {
      //     return_url: `${window.location.origin}/payment-success?amount=${artwork.price}`,
      //   },
      //   redirect: 'if_required',
      // });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // router.push(`/payment-success?serviceId=${serviceId}`)
        // Record the transaction
        await recordArtworkPurchase(paymentIntent.id, paymentIntent.status);

        // Mark artwork as sold
        await markArtworkAsSold();

        notify({ type: 'success', message: `Successfully purchased "${artwork.title}"!` });
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
      notify({ type: 'error', message: 'Payment Error' });
    } finally {
      setLoading(false);
    }
  };

  const recordArtworkPurchase = async (paymentIntentId: string, paymentIntentStatus: any) => {
    try {
      const { error } = await supabase.from('transactions').insert({
        stripe_transaction_id: paymentIntentId,
        amount: artwork.price,
        user_id: hostId, // Artist ID
        client_id: profile.profileId, // Buyer ID
        type: "Artwork Purchase",
        category: "Collab Room",
        status: paymentIntentStatus,
        purchase_name: `Purchased ${artwork.title} Artwork`
      });

      if (error) {
        console.error('Error recording artwork purchase:', error);
        throw new Error('Failed to record purchase');
      }
    } catch (error) {
      console.error('Error in recordArtworkPurchase:', error);
      throw error;
    }
  };

  const markArtworkAsSold = async () => {
    try {
      const { error } = await supabase
        .from('art_exhibit_room')
        .update({
          is_sold: true,
          sold_to: profile.profileId
        })
        .eq('id', artwork.id);

      if (error) {
        console.error('Error marking artwork as sold:', error);
        throw new Error('Failed to update artwork status');
      }
    } catch (error) {
      console.error('Error in markArtworkAsSold:', error);
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
      <Title level={3} style={{ marginBottom: '16px' }}>
        Complete Your Purchase
      </Title>

      <Card style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text>Artwork:</Text>
          <Text strong>{artwork.title}</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text>Price:</Text>
          <Text strong>${artwork.price}</Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Text strong>Total:</Text>
          <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
            ${artwork.price}
          </Text>
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
              {loading ? 'Processing...' : `Pay $${artwork.price}`}
            </Button>
          </div>
        </form>
      )}

      <Divider />

      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Your payment is secure and processed by Stripe. A 20% platform fee will be deducted from the artist's payment.
        </Text>
      </div>
    </div>
  );
};

export default ArtworkPaymentForm; 