import { supabase } from "@/config/supabase";
import { generateInvoiceNumber } from "@/lib/generateInvoiceNumber";

type PriceType = 'fixed' | 'hourly' | 'milestone';

interface InsertInvoiceParams {
    amount: number;
    clientId: string;
    visionaryId: string;
    serviceId: string;
    serviceTitle: string;
    priceType: PriceType;
    orderId?: string | null;
    issueDate: string;
    dueDate: string;
    serviceAddOns?: string[];
}

export async function insertInvoice(params: InsertInvoiceParams) {
    const { amount, clientId, visionaryId, serviceId, issueDate, dueDate, serviceTitle, priceType, orderId = null, serviceAddOns } = params;
    const subtotalCents = Math.round(amount)
    const taxCents = 0;
    const totalCents = subtotalCents + taxCents;
    const invoiceNumber = await generateInvoiceNumber(serviceId);

    const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([
            {
                invoice_number: invoiceNumber,
                order_id: orderId,
                buyer_id: clientId,
                seller_id: visionaryId,
                status: 'escrowed',
                issue_date: issueDate,
                due_date: dueDate,
                currency: 'USD',
                subtotal_cents: subtotalCents,
                tax_cents: taxCents,
                total_cents: totalCents,
                meta: {
                    service_id: serviceId,
                    service_title: serviceTitle,
                    price_type: priceType,
                    payment_intent_id: null,
                    charge_id: null,
                    work_submitted: false,
                    service_add_ons: serviceAddOns || null
                },
            },
        ])
        .select()
        .single();

    if (error) {
        console.error('Failed to insert invoice:', error.message);
        return;
    }

    return invoice;
}