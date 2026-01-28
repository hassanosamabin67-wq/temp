import { redirect } from 'next/navigation'

// Redirect to new dynamic community challenges page
export default function CommunityChallenge() {
  redirect('/community-challenges')
}