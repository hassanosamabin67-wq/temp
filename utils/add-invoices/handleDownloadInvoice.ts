import { InvoiceInterface } from '@/types/dashboardPaymentTab/paymentInterface';
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { currency, formatDate } from '../dashboardPaymentTab/payment';

export const handleDownloadInvoicePdf = async (invoice: InvoiceInterface) => {
    try {
        const doc = new jsPDF({ unit: "pt", format: "A4" });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 40;
        let y = margin;

        y += 60;

        // Title
        doc.setFont("helvetica", "bold"); doc.setFontSize(20);
        doc.text("Kaboom Collab — Unified Invoice", pageW / 2, y, { align: "center" });
        y += 40;

        // Seller block (left)
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const sellerLines = [
            invoice.visionaryName,
            invoice.visioanryEmail
        ].filter(Boolean) as string[];
        sellerLines.forEach((line, i) => doc.text(line, margin, y + 16 * (i + 1)));

        // Invoice meta block (right, boxed)
        const metaX = pageW - margin - 220;
        const metaY = y;
        const metaW = 300;
        const metaPad = 10;

        // Meta box background
        doc.setFillColor(248, 249, 251);
        doc.roundedRect(metaX, metaY, metaW, 110, 6, 6, "F");

        doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text("Invoice Details", metaX + metaPad, metaY + 18);
        doc.setFont("helvetica", "normal");

        const metaRows: Array<[string, string]> = [
            ["Invoice #", invoice.invoiceNumber],
            ["Project", invoice.project || "-"],
            ["Issue Date", formatDate(invoice.issueDate)],
            ["Due Date", formatDate(invoice.dueDate)],
            ["Status", invoice.status?.toUpperCase()],
        ];
        let my = metaY + 36;
        metaRows.forEach(([k, v]) => {
            doc.setFont("helvetica", "bold"); doc.text(`${k}:`, metaX + metaPad, my);
            doc.setFont("helvetica", "normal"); doc.text(String(v ?? "-"), metaX + 90, my);
            my += 16;
        });

        y = Math.max(y + 90, metaY + 110) + 24;

        // Buyer block (if present)
        if (invoice.clientName) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(12);
            doc.text("Billed To (Client)", margin, y);
            y += 8;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            const buyerLines = [
                invoice.clientName,
                invoice.clientEmail
            ].filter(Boolean) as string[];
            buyerLines.forEach((line, i) => doc.text(line, margin, y + 14 * (i + 1)));
            y += 14 * buyerLines.length + 12;
        }

        // Optional: transaction-style details
        if (invoice.orderId) {
            doc.setFont("helvetica", "bold"); doc.setFontSize(12);
            doc.text("Payment Details", margin, y);
            y += 12;

            const txRows: Array<[string, string]> = [
                ["Transaction ID", invoice.orderId || "-"],
            ];
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            txRows.forEach(([k, v], i) => {
                doc.setFont("helvetica", "bold"); doc.text(`${k}:`, margin, y + 16 * (i + 1));
                doc.setFont("helvetica", "normal"); doc.text(v, margin + 100, y + 16 * (i + 1));
            });
            y += 16 * txRows.length + 20;
        }

        // ----- Line Items Table -----
        if (invoice.serviceAddOns?.length) {
            // Line Items heading
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.text("Line Items", margin, y);
            y += 20;

            // Prepare table data
            const tableBody = invoice.serviceAddOns
                .filter(item => item.enabled) // Only show enabled items
                .map(item => [
                    item.description || item.name, // Description
                    "1", // Quantity (assuming 1 for each service add-on)
                    currency(item.price, invoice.currency), // Rate
                    currency(item.price, invoice.currency)  // Amount (same as rate for qty 1)
                ]);

            // Create the table
            autoTable(doc, {
                startY: y,
                head: [["Description", "Qty", "Rate", "Amount"]],
                body: tableBody,
                styles: {
                    font: "helvetica",
                    fontSize: 10,
                    cellPadding: 8,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 11
                },
                columnStyles: {
                    0: { cellWidth: 'auto' }, // Description - flexible width
                    1: { cellWidth: 60, halign: 'center' }, // Qty - center aligned
                    2: { cellWidth: 80, halign: 'right' },  // Rate - right aligned
                    3: { cellWidth: 80, halign: 'right' }   // Amount - right aligned
                },
                theme: "grid",
                margin: { left: margin, right: margin },
                tableLineColor: [200, 200, 200],
                tableLineWidth: 0.5
            });

            // @ts-ignore - Get the final Y position after the table
            y = (doc as any).lastAutoTable.finalY + 20;

            // Add subtotal breakdown after the table
            const servicesSubtotal = invoice.serviceAddOns
                .filter(item => item.enabled)
                .reduce((sum, item) => sum + item.price, 0);

            // You might want to add collab rooms subtotal here if you have that data
            // For now, we'll just show the services subtotal
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Subtotal (Services): ${currency(servicesSubtotal, invoice.currency)}`, margin, y);
            y += 14;

            // If you have collab rooms data, add it here
            // doc.text(`Subtotal (Collab Rooms): ${currency(collabRoomsTotal, invoice.currency)}`, margin, y);
            // y += 14;

            doc.setFont("helvetica", "bold");
            doc.text(`Subtotal (All): ${currency(invoice.subtotalCents, invoice.currency)}`, margin, y);
            y += 20;
        }

        // ----- Amounts Summary -----
        const colW = (pageW - margin * 2 - 16) / 2;
        const leftX = margin;

        // Left block (invoice amounts)
        doc.setFillColor(248, 249, 251);
        const leftH = 120;
        doc.roundedRect(leftX, y, colW, leftH, 6, 6, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(12);
        doc.text("Amount Summary", leftX + 12, y + 18);
        doc.setFont("helvetica", "normal"); doc.setFontSize(11);

        const rowsLeft: Array<[string, string, boolean?]> = [
            ["Subtotal", currency(invoice.subtotalCents, invoice.currency)],
            ["Tax", currency(invoice.taxCents, invoice.currency)],
            ["Total", currency(invoice.totalCents, invoice.currency), true],
        ];
        let ly = y + 40;
        rowsLeft.forEach(([label, val, strong]) => {
            if (strong) doc.setFont("helvetica", "bold"); else doc.setFont("helvetica", "normal");
            doc.text(label + ":", leftX + 12, ly);
            doc.text(val, leftX + colW - 12, ly, { align: "right" });
            ly += 18;
        });

        y += leftH + 28;

        // ----- Status pill -----
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        const statusText = `Status: ${String(invoice.status || "-").toUpperCase()}`;
        const pillW = doc.getTextWidth(statusText) + 24;
        doc.setFillColor(242, 248, 255);
        doc.setDrawColor(200, 220, 255);
        doc.roundedRect(margin, y, pillW, 24, 12, 12, "FD");
        doc.text(statusText, margin + 12, y + 16);

        y += 40;

        // ----- Footer -----
        doc.setDrawColor(230);
        doc.line(margin, y, pageW - margin, y);
        y += 18;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text("Thank you for your business.", pageW / 2, y, { align: "center" });
        y += 14;
        if (invoice.visioanryEmail) {
            doc.text(`For help: support@kaboomcollab.com`, pageW / 2, y, { align: "center" });
        }
        y += 14;
        doc.setTextColor(130);
        doc.text("This is a system-generated invoice.", pageW / 2, y, { align: "center" });

        // ----- Save -----
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
    } catch (e) {
        console.error(e);
    }
};