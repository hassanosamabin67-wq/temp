import { supabase } from '@/config/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET - Fetch submissions for a challenge
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const challenge_id = searchParams.get('challenge_id');
        const visionary_id = searchParams.get('visionary_id');
        const status = searchParams.get('status');

        // Build base query
        let query = supabase
            .from('challenge_submissions')
            .select('*')
            .order('created_at', { ascending: false });

        if (challenge_id) {
            query = query.eq('challenge_id', challenge_id);
        }

        if (visionary_id) {
            query = query.eq('visionary_id', visionary_id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: submissions, error } = await query;

        if (error) {
            console.error('Error fetching submissions:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch submissions' },
                { status: 500 }
            );
        }

        // If no submissions, return early
        if (!submissions || submissions.length === 0) {
            return NextResponse.json({
                success: true,
                submissions: [],
                count: 0
            });
        }

        // Fetch related user data
        const userIds = [...new Set(submissions.map(s => s.visionary_id))];
        const challengeIds = [...new Set(submissions.map(s => s.challenge_id))];

        const [usersResult, challengesResult] = await Promise.all([
            supabase
                .from('users')
                .select('userId, firstName, lastName, userName, profileImage, isVerified')
                .in('userId', userIds),
            supabase
                .from('community_challenges')
                .select('id, title, status')
                .in('id', challengeIds)
        ]);

        const userMap = new Map(usersResult.data?.map(u => [u.userId, u]) || []);
        const challengeMap = new Map(challengesResult.data?.map(c => [c.id, c]) || []);

        // Combine data
        const enrichedSubmissions = submissions.map(s => ({
            ...s,
            visionary: userMap.get(s.visionary_id) || null,
            challenge: challengeMap.get(s.challenge_id) || null
        }));

        return NextResponse.json({
            success: true,
            submissions: enrichedSubmissions,
            count: enrichedSubmissions.length
        });

    } catch (error: any) {
        console.error('Submissions fetch error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Create a new submission (Verified Visionaries only)
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const challenge_id = formData.get('challenge_id') as string;
        const visionary_id = formData.get('visionary_id') as string;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const file = formData.get('file') as File | null;
        const file_url = formData.get('file_url') as string | null;

        // Validate required fields
        if (!challenge_id || !visionary_id || !title) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify the user is a verified visionary
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('userId, profileType, status, isVerified')
            .eq('userId', visionary_id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        if (userData.profileType !== 'Visionary') {
            return NextResponse.json(
                { success: false, error: 'Only Visionaries can submit to challenges' },
                { status: 403 }
            );
        }

        if (userData.status === 'Pending') {
            return NextResponse.json(
                { success: false, error: 'Only verified Visionaries can submit to challenges' },
                { status: 403 }
            );
        }

        // Check if challenge exists and is active
        const { data: challengeData, error: challengeError } = await supabase
            .from('community_challenges')
            .select('id, status, deadline')
            .eq('id', challenge_id)
            .single();

        if (challengeError || !challengeData) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        if (challengeData.status !== 'active') {
            return NextResponse.json(
                { success: false, error: 'Challenge is not accepting submissions' },
                { status: 400 }
            );
        }

        // Check if deadline has passed
        if (new Date(challengeData.deadline) < new Date()) {
            return NextResponse.json(
                { success: false, error: 'Submission deadline has passed' },
                { status: 400 }
            );
        }

        // Check if user has already submitted to this challenge
        const { data: existingSubmission } = await supabase
            .from('challenge_submissions')
            .select('id')
            .eq('challenge_id', challenge_id)
            .eq('visionary_id', visionary_id)
            .single();

        if (existingSubmission) {
            return NextResponse.json(
                { success: false, error: 'You have already submitted to this challenge' },
                { status: 400 }
            );
        }

        let uploadedFileUrl = file_url;
        let fileType = 'image';

        // Handle file upload if provided
        if (file && !file_url) {
            const fileName = `${Date.now()}_${visionary_id}_${file.name}`;
            const filePath = `challenges/${challenge_id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('challenge-submissions')
                .upload(filePath, file, {
                    contentType: file.type,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('File upload error:', uploadError);
                return NextResponse.json(
                    { success: false, error: 'Failed to upload file' },
                    { status: 500 }
                );
            }

            uploadedFileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/challenge-submissions/${filePath}`;

            // Determine file type
            if (file.type.startsWith('image/')) {
                fileType = 'image';
            } else if (file.type.startsWith('video/')) {
                fileType = 'video';
            } else if (file.type.startsWith('audio/')) {
                fileType = 'audio';
            } else {
                fileType = 'other';
            }
        }

        // Create submission
        const { data: submission, error: submissionError } = await supabase
            .from('challenge_submissions')
            .insert({
                challenge_id,
                visionary_id,
                title,
                description: description || '',
                file_url: uploadedFileUrl,
                file_type: fileType,
                thumbnail_url: fileType === 'image' ? uploadedFileUrl : null,
                status: 'pending',
                vote_count: 0
            })
            .select()
            .single();

        if (submissionError) {
            console.error('Error creating submission:', submissionError);
            return NextResponse.json(
                { success: false, error: 'Failed to create submission' },
                { status: 500 }
            );
        }

        // Award participation badge
        await supabase
            .from('challenge_badges')
            .insert({
                user_id: visionary_id,
                challenge_id,
                badge_type: 'participant',
                badge_name: 'Challenge Participant',
                awarded_at: new Date().toISOString()
            });

        return NextResponse.json({
            success: true,
            submission,
            message: 'Submission created successfully'
        });

    } catch (error: any) {
        console.error('Submission creation error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}