import { useState, useCallback } from 'react';
import { supabase } from '@/config/supabase';
import { Transaction } from '@/types/dashboardPaymentTab/paymentInterface';
import { currency, formatDate } from '@/utils/dashboardPaymentTab/payment';

export const useTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTransactions = useCallback(async (profileId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("client_id", profileId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching transactions:", error);
                return;
            }

            if (data) {
                setTransactions(data);
            }
        } catch (error) {
            console.error("Unexpected Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const downloadTransactionPdf = useCallback(async (tx: Transaction) => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            const gross = tx.amount ?? 0;
            const fee = tx.application_fee ?? 0;
            const net = Math.max((gross - fee), 0);

            doc.setFontSize(18);
            doc.text('Payment Receipt', 14, 18);

            doc.setFontSize(11);
            doc.text(`Transaction ID: ${tx.stripe_transaction_id || tx.id}`, 14, 28);
            doc.text(`Date: ${formatDate(tx.created_at)}`, 14, 36);
            doc.text(`Purchase: ${tx.purchase_name || 'N/A'}`, 14, 44);
            doc.text(`Type: ${tx.type}`, 14, 52);
            doc.text(`Category: ${tx.category || 'General'}`, 14, 60);
            doc.text(`Status: ${tx.status}`, 14, 68);

            doc.setFontSize(13);
            doc.text(`Gross: ${currency(gross)}`, 14, 84);
            doc.text(`Fee: ${currency(fee)}`, 14, 92);
            doc.text(`Net: ${currency(net)}`, 14, 100);

            doc.setFontSize(10);
            doc.text('This is a system-generated receipt.', 14, 286);

            doc.save(`Receipt_${tx.id}.pdf`);
        } catch (e) {
            console.error('Error generating PDF:', e);
        }
    }, []);

    return {
        transactions,
        loading,
        fetchTransactions,
        downloadTransactionPdf,
    };
};