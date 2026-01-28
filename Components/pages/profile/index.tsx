import { useAppSelector } from '@/store';
import { useParams } from 'next/navigation';
import React from 'react'
import Client from './client';
import ProfileSetup from './visionary';

function ProfileSelection({userId}:any) {
    const profile = useAppSelector((state) => state.auth);
  return (
    <>
    {
        profile.profileType === 'client' ? <Client /> : <ProfileSetup />
    }
    </>
    
  )
}

export default ProfileSelection