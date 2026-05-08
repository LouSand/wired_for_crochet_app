import TierGate from '@/components/business/TierGate'

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <TierGate>{children}</TierGate>
}
