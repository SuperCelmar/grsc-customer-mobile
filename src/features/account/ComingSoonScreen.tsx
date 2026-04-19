import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../../components/ScreenHeader'

type ComingSoonScreenProps = {
  title: string
}

export function ComingSoonScreen({ title }: ComingSoonScreenProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ScreenHeader
        title={title}
        onBack={() => navigate(-1)}
      />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center pb-24">
        <p className="text-text-secondary text-sm">This feature is coming soon.</p>
      </div>
    </div>
  )
}
