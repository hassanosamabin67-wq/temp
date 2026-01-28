import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { UnflaggedRoomEmailData } from '@/utils/emailServices/adminDashbordEmailService/type';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { roomName, receiverEmail }: UnflaggedRoomEmailData = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_FROM_EMAIL!
            },
            subject: `Your Collab Room (${roomName}) has been cleared`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5cb85c;">Room Unflagged</h2>
          <p>Hi there,</p>
          <p>Good news! After reviewing your Collab Room (<strong>${roomName}</strong>), we’ve determined that it complies with our community guidelines and have removed the flag.</p>
          <p>You may continue to use the room as usual.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent to ${receiverEmail}. If you have any further questions, feel free to reach out.
          </p>
        </div>
      `,
            text: `
        Room Unflagged

        Your Collab Room (${roomName}) has been reviewed and the flag has been removed.

        You may continue to use the room as usual.
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Unflag notification sent' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send unflag email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}