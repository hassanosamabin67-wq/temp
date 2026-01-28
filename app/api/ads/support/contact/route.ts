import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

const nodemailer = require('nodemailer');

/**
 * POST /api/ads/support/contact
 * Send support message to admin email
 */
export async function POST(req: NextRequest) {
    try {
        const { advertiser_id, name, email, subject, message } = await req.json();

        // Validate required fields
        if (!advertiser_id || !name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Get advertiser details
        const { data: advertiser, error: advertiserError } = await supabase
            .from('users')
            .select('userId, email, firstName, lastName')
            .eq('userId', advertiser_id)
            .single();

        if (advertiserError || !advertiser) {
            return NextResponse.json(
                { success: false, error: 'Advertiser not found' },
                { status: 404 }
            );
        }

        // Create email transporter (using Gmail as example - configure based on your email service)
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            },
        });

        // Admin email (configure in environment variables)
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@kaboomcollab.com';

        // Email content
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1890ff; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-row { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #666; }
                    .value { color: #333; }
                    .message-box { background: white; padding: 20px; border-left: 4px solid #1890ff; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2 style="margin: 0;">Advertiser Support Request</h2>
                        <p style="margin: 5px 0 0 0;">Kaboom Collab Ad System</p>
                    </div>
                    <div class="content">
                        <div class="info-row">
                            <span class="label">From:</span>
                            <span class="value">${name}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value">${email}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Advertiser ID:</span>
                            <span class="value">${advertiser_id}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Subject:</span>
                            <span class="value">${subject}</span>
                        </div>
                        <div class="message-box">
                            <div class="label">Message:</div>
                            <p>${message.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This message was sent from the Kaboom Collab Advertiser Dashboard</p>
                        <p>Reply directly to this email to respond to the advertiser</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email to admin
        await transporter.sendMail({
            from: `"Kaboom Collab Support" <${process.env.SMTP_USER}>`,
            to: adminEmail,
            replyTo: email, // Allow admin to reply directly to advertiser
            subject: `[Advertiser Support] ${subject}`,
            html: emailHtml,
            text: `
Support Request from Advertiser

From: ${name}
Email: ${email}
Advertiser ID: ${advertiser_id}
Subject: ${subject}

Message:
${message}
            `
        });

        // Log support request in database (optional - create support_requests table if needed)
        const { error: logError } = await supabase
            .from('support_requests')
            .insert({
                advertiser_id,
                name,
                email,
                subject,
                message,
                status: 'pending',
                created_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Error logging support request:', logError);
            // Don't fail the request if logging fails
        }

        return NextResponse.json({
            success: true,
            message: 'Support request sent successfully'
        });

    } catch (error: any) {
        console.error('Support contact error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to send support request' },
            { status: 500 }
        );
    }
}