import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { userManagementEmail } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, firstName }: userManagementEmail = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Kaboom Collab Account Has Been Deactivated`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #dc3545; margin-bottom: 10px;">Account Deactivated</h1>
                        <p style="color: #666; font-size: 18px;">
                            Hi ${firstName}, your Kaboom Collab account has been deactivated.
                        </p>
                    </div>

                    <div style="background-color: #f8d7da; padding: 25px; border-radius: 10px; margin: 25px 0;">
                        <h3 style="color: #721c24;">Why this happened?</h3>
                        <p style="color: #555;">This may be due to inactivity, a policy issue, or a request from your end.</p>
                        <p style="color: #555;">If you believe this is a mistake, please contact our support team.</p>
                    </div>

                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/support"
                           style="background-color: #dc3545; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Contact Support
                        </a>
                    </div>

                    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
                        This email was sent to ${receiverEmail}. If you didn't request this, please contact us.
                    </p>
                </div>
            `,
            text: `
                Hi ${firstName},

                Your Kaboom Collab account has been deactivated. This may be due to inactivity, a policy issue, or a request from your end.

                If you believe this is a mistake, contact support: ${process.env.NEXT_PUBLIC_APP_URL}/support
            `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Account deactivation email sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('SendGrid deactivation email error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send account deactivation email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}