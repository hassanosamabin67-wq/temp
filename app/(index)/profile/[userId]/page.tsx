'use client'
import ProfileSelection from '@/Components/pages/profile';
import ProfileSetup from '@/Components/pages/profile'
import { useParams } from 'next/navigation';
import React from 'react'

 function page({ params }: any) {
 // Access the slug from the URL
 console.log("params", params);
  const slug = params.userId;

  return (
    <div>
        <ProfileSelection userId={slug} />
    </div>
  )
}

export default page