import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { CollabCardInvitationEmailParams } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, firstName, lastName, earnings, actionUrl }: CollabCardInvitationEmailParams = body;

        const displayName = firstName || 'there';
        const earningsText = earnings ? `$${earnings.toFixed(2)}` : 'your recent activity';
        const collabCardsUrl = actionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/collab-cards`;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `🎉 You're Invited! Get Your Free Collab Card`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
                    <div style="background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #722ed1; margin: 0; font-size: 28px;">🎉 Congratulations, ${displayName}!</h1>
                        </div>
                        
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                            We're excited to inform you that based on ${earningsText} on Kaboom Collab, you've been personally invited to get your <strong>FREE Collab Card</strong>!
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #722ed1 0%, #9333ea 100%); border-radius: 12px; padding: 24px; margin: 30px 0; color: white;">
                            <h3 style="margin: 0 0 16px 0; font-size: 20px;">💳 What is a Collab Card?</h3>
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; opacity: 0.95;">
                                The Collab Card is a virtual card that gives you instant access to your earnings. Use it for online purchases, ATM withdrawals, and everyday spending.
                            </p>
                        </div>
                        
                        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h4 style="color: #374151; margin: 0 0 12px 0;">✨ Benefits include:</h4>
                            <ul style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
                                <li>Instant access to your earnings</li>
                                <li>No monthly fees</li>
                                <li>Use anywhere online</li>
                                <li>Exclusive creator perks</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${collabCardsUrl}" 
                               style="background: linear-gradient(135deg, #722ed1 0%, #9333ea 100%); 
                                      color: white; 
                                      padding: 16px 40px; 
                                      text-decoration: none; 
                                      border-radius: 8px; 
                                      display: inline-block;
                                      font-weight: 600;
                                      font-size: 16px;
                                      box-shadow: 0 4px 14px rgba(114, 46, 209, 0.4);">
                                Get Your Free Collab Card
                            </a>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; text-align: center;">
                            Or copy and paste this link in your browser:
                        </p>
                        <p style="word-break: break-all; color: #722ed1; font-size: 12px; text-align: center;">
                            ${collabCardsUrl}
                        </p>
                        
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            This invitation was sent to ${receiverEmail} by the Kaboom Collab team.
                            <br>This is a limited-time invitation. Don't miss out!
                        </p>
                    </div>
                </div>
            `,
            text: `
Congratulations, ${displayName}!

You're Invited to Get Your Free Collab Card!

Based on ${earningsText} on Kaboom Collab, you've been personally invited to get your FREE Collab Card!

What is a Collab Card?
The Collab Card is a virtual card that gives you instant access to your earnings. Use it for online purchases, ATM withdrawals, and everyday spending.

Benefits include:
- Instant access to your earnings
- No monthly fees
- Use anywhere online
- Exclusive creator perks

Get your free Collab Card now by visiting:
${collabCardsUrl}

This invitation was sent to ${receiverEmail} by the Kaboom Collab team.
This is a limited-time invitation. Don't miss out!
            `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Collab Card invitation email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send Collab Card invitation email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}