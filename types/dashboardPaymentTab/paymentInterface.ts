export interface PaymentMethodUI {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    isDefault?: boolean;
}

export interface Transaction {
    id: string;
    stripe_transaction_id: string;
    category: string;
    application_fee: number;
    status: string;
    amount: number;
    user_id: string;
    client_id: string;
    type: string;
    purchase_name: string;
    created_at: string;
}

export interface ServiceAddOn {
    id: string;
    name: string;
    price: number;
    enabled: boolean;
    description: string;
}

export interface InvoiceInterface {
    id: string;
    invoiceNumber: string;
    orderId: string;
    project: string;
    status: string;
    issueDate: string;
    dueDate: string;
    buyerId: string;
    sellerId: string;
    currency: string;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    clientEmail: string;
    visioanryEmail: string;
    clientName: string;
    visionaryName: string;
    serviceAddOns: ServiceAddOn[] | null;
}