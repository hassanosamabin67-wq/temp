'use client'
import ThinkTankComponent from '@/Components/pages/thinktank'
import React, { Suspense } from 'react'

function ThinkTank() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
    <ThinkTankComponent />
    </Suspense>
  )
}

export default ThinkTank