import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface AdApprovedEmailData {
    adTitle: string;
    roomTitle: string;
    advertiserEmail: string;
    advertiserName: string;
}

/**
 * Send email notification to advertiser when ad is approved
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            adTitle,
            roomTitle,
            advertiserEmail,
            advertiserName
        }: AdApprovedEmailData = body;

        if (!advertiserEmail || !adTitle) {
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
            subject: `✅ Your Ad "${adTitle}" Has Been Approved!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #5cb85c; padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🎉 Ad Approved!</h1>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 0 0 10px 10px;">
                        <p style="font-size: 16px; color: #333;">Great news, ${advertiserName}!</p>
                        
                        <p style="font-size: 16px; color: #333;">Your advertisement has been approved and is now active.</p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #5cb85c; margin-top: 0;">Ad Details</h3>
                            <p style="margin: 10px 0;"><strong>Title:</strong> ${adTitle}</p>
                            <p style="margin: 10px 0;"><strong>Room:</strong> ${roomTitle}</p>
                        </div>

                        <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #0c5460;">Where Your Ad Will Appear:</h4>
                            <ul style="margin: 10px 0; color: #0c5460;">
                                <li><strong>Lobby:</strong> Your ad will rotate in the lobby during the last 30 minutes before the session starts</li>
                                <li><strong>Replay:</strong> Your ad will appear as a pre-roll on session replays for up to 30 days or 2,000 views</li>
                            </ul>
                        </div>

                        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404;">
                                <strong>💰 Revenue Share:</strong><br/>
                                Your $25 ad purchase helps support the visionary hosting this room. They receive 30% of your ad spend directly.
                            </p>
                        </div>

                        <p style="font-size: 14px; color: #666; margin-top: 30px;">
                            Track your ad performance and view impressions in your dashboard.
                        </p>
                    </div>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    
                    <p style="color: #999; font-size: 12px; text-align: center;">
                        This email was sent to ${advertiserEmail}.<br/>
                        © Kaboom Collab. All rights reserved.
                    </p>
                </div>
            `,
            text: `
                🎉 Ad Approved!

                Great news, ${advertiserName}!

                Your advertisement "${adTitle}" has been approved and is now active.

                Room: ${roomTitle}

                Where Your Ad Will Appear:
                - Lobby: Your ad will rotate in the lobby during the last 30 minutes before the session starts
                - Replay: Your ad will appear as a pre-roll on session replays for up to 30 days or 2,000 views

                Your $25 ad purchase helps support the visionary hosting this room. They receive 30% of your ad spend directly.

                Track your ad performance and view impressions in your dashboard.
            `
        };

        await sgMail.send(msg);

        return NextResponse.json(
            { success: true, message: 'Approval notification sent' },
            { status: 200 }
        );

    } catch (error: any) {
        console.error('SendGrid ad approval notification error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to send approval notification',
                error: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}