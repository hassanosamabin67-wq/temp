import React from 'react'
import InboxMessages from "@/Components/pages/messages";

async function page({ params }: any) {
    const { room } = await params

    return (
        <InboxMessages roomId={room} />
    )
}

export default page