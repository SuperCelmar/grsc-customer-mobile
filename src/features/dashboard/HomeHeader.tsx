import { ScreenHeader } from '../../components/ScreenHeader'

interface HomeHeaderProps {
  storeName?: string
  isOpen?: boolean
  firstName: string
  onProfileClick: () => void
}

export function HomeHeader({ storeName, isOpen, onProfileClick }: HomeHeaderProps) {
  return (
    <ScreenHeader
      title={storeName || 'GoldRush'}
      context="Pickup from"
      showStatus={storeName !== undefined}
      isOpen={isOpen}
      rightAction="profile"
      onRightActionClick={onProfileClick}
    />
  )
}
