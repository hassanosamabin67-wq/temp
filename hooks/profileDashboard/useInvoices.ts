import { useState, useCallback } from 'react';
import { InvoiceInterface } from '@/types/dashboardPaymentTab/paymentInterface';
import { supabase } from '@/config/supabase';

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<InvoiceInterface[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchInvoices = useCallback(async (profileId: string) => {
        try {
            setLoading(true);
            const { data: invoiceData, error: invoiceError } = await supabase
                .from("invoices")
                .select("*")
                .eq("buyer_id", profileId);

            if (invoiceError) {
                console.error("Error fetching invoices:", invoiceError);
                return;
            }

            const clientIds = [...new Set(invoiceData.map((d) => d.buyer_id))];
            const visionaryIds = [...new Set(invoiceData.map((d) => d.seller_id))];
            const userIds = [...new Set([...clientIds, ...visionaryIds])];

            const { data: usersDetail, error: userDetailsError } = await supabase
                .from("users")
                .select("userId, firstName, lastName, email")
                .in("userId", userIds);

            if (userDetailsError) {
                console.error("Error fetching user details:", userDetailsError);
                return;
            }

            const userMap = new Map<string, { fullName: string; email: string }>();
            usersDetail?.forEach((user) => {
                userMap.set(user.userId, {
                    fullName: `${user.firstName} ${user.lastName}`,
                    email: user.email,
                });
            });

            const enrichedInvoices: InvoiceInterface[] = (invoiceData || []).map((invoice) => {
                const clientInfo = userMap.get(invoice.buyer_id);
                const visionaryInfo = userMap.get(invoice.seller_id);

                return {
                    id: invoice.id,
                    invoiceNumber: invoice.invoice_number,
                    orderId: invoice.order_id,
                    project: invoice.meta?.service_title || "",
                    status: invoice.status,
                    issueDate: invoice.issue_date,
                    dueDate: invoice.due_date,
                    buyerId: invoice.buyer_id,
                    sellerId: invoice.seller_id,
                    currency: invoice.currency,
                    subtotalCents: invoice.subtotal_cents,
                    taxCents: invoice.tax_cents,
                    totalCents: invoice.total_cents,
                    serviceAddOns: invoice.meta?.service_add_ons || null,
                    clientEmail: clientInfo?.email || "",
                    visioanryEmail: visionaryInfo?.email || "",
                    clientName: clientInfo?.fullName || "",
                    visionaryName: visionaryInfo?.fullName || "",
                };
            });

            setInvoices(enrichedInvoices);
        } catch (error) {
            console.error("Unexpected Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        invoices,
        loading,
        fetchInvoices,
    };
};