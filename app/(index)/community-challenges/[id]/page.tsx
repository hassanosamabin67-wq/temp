import ChallengeDetail from '@/Components/pages/CommunityChallenges/ChallengeDetail';
import React from 'react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ChallengeDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <ChallengeDetail challengeId={id} />;
}