import { Suspense } from 'react';
import AdvertiserDashboard from '@/Components/pages/advertise/dashboard';

export const metadata = {
    title: 'Advertiser Dashboard | Kaboom Collab',
    description: 'Manage your advertising campaigns on Kaboom Collab. Track impressions, upload ads, and view analytics.',
};

function DashboardContent() {
    return <AdvertiserDashboard />;
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}