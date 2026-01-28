import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';
import {
    MAX_AD_SLOTS_PER_SESSION,
    VIDEO_LENGTH_MIN,
    VIDEO_LENGTH_MAX,
    ACCEPTED_VIDEO_FORMATS,
    MAX_VIDEO_SIZE_BYTES,
    VALIDATION_MESSAGES,
    calculateExpirationDate
} from '@/utils/constants/adConstants';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const room_id = formData.get('room_id') as string;
        const session_id = formData.get('session_id') as string | null;
        const advertiser_id = formData.get('advertiser_id') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string | null;
        const video_file = formData.get('video_file') as File;
        const video_duration = parseInt(formData.get('video_duration') as string);
        const video_format = formData.get('video_format') as string;

        // Validation
        if (!room_id || !advertiser_id || !title || !video_file) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate video duration
        if (video_duration < VIDEO_LENGTH_MIN || video_duration > VIDEO_LENGTH_MAX) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Video duration must be between ${VIDEO_LENGTH_MIN} and ${VIDEO_LENGTH_MAX} seconds`
                },
                { status: 400 }
            );
        }

        // Validate video format
        const formatLower = video_format.toLowerCase();
        if (!ACCEPTED_VIDEO_FORMATS.includes(formatLower as any)) {
            return NextResponse.json(
                { success: false, error: VALIDATION_MESSAGES.INVALID_FORMAT },
                { status: 400 }
            );
        }

        // Validate file size
        if (video_file.size > MAX_VIDEO_SIZE_BYTES) {
            return NextResponse.json(
                { success: false, error: VALIDATION_MESSAGES.FILE_TOO_LARGE },
                { status: 400 }
            );
        }

        // Check ad slot availability using Supabase RPC
        const { data: slotData, error: slotError } = await supabase
            .rpc('check_ad_slot_availability', {
                p_room_id: room_id,
                p_session_id: session_id
            });

        if (slotError) {
            console.error('Error checking slot availability:', slotError);
            return NextResponse.json(
                { success: false, error: 'Failed to check slot availability' },
                { status: 500 }
            );
        }

        const slotsAvailable = slotData?.[0]?.slots_available ?? 0;

        if (slotsAvailable <= 0) {
            return NextResponse.json(
                { success: false, error: VALIDATION_MESSAGES.SLOTS_FULL },
                { status: 400 }
            );
        }

        // Upload video to Supabase Storage
        const fileName = `${Date.now()}_${advertiser_id}_${video_file.name}`;
        const filePath = `ads/${room_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('collab-room')
            .upload(filePath, video_file, {
                contentType: video_file.type,
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Video upload error:', uploadError);
            return NextResponse.json(
                { success: false, error: 'Failed to upload video' },
                { status: 500 }
            );
        }

        // Get public URL
        const videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collab-room/${filePath}`;

        // Create ad record
        const expiresAt = calculateExpirationDate();

        const { data: adData, error: adError } = await supabase
            .from('ads')
            .insert({
                room_id,
                session_id,
                advertiser_id,
                video_url: videoUrl,
                video_duration,
                video_format: formatLower,
                video_size_bytes: video_file.size,
                title,
                description,
                status: 'pending',
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (adError) {
            console.error('Error creating ad record:', adError);

            // Clean up uploaded video
            await supabase.storage
                .from('collab-room')
                .remove([filePath]);

            return NextResponse.json(
                { success: false, error: 'Failed to create ad record' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ad: adData,
            message: 'Ad uploaded successfully and pending approval'
        });

    } catch (error: any) {
        console.error('Ad upload error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch user's ads
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const advertiser_id = searchParams.get('advertiser_id');
        const status = searchParams.get('status');

        if (!advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Advertiser ID required' },
                { status: 400 }
            );
        }

        let query = supabase
            .from('ads')
            .select(`
                *,
                room:thinktank!ads_room_id_fkey(id, title, host),
                session:think_tank_events!ads_session_id_fkey(id, event_name, event_date)
            `)
            .eq('advertiser_id', advertiser_id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching ads:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch ads' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            ads: data,
            count: data.length
        });

    } catch (error: any) {
        console.error('Get ads error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}