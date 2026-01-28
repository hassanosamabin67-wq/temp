export async function generateInvoiceNumber(serviceId: string): Promise<string> {
    const year = new Date().getFullYear();
    const serviceSuffix = serviceId.slice(-5);
    return `INV-${year}-${serviceSuffix}`;
}