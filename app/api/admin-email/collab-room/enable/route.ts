import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { EnabledRoomEmailData } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { roomName, receiverEmail }: EnabledRoomEmailData = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Collab Room (${roomName}) has been re-enabled`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5cb85c;">Room Re-enabled</h2>
          <p>Hi there,</p>
          <p>We’ve re-enabled your Collab Room (<strong>${roomName}</strong>), and it is now accessible again.</p>
          <p>If the room was previously disabled due to a violation, please ensure that all content complies with our guidelines to avoid future disruptions.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent to ${receiverEmail}. If you have any questions or concerns, feel free to reach out.
          </p>
        </div>
      `,
            text: `
        Room Re-enabled

        Your Collab Room (${roomName}) has been re-enabled and is now accessible again.

        Please ensure all future content complies with our guidelines.
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Enable notification sent' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send enable email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}