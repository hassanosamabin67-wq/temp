import VideoCalling from '@/Components/pages/videoCall/VideoCalling'
import React from 'react'

async function page({ params }: any) {
    const { channelName } = await params

    return (
        <VideoCalling channelName={channelName} />
    )
}

export default page