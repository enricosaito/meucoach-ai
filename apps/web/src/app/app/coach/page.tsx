import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CoachView } from './coach-view'

export const metadata: Metadata = { title: 'Coach' }

export default function CoachPage() {
  return (
    <Suspense>
      <CoachView />
    </Suspense>
  )
}
