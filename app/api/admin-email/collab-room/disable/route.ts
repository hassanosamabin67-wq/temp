import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { DisabledRoomEmailData } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { roomName, receiverEmail, disabledReason }: DisabledRoomEmailData = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Collab Room (${roomName}) has been disabled`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Room Disabled</h2>
          <p>Hi there,</p>
          <p>We’ve disabled your Collab Room (<strong>${roomName}</strong>) due to the following reason:</p>
          
          <blockquote style="background-color: #fdf2f2; border-left: 4px solid #d9534f; padding: 10px; color: #a94442;">
            ${disabledReason}
          </blockquote>
          
          <p>This action is permanent. If you believe this is an error or would like to dispute this decision, you may contact support.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent to ${receiverEmail}. If you have questions, contact us through the link above.
          </p>
        </div>
      `,
            text: `
        Room Disabled

        Your Collab Room (${roomName}) has been disabled for the following reason:

        ${disabledReason}

        This action is permanent. If you believe this is an error, please contact support.
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Disable notification sent' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send disable email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}