import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'

export function HomeSearchBar() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      navigate('/order?q=' + encodeURIComponent(trimmed))
    } else {
      navigate('/order')
    }
  }

  return (
    <div className="px-4 py-3">
      <form onSubmit={handleSubmit} className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search coffee, hampers, menu"
          aria-describedby="search-hint"
          className="w-full h-12 rounded-md border border-card bg-white pl-10 pr-3 text-sm text-text-dark placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <span id="search-hint" className="sr-only">Search coffee, hampers, menu</span>
      </form>
    </div>
  )
}
