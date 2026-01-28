import { useState, useCallback } from 'react';
import { message } from 'antd'
import { PaymentMethodUI } from '@/types/dashboardPaymentTab/paymentInterface';

export const usePaymentMethods = () => {
    const [methods, setMethods] = useState<PaymentMethodUI[]>([]);
    const [loading, setLoading] = useState(false);

    const loadMethods = useCallback(async (userId: string) => {
        try {
            setLoading(true);
            const res = await fetch('/api/stripe/payment-method/list-payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            const json = await res.json();

            if (json.error) {
                console.error("Error fetching methods: ", json.error);
                return;
            }

            const def = json.defaultPaymentMethod as string | null;
            setMethods(
                (json.paymentMethods as any[]).map(pm => ({
                    id: pm.id,
                    brand: pm.card.brand,
                    last4: pm.card.last4,
                    exp_month: pm.card.exp_month,
                    exp_year: pm.card.exp_year,
                    isDefault: pm.id === def,
                }))
            );
        } catch (error) {
            console.error('Error loading payment methods:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const setDefaultMethod = useCallback(async (userId: string, paymentMethodId: string) => {
        try {
            await fetch('/api/stripe/payment-method/set-default-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, paymentMethodId }),
            });
            message.success('Default method set');
            await loadMethods(userId);
        } catch (error) {
            message.error('Failed to set default method');
        }
    }, [loadMethods]);

    const removeMethod = useCallback(async (userId: string, paymentMethodId: string) => {
        try {
            await fetch('/api/stripe/payment-method/detach-payment-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethodId }),
            });
            message.success('Payment method removed');
            await loadMethods(userId);
        } catch (error) {
            message.error('Failed to remove payment method');
        }
    }, [loadMethods]);

    return {
        methods,
        loading,
        loadMethods,
        setDefaultMethod,
        removeMethod,
    };
};