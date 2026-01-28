import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';
import dayjs from 'dayjs';

/**
 * GET /api/ads/billing/receipt
 * Generate and download a PDF receipt for a purchase
 * For now, returns HTML receipt that can be printed/saved as PDF
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const purchase_id = searchParams.get('purchase_id');

        if (!purchase_id) {
            return NextResponse.json(
                { success: false, error: 'Purchase ID required' },
                { status: 400 }
            );
        }

        // Fetch purchase details with related data
        const { data: purchase, error } = await supabase
            .from('ad_purchases')
            .select(`
                *,
                advertiser:users!ad_purchases_advertiser_id_fkey(
                    userId,
                    email,
                    firstName,
                    lastName
                ),
                ad:ads!ad_purchases_ad_id_fkey(
                    id,
                    title,
                    description,
                    room:thinktank!ads_room_id_fkey(
                        id,
                        title
                    )
                )
            `)
            .eq('id', purchase_id)
            .single();

        if (error || !purchase) {
            console.error('Error fetching purchase:', error);
            return NextResponse.json(
                { success: false, error: 'Purchase not found' },
                { status: 404 }
            );
        }

        if (purchase.payment_status !== 'succeeded') {
            return NextResponse.json(
                { success: false, error: 'Receipt only available for successful payments' },
                { status: 400 }
            );
        }

        // Generate HTML receipt
        const receiptHTML = generateReceiptHTML(purchase);

        return new NextResponse(receiptHTML, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
            }
        });

    } catch (error: any) {
        console.error('Generate receipt error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

function generateReceiptHTML(purchase: any): string {
    const advertiser = purchase.advertiser || {};
    const ad = purchase.ad || {};
    const room = ad.room || {};

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${purchase.id}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .receipt-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #1890ff;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #1890ff;
            font-size: 32px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #333;
            font-size: 18px;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .info-value {
            color: #333;
        }
        .total-section {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin-top: 30px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 20px;
            font-weight: bold;
            color: #1890ff;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #999;
            font-size: 12px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            background: #52c41a;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #1890ff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            z-index: 1000;
        }
        .print-button:hover {
            background: #40a9ff;
        }
        @media print {
            body {
                margin: 0;
                background: white;
            }
            .receipt-container {
                box-shadow: none;
            }
            .print-button {
                display: none;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <div class="receipt-container">
        <div class="header">
            <h1>Kaboom Collab</h1>
            <p>Advertisement Purchase Receipt</p>
            <p>kaboomcollab.com</p>
        </div>

        <div class="section">
            <h2>Receipt Information</h2>
            <div class="info-row">
                <span class="info-label">Receipt ID:</span>
                <span class="info-value">${purchase.id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Invoice Date:</span>
                <span class="info-value">${dayjs(purchase.created_at).format('MMMM DD, YYYY')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Date:</span>
                <span class="info-value">${dayjs(purchase.paid_at).format('MMMM DD, YYYY HH:mm')}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="status-badge">PAID</span>
            </div>
        </div>

        <div class="section">
            <h2>Customer Information</h2>
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${advertiser.firstName || ''} ${advertiser.lastName || ''}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${advertiser.email || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Customer ID:</span>
                <span class="info-value">${advertiser.userId || 'N/A'}</span>
            </div>
        </div>

        <div class="section">
            <h2>Advertisement Details</h2>
            <div class="info-row">
                <span class="info-label">Ad Title:</span>
                <span class="info-value">${ad.title || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Room:</span>
                <span class="info-value">${room.title || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ad ID:</span>
                <span class="info-value">${ad.id || 'N/A'}</span>
            </div>
            ${ad.description ? `
            <div class="info-row">
                <span class="info-label">Description:</span>
                <span class="info-value">${ad.description}</span>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h2>Payment Details</h2>
            <div class="info-row">
                <span class="info-label">Payment Method:</span>
                <span class="info-value">Credit Card</span>
            </div>
            <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value">${purchase.stripe_payment_intent_id}</span>
            </div>
            ${purchase.stripe_charge_id ? `
            <div class="info-row">
                <span class="info-label">Charge ID:</span>
                <span class="info-value">${purchase.stripe_charge_id}</span>
            </div>
            ` : ''}
        </div>

        <div class="total-section">
            <div class="info-row">
                <span class="info-label">Subtotal:</span>
                <span class="info-value">$${Number(purchase.amount).toFixed(2)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tax:</span>
                <span class="info-value">$0.00</span>
            </div>
            <div class="total-row">
                <span>Total Amount Paid:</span>
                <span>$${Number(purchase.amount).toFixed(2)}</span>
            </div>
        </div>

        <div class="footer">
            <p><strong>💡 To save as PDF:</strong> Click the Print button above, then choose "Save as PDF" as your printer destination.</p>
            <p style="margin-top: 20px;">Thank you for advertising with Kaboom Collab!</p>
            <p>This is an official receipt for your advertisement purchase.</p>
            <p>For questions or support, contact us at support@kaboomcollab.com</p>
            <p style="margin-top: 20px;">Kaboom Collab • Premium Creative Advertising Platform</p>
        </div>
    </div>
</body>
</html>
    `;
}

