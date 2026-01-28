import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailData {
    receiverEmail: string;
    senderName: string;
    roomId: string;
    invitationUrl: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, senderName, roomId, invitationUrl }: EmailData = body;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_INVITATION_EMAIL!
            },
            subject: `Invitation to join ${senderName}'s Collab Room`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">You're Invited to a Collab Room!</h2>
          <p>Hi there,</p>
          <p><strong>${senderName}</strong> has invited you to join their collaboration room.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Room ID:</strong> ${roomId}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Join Collab Room
            </a>
          </div>
          
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This invitation was sent to ${receiverEmail}. If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
            text: `
        You're Invited to a Collab Room!
        
        ${senderName} has invited you to join their collaboration room.
        Room ID: ${roomId}
        
        Join here: ${invitationUrl}
        
        This invitation was sent to ${receiverEmail}.
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}