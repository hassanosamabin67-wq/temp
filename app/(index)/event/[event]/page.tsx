import React from 'react'
import CollabRoomEvent from '@/Components/pages/CollabRoomEvent'

async function page({ params }: any) {
    const { event } = await params
    return (
        <CollabRoomEvent eventId={event} />
    )
}

export default page