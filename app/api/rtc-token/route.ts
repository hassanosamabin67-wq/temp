import { NextRequest } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
const expirationTimeInSeconds = 3600;

export async function POST(req: NextRequest) {
    try {
        const { channelName, role = 'audience' } = await req.json();

        if (!channelName) {
            return new Response(JSON.stringify({ error: 'channelName is required' }), {
                status: 400,
            });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        // Use PUBLISHER role for host, SUBSCRIBER for audience
        const rtcRole = role === 'host' || role === 'co-host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            0,
            rtcRole,
            privilegeExpiredTs
        );

        return new Response(JSON.stringify({ token }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('RTC Token generation failed:', error);
        return new Response(JSON.stringify({ error: 'RTC Token generation failed' }), {
            status: 500,
        });
    }
}