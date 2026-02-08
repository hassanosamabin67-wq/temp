'use client'
import React from 'react'
import InboxMessages from '../../messages'
import { useAppSelector } from '@/store'

const Messages = () => {
    const profile = useAppSelector((state) => state.auth);

    return (
        <div>
            {/* <span className={styles.pageHeading}>Messages</span> */}
            <InboxMessages roomId={profile.profileId} fromDashboard={true} />
        </div>
    )
}

export default Messages
