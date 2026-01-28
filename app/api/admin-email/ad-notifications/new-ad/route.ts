import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface NewAdEmailData {
    adId: string;
    adTitle: string;
    roomTitle: string;
    advertiserName: string;
    advertiserEmail: string;
    adminEmail: string;
    approvalUrl: string;
}

/**
 * Send email notification to admin when new ad is submitted
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            adId,
            adTitle,
            roomTitle,
            advertiserName,
            advertiserEmail,
            adminEmail,
            approvalUrl
        }: NewAdEmailData = body;

        if (!adminEmail || !adId || !adTitle) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const msg = {
            to: adminEmail,
            from: {
                name: "Kaboom Collab Admin",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `New Ad Pending Approval: ${adTitle}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #2878b5; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">New Ad Submission</h1>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #333;">A new advertisement has been submitted and is pending your approval.</p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2878b5; margin-top: 0;">Ad Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Ad Title:</td>
                                    <td style="padding: 8px 0; color: #333;">${adTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Room:</td>
                                    <td style="padding: 8px 0; color: #333;">${roomTitle}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Advertiser:</td>
                                    <td style="padding: 8px 0; color: #333;">${advertiserName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Email:</td>
                                    <td style="padding: 8px 0; color: #333;">${advertiserEmail}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: bold;">Ad ID:</td>
                                    <td style="padding: 8px 0; color: #999; font-size: 12px;">${adId}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${approvalUrl}" 
                               style="display: inline-block; background-color: #2878b5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                                Review & Approve Ad
                            </a>
                        </div>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404;">
                                <strong>⚠️ Please Review:</strong><br/>
                                • Video content complies with platform guidelines<br/>
                                • Video duration is 15-30 seconds<br/>
                                • Format is MP4 or MOV<br/>
                                • Payment has been completed
                            </p>
                        </div>
                    </div>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This email was sent to ${adminEmail} from the Kaboom Collab Admin System.<br/>
                        Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `
                New Ad Pending Approval

                A new advertisement has been submitted and requires your review.

                Ad Details:
                - Title: ${adTitle}
                - Room: ${roomTitle}
                - Advertiser: ${advertiserName}
                - Email: ${advertiserEmail}
                - Ad ID: ${adId}

                Please log in to the admin dashboard to review and approve this ad.

                Approval URL: ${approvalUrl}
            `
        };

        await sgMail.send(msg);

        return NextResponse.json(
            { success: true, message: 'Admin notification sent' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('SendGrid new ad notification error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to send admin notification',
                error: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}