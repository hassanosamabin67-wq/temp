import ThinkTankMessageRoom from '@/Components/pages/thinkTankPage/thinkTankMessage'
import React from 'react'

async function page({ params }: any) {
    const { room } = await params
    return (
        <ThinkTankMessageRoom roomId={room} />
    )
}

export default page