import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/config/supabase';

/**
 * PATCH /api/ads/user/update
 * Update user's own ad details (title, description, video)
 * User can only edit their own pending or rejected ads
 */
export async function PATCH(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type');
        let ad_id: string, advertiser_id: string, title: string, description: string | undefined;
        let videoFile: File | null = null;
        let videoDuration: number | undefined;
        let videoFormat: string | undefined;

        // Handle both JSON and FormData
        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();
            ad_id = formData.get('ad_id') as string;
            advertiser_id = formData.get('advertiser_id') as string;
            title = formData.get('title') as string;
            description = formData.get('description') as string | undefined;
            videoFile = formData.get('video_file') as File | null;
            videoDuration = formData.get('video_duration') ? Number(formData.get('video_duration')) : undefined;
            videoFormat = formData.get('video_format') as string | undefined;
        } else {
            const body = await req.json();
            ad_id = body.ad_id;
            advertiser_id = body.advertiser_id;
            title = body.title;
            description = body.description;
        }

        // Validate required fields
        if (!ad_id || !advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: ad_id, advertiser_id' },
                { status: 400 }
            );
        }

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            );
        }

        if (title.length > 200) {
            return NextResponse.json(
                { success: false, error: 'Title cannot exceed 200 characters' },
                { status: 400 }
            );
        }

        if (description && description.length > 500) {
            return NextResponse.json(
                { success: false, error: 'Description cannot exceed 500 characters' },
                { status: 400 }
            );
        }

        // Check if ad exists and belongs to the user
        const { data: existingAd, error: adCheckError } = await supabase
            .from('ads')
            .select('id, title, description, status, advertiser_id, video_url')
            .eq('id', ad_id)
            .single();

        if (adCheckError || !existingAd) {
            return NextResponse.json(
                { success: false, error: 'Ad not found' },
                { status: 404 }
            );
        }

        // Verify ownership
        if (existingAd.advertiser_id !== advertiser_id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: You can only edit your own ads' },
                { status: 403 }
            );
        }

        // Only allow editing pending or rejected ads
        if (existingAd.status !== 'pending' && existingAd.status !== 'rejected') {
            return NextResponse.json(
                { success: false, error: `Cannot edit ads with status: ${existingAd.status}. Only pending or rejected ads can be edited.` },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            title: title.trim(),
            description: description ? description.trim() : null,
            updated_at: new Date().toISOString()
        };

        // Handle video update if provided
        if (videoFile) {
            try {
                // Generate unique filename
                const fileName = `${Date.now()}_${advertiser_id}_${videoFile.name}`;
                const filePath = `ads/${advertiser_id}/${fileName}`;

                // Convert File to ArrayBuffer
                const arrayBuffer = await videoFile.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Upload new video to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('collab-room')
                    .upload(filePath, buffer, {
                        contentType: videoFile.type,
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Error uploading video:', uploadError);
                    return NextResponse.json(
                        { success: false, error: 'Failed to upload video' },
                        { status: 500 }
                    );
                }

                // Get public URL
                const videoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collab-room/${filePath}`;

                // Delete old video from storage
                if (existingAd.video_url) {
                    try {
                        const oldPath = existingAd.video_url.split('/collab-room/')[1];
                        if (oldPath) {
                            await supabase.storage
                                .from('collab-room')
                                .remove([oldPath]);
                        }
                    } catch (error) {
                        console.error('Error deleting old video:', error);
                        // Continue even if deletion fails
                    }
                }

                // Update video-related fields
                updateData.video_url = videoUrl;
                updateData.video_duration = videoDuration;
                updateData.video_format = videoFormat;
            } catch (error) {
                console.error('Error processing video:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to process video file' },
                    { status: 500 }
                );
            }
        }

        // Update the ad in database
        const { data: updatedAd, error: updateError } = await supabase
            .from('ads')
            .update(updateData)
            .eq('id', ad_id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating ad:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update ad' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: videoFile ? 'Ad and video updated successfully' : 'Ad updated successfully',
            ad: updatedAd
        });

    } catch (error: any) {
        console.error('Update ad error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

