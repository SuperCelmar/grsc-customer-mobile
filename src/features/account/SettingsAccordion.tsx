import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Accordion, AccordionRow } from './Accordion'
import { supabase } from '../../lib/supabase'
import { SUPPORT_WHATSAPP_E164 } from '../../lib/config'

export function SettingsAccordion() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const supportText = encodeURIComponent('Hi, I need help with my GoldRush Sports Coffee account.')
  const supportUrl = SUPPORT_WHATSAPP_E164
    ? `https://wa.me/${SUPPORT_WHATSAPP_E164}?text=${supportText}`
    : null

  return (
    <Accordion icon={Settings} title="Settings & Support" defaultOpen={false}>
      <AccordionRow onClick={() => navigate('/account/notifications')}>
        <span className="text-sm text-[#1A1410]">Notification preferences</span>
      </AccordionRow>

      <AccordionRow
        onClick={() => window.open('https://goldrushsportscoffee.com/terms', '_blank', 'noopener,noreferrer')}
      >
        <span className="text-sm text-[#1A1410]">Terms &amp; Privacy</span>
      </AccordionRow>

      {supportUrl && (
        <AccordionRow
          onClick={() => window.open(supportUrl, '_blank', 'noopener,noreferrer')}
        >
          <span className="text-sm text-[#1A1410]">Contact support</span>
        </AccordionRow>
      )}

      <AccordionRow onClick={handleSignOut}>
        <span className="text-sm text-red-600 font-semibold">Sign out</span>
      </AccordionRow>

      <p className="text-[10px] text-[#6B6560] pt-2 text-center">
        v{import.meta.env.VITE_APP_VERSION ?? 'dev'}
      </p>
    </Accordion>
  )
}
