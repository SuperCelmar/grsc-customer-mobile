import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('test infrastructure smoke', () => {
  it('renders a React element', () => {
    render(<div>Hello GoldRush</div>)
    expect(screen.getByText('Hello GoldRush')).toBeInTheDocument()
  })
})
