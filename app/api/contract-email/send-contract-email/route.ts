import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface ContractEmailData {
    receiverEmail: string;
    senderName: string;
    contractTitle: string;
    contractId: string;
    contractUrl: string;
    messageType: 'offer-received' | 'offer-accepted' | 'offer-declined' | 'work-approved' | 'project-completed';
}

const emailContent = {
    'offer-received': {
        subject: 'You’ve received a new offer!',
        htmlMessage: (sender: string, title: string) =>
            `<p><strong>${sender}</strong> has sent you an offer for <strong>${title}</strong>.</p>`,
        textMessage: (sender: string, title: string) =>
            `${sender} has sent you an offer for ${title}.`,
        buttonColor: '#007bff',
    },
    'offer-accepted': {
        subject: 'Your offer has been accepted',
        htmlMessage: (sender: string, title: string) =>
            `<p>Your offer for <strong>${title}</strong> has been accepted by <strong>${sender}</strong>.</p>`,
        textMessage: (sender: string, title: string) =>
            `Your offer for ${title} has been accepted by ${sender}.`,
        buttonColor: '#28a745',
    },
    'work-approved': {
        subject: 'Congratulations 🎉! Your order has been approved',
        htmlMessage: (sender: string, title: string) =>
            `<p>Your work for <strong>${title}</strong> has been approved by <strong>${sender}</strong>.</p>`,
        textMessage: (sender: string, title: string) =>
            `Your work for ${title} has been approved by ${sender}.`,
        buttonColor: '#28a745',
    },
    'offer-declined': {
        subject: 'Your offer has been declined',
        htmlMessage: (sender: string, title: string) =>
            `<p>Your offer for <strong>${title}</strong> has been declined by <strong>${sender}</strong>.</p>`,
        textMessage: (sender: string, title: string) =>
            `Your offer for ${title} has been declined by ${sender}.`,
        buttonColor: '#6c757d',
    },
    'project-completed': {
        subject: 'Congratulations 🎉!Your Project has been marked complete',
        htmlMessage: (sender: string, title: string) =>
            `<p>Your project <strong>${title}</strong> has been marked completed by <strong>${sender}</strong>.</p>`,
        textMessage: (sender: string, title: string) =>
            `Your project ${title} has been marked completed by ${sender}.`,
        buttonColor: '#6c757d',
    },
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, senderName, contractTitle, contractId, contractUrl, messageType }: ContractEmailData = body;

        const content = emailContent[messageType];
        if (!content) {
            return NextResponse.json({ message: 'Invalid message type' }, { status: 400 });
        }
        const fromEmail = messageType === 'offer-declined' 
                    ? process.env.SENDGRID_DECLINE_EMAIL 
                    : process.env.SENDGRID_FROM_EMAIL;
        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: fromEmail!
            },
            subject: content.subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${content.subject}</h2>
          <p>Hi there,</p>
          ${content.htmlMessage(senderName, contractTitle)}
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Contract ID:</strong> ${contractId}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${contractUrl}" 
               style="background-color: ${content.buttonColor}; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              View Contract
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This message was sent to ${receiverEmail}. If you weren’t expecting it, you can safely ignore this email.
          </p>
        </div>
      `,
            text: `
        ${content.subject}
        
        ${content.textMessage(senderName, contractTitle)}
        
        Contract ID: ${contractId}
        
        This message was sent to ${receiverEmail}.
      `,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: 'Contract email sent successfully' }, { status: 200 });
    } catch (error) {
        console.error('SendGrid error:', error);
        return NextResponse.json(
            {
                message: 'Failed to send contract email',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}