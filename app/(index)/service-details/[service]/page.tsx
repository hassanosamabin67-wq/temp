import React from 'react'
import ServiceDetailComponent from '@/Components/pages/dashboard/profile/ServiceDetails'

async function page({ params }: any) {
    const { service } = await params
    return (
        <ServiceDetailComponent serviceId={service} />
    )
}

export default page