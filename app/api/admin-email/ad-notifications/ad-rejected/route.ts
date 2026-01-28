import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface AdRejectedEmailData {
    adTitle: string;
    roomTitle: string;
    advertiserEmail: string;
    advertiserName: string;
    rejectionReason: string;
}

/**
 * Send email notification to advertiser when ad is rejected
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            adTitle,
            roomTitle,
            advertiserEmail,
            advertiserName,
            rejectionReason
        }: AdRejectedEmailData = body;

        if (!advertiserEmail || !adTitle || !rejectionReason) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const msg = {
            to: advertiserEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Ad Submission Update: ${adTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #d9534f; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Ad Submission Status</h1>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #333;">Hello ${advertiserName},</p>
                        
                        <p style="font-size: 16px; color: #333;">
                            We've reviewed your advertisement submission and unfortunately we're unable to approve it at this time.
                        </p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #d9534f; margin-top: 0;">Ad Details</h3>
                            <p style="margin: 10px 0;"><strong>Title:</strong> ${adTitle}</p>
                            <p style="margin: 10px 0;"><strong>Room:</strong> ${roomTitle}</p>
                        </div>

                        <div style="background-color: #fdf2f2; border-left: 4px solid #d9534f; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #a94442;">Reason for Rejection:</h4>
                            <p style="margin: 0; color: #a94442;">${rejectionReason}</p>
                        </div>

                        <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #0c5460;">Next Steps:</h4>
                            <ul style="margin: 10px 0; color: #0c5460;">
                                <li>Review our ad content guidelines</li>
                                <li>Make necessary changes to your ad</li>
                                <li>Resubmit your ad for approval</li>
                            </ul>
                        </div>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404;">
                                <strong>💰 Refund Information:</strong><br/>
                                Your payment has been refunded. You will not be charged for this ad submission.
                            </p>
                        </div>

                        <p style="font-size: 14px; color: #666; margin-top: 30px;">
                            If you have any questions or would like clarification on our ad policies, please contact our support team.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                               style="display: inline-block; background-color: #2878b5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Go to Dashboard
                            </a>
                        </div>
                    </div>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This email was sent to ${advertiserEmail}.<br/>
                        © Kaboom Collab. All rights reserved.
                    </p>
                </div>
            `,
            text: `
                Ad Submission Status

                Hello ${advertiserName},

                We've reviewed your advertisement submission "${adTitle}" for ${roomTitle} and unfortunately we're unable to approve it at this time.

                Reason for Rejection:
                ${rejectionReason}

                Next Steps:
                - Review our ad content guidelines
                - Make necessary changes to your ad
                - Resubmit your ad for approval

                Refund Information:
                Your payment has been refunded. You will not be charged for this ad submission.

                If you have any questions or would like clarification on our ad policies, please contact our support team.
            `
        };

        await sgMail.send(msg);

        return NextResponse.json(
            { success: true, message: 'Rejection notification sent' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('SendGrid ad rejection notification error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to send rejection notification',
                error: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}