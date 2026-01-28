import EventDetailPage from '@/Components/pages/thinkTankMessageRoom/RightComp/EventDetail'
import React from 'react'

async function page({ params }: any) {
    const { event } = await params
    return (
        <EventDetailPage eventId={event} />
    )
}

export default page