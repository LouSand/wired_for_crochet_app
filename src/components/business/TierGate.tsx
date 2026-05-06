import { getSubscriptionTier } from '@/lib/actions/business-gate'
import UpgradePrompt from './UpgradePrompt'

interface TierGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Server component that gates content behind a Pro subscription.
 * If the user is on the 'pro' tier, renders children.
 * If the user is on the 'free' tier, renders the fallback or UpgradePrompt.
 */
export default async function TierGate({ children, fallback }: TierGateProps) {
  const tier = await getSubscriptionTier()

  if (tier === 'pro') {
    return <>{children}</>
  }

  return <>{fallback ?? <UpgradePrompt />}</>
}
