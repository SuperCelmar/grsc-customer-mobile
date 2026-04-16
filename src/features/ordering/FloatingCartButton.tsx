import { useCart } from '../../contexts/CartContext'

type Props = { onClick: () => void }

export function FloatingCartButton({ onClick }: Props) {
  const { itemCount, subtotal } = useCart()
  if (itemCount === 0) return null

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 left-4 right-4 max-w-[398px] mx-auto flex items-center justify-between px-4 py-3 rounded-lg text-white shadow-lg z-30"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      <span className="text-sm font-medium">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
      <span className="text-sm font-semibold">View Cart · ₹{subtotal.toFixed(0)}</span>
    </button>
  )
}
