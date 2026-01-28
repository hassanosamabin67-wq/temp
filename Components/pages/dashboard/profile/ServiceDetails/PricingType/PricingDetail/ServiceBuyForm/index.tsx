import React, { useEffect, useState } from 'react';
import { useStripe, useElements, PaymentElement, CardElement } from '@stripe/react-stripe-js';
import { Button, Spin, Card, Typography, Divider } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import styles from './style.module.css';
import { insertInvoice } from '@/utils/add-invoices/invoice';
import { getClientCountry } from '@/lib/getClientCountry';
import { useRouter } from 'next/navigation';
import PaymentCard from '@/Components/custom/payment-card';

const { Text, Title } = Typography;

interface ServicePaymentFormProps {
    serviceProviderId: string;
    serviceId: string;
    serviceTitle: string;
    totalAmount: number;
    servicePrice: number;
    addOns?: any[];
    orderData?: any;
    onSuccess: (paymentIntentId: string, orderId: string, totalAmount: number) => void;
    onCancel: () => void;
}

const ServiceBuyForm: React.FC<ServicePaymentFormProps> = ({
    serviceId,
    serviceProviderId,
    serviceTitle,
    totalAmount,
    servicePrice,
    addOns = [],
    orderData,
    onSuccess,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState<string | null>(null);
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const router = useRouter()

    useEffect(() => {
        createPaymentIntent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const createPaymentIntent = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/stripe/service-buy-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serviceProviderId,
                    serviceTitle,
                    amount: totalAmount,
                    serviceId,
                    orderData
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment intent');
            }

            setClientSecret(data.clientSecret);
        } catch (err: any) {
            setError(err.message);
            notify({ type: 'error', message: 'Payment Error', description: err.message });
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
            //         return_url: `${window.location.origin}/payment-success?serviceId=${serviceId}`,
            //     },
            //     redirect: 'if_required',
            // });

            if (confirmError) {
                throw new Error(confirmError.message);
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                router.push(`/payment-success?serviceId=${serviceId}`)
                const orderId = await recordServicePurchase(paymentIntent.id, paymentIntent.status);

                if (orderId) {
                    await updateServiceBookingCount();
                    try {
                        await insertInvoice({ amount: totalAmount, clientId: profile.profileId!, priceType: "fixed", serviceId, serviceTitle, visionaryId: serviceProviderId, orderId, issueDate: new Date().toISOString(), dueDate: orderData?.deadline.toISOString(), serviceAddOns: addOns })
                    } catch (error) {
                        console.error("Error inserting invoices: ", error);
                    }
                    notify({ type: 'success', message: `Successfully Booked "${serviceTitle}"!`, description: 'Your order has been placed and payment processed.' });
                    onSuccess(paymentIntent.id, orderId, totalAmount);
                }
            }
        } catch (err: any) {
            setError(err.message);
            notify({
                type: 'error',
                message: 'Payment Error',
                description: err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const recordServicePurchase = async (paymentIntentId: string, paymentIntentStatus: string) => {
        try {
            const { client_country_code, client_country_name } = await getClientCountry();

            const { data: order, error: orderError } = await supabase
                .from('service_orders')
                .insert([{
                    service_id: serviceId,
                    client_id: profile.profileId,
                    visionary_id: serviceProviderId,
                    service_name: serviceTitle,
                    package_name: orderData?.packageName || 'Default Package',
                    amount: totalAmount,
                    reference_file: orderData?.file_url || [],
                    status: 'paid',
                    details_text: orderData?.description,
                    deadline: orderData?.deadline.toISOString(),
                    add_ons: addOns.length > 0 ? JSON.stringify(addOns) : null,
                    created_at: new Date().toISOString(),
                    client_country_code,
                    client_country_name,
                }])
                .select("*")
                .single();

            if (orderError) {
                console.error('Error creating service order:', orderError);
                throw new Error('Failed to create service order');
            }

            const { error: transactionError } = await supabase
                .from('transactions')
                .insert({
                    stripe_transaction_id: paymentIntentId,
                    amount: totalAmount,
                    application_fee: Math.round(totalAmount * 0.15),
                    user_id: serviceProviderId,
                    client_id: profile.profileId,
                    type: "Service",
                    category: 'Service',
                    status: paymentIntentStatus,
                    purchase_name: `Purchased: ${serviceTitle}`
                });

            if (transactionError) {
                console.error('Error recording transaction:', transactionError);
            }

            return order.id;

        } catch (error) {
            console.error('Error in recordServicePurchase:', error);
            throw error;
        }
    };

    const updateServiceBookingCount = async () => {
        try {
            const { data, error } = await supabase
                .from("service")
                .select("bookings_count")
                .eq("id", serviceId)
                .single();

            if (!error && data) {
                const newCount = (data.bookings_count || 0) + 1;

                const { error: updateError } = await supabase
                    .from("service")
                    .update({ bookings_count: newCount })
                    .eq("id", serviceId);

                if (updateError) console.error("Error updating booking count:", updateError);
            }
        } catch (error) {
            console.error('Error in updateServiceBookingCount:', error);
        }
    };

    const calculatePlatformFee = () => {
        return Math.round(totalAmount * 0.15 * 100) / 100;
    };

    const calculateServiceProviderAmount = () => {
        return totalAmount - calculatePlatformFee();
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
        <div style={{ padding: '20px', maxHeight: 620, overflow: "auto" }}>
            <Title level={3} style={{ marginBottom: '16px' }}>
                Complete Your Purchase
            </Title>

            <Card style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Service:</Text>
                    <Text strong>{serviceTitle}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Package:</Text>
                    <Text strong>{orderData?.packageName}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Base Price:</Text>
                    <Text strong>${servicePrice}</Text>
                </div>

                {addOns.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                        <Text>Add-ons:</Text>
                        {addOns.map((addon, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginLeft: '16px' }}>
                                <Text type="secondary">- {addon.name}</Text>
                                <Text type="secondary">+${addon.price}</Text>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Subtotal:</Text>
                    <Text strong>${totalAmount}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text>Platform Fee (15%):</Text>
                    <Text strong>${calculatePlatformFee()}</Text>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>Total:</Text>
                    <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                        ${totalAmount}
                    </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Service Provider receives: ${calculateServiceProviderAmount()}
                    </Text>
                </div>
            </Card>

            {error && (
                <div className={styles.errorMessage} style={{
                    color: '#ff4d4f',
                    background: '#fff2f0',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '16px',
                    border: '1px solid #ffccc7'
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
                            disabled={loading}
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
                            {loading ? 'Processing...' : `Pay $${totalAmount}`}
                        </Button>
                    </div>
                </form>
            )}

            <Divider />

            <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                    Your payment is secure and processed by Stripe. A 15% platform fee is included.
                </Text>
            </div>
        </div>
    );
};

export default ServiceBuyForm;