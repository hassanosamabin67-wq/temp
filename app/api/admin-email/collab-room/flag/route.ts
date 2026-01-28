import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { FlaggedRoomEmailData } from "@/utils/emailServices/adminDashbordEmailService/type";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomName, receiverEmail, reason }: FlaggedRoomEmailData = body;

    const msg = {
      to: receiverEmail,
      from: {
        name: "Kaboom Collab",
        email: process.env.SENDGRID_FROM_EMAIL!
      },
      subject: `Your Collab Room (${roomName}) has been flagged`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Room Flagged for Review</h2>
          <p>Hi there,</p>
          <p>We’ve flagged your Collab Room (<strong>${roomName}</strong>) for the following reason:</p>
          
          <blockquote style="background-color: #fdf2f2; border-left: 4px solid #d9534f; padding: 10px; color: #a94442;">
            ${reason}
          </blockquote>
          
          <p>As a result, access to this room may be temporarily restricted.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            If you believe this was a mistake, you can file an appeal.
          </p>
        </div>
      `,
      text: `
        Room Flagged for Review

        Your Collab Room (${roomName}) has been flagged for the following reason:

        ${reason}

        As a result, access to the room may be restricted.

      `,
    };

    await sgMail.send(msg);
    return NextResponse.json({ message: 'Flag notification sent' }, { status: 200 });
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json(
      {
        message: 'Failed to send flagged email',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}