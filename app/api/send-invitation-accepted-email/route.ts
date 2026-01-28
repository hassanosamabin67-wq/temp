import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailData {
    receiverEmail: string;
    senderName: string;
    thinkTankTitle?: string;
}

export async function POST(req: NextRequest) {
    try {
        const { receiverEmail, senderName, thinkTankTitle }: EmailData = await req.json();

        const subject = `${senderName} has accepted your invitation`;
        const message = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Invitation Accepted!</h2>
                <p><strong>${senderName}</strong> has accepted your invitation to join${thinkTankTitle ? ` the room <strong>${thinkTankTitle}</strong>` : ' your room'}.</p>
                <p>Head over to your dashboard to start collaborating.</p>
            </div>
        `;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_INVITATION_EMAIL!,
            },
            subject,
            html: message,
            text: `${senderName} has accepted your invitation.`,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Acceptance email sent successfully' }, { status: 200 });

    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send acceptance email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}