import React from 'react'
import InvitationPage from "@/Components/pages/InvitationPage";

async function page({ params }: any) {
    const { invitation } = await params
    return (
        <InvitationPage invitationId={invitation} />
    )
}

export default page;