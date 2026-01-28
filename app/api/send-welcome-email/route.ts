import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface WelcomeEmailData {
    receiverEmail: string;
    firstName: string;
    verificationUrl?: string;
    profileType: "client" | "visionary";
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { receiverEmail, firstName, profileType }: WelcomeEmailData = body;

        let subject = "";
        let header = "";
        let bodyContent = "";
        let footer = "";

        if (profileType === "visionary") {
            subject = `🚀 Welcome to Kaboom Collab, ${firstName}!`;
            header = "Your creative journey starts now.";
            bodyContent = `
        <p>Hi ${firstName},</p>
        <p>Welcome to Kaboom Collab — where visionaries like you showcase their craft, connect with clients, and collaborate in powerful new ways.</p>
        <h3 style="margin-top: 20px; color: #333;">What’s Next for You:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>🎨 Complete your profile — let the world see your style and skills</li>
          <li>🛠 Post your services — list the creative services you offer and start attracting opportunities</li>
          <li>💳 Enable payouts — connect to Stripe for instant, secure payments</li>
          <li>🎤 Explore Collab Rooms — host live sessions, masterclasses, or events</li>
          <li>🤝 Start collaborating — connect directly with clients and fellow visionaries</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Get Started
          </a>
        </div>
        <p>Your craft. Your tools. Your lane.<br/>We can’t wait to see what you’ll create.</p>
      `;
            footer = "Kaboom Collab™ | Real Creators. Real Connections.";
        } else {
            subject = `👋 Welcome to Kaboom Collab, ${firstName}!`;
            header = "Your creative connections start here.";
            bodyContent = `
        <p>Hi ${firstName},</p>
        <p>Welcome to Kaboom Collab — the place where you can connect with skilled visionaries and bring your ideas to life.</p>
        <h3 style="margin-top: 20px; color: #333;">What’s Next for You:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>🔎 Search services — explore the services visionaries have already created and ready to deliver</li>
          <li>🧭 Browse visionaries — discover a curated community of creative talent</li>
          <li>🛠 Post a project or request services — share what you need and get matched with the right visionary</li>
          <li>🎤 Join Collab Rooms — experience live sessions, workshops, or exclusive events</li>
          <li>💳 Book with confidence — enjoy secure payments and instant collaboration</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Get Started
          </a>
        </div>
        <p>Real creators. Real connections.<br/>Your next big project starts here.</p>
      `;
            footer = "Kaboom Collab™ | Your Craft. Your Tools. Your Lane.";
        }

        const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #007bff; margin-bottom: 10px;">${header}</h1>
        </div>
        <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px;">
          ${bodyContent}
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          ${footer}
        </p>
      </div>
    `;

        const msg = {
            to: receiverEmail,
            from: {
                name: "Kaboom Collab",
                email: process.env.SENDGRID_INVITATION_EMAIL!,
            },
            subject,
            html: htmlTemplate,
            text: `Welcome ${firstName}, to Kaboom Collab!`,
        };

        await sgMail.send(msg);
        return NextResponse.json({ message: "Welcome email sent successfully" }, { status: 200 });
    } catch (error) {
        console.error("SendGrid welcome email error:", error);
        return NextResponse.json(
            {
                message: "Failed to send welcome email",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}