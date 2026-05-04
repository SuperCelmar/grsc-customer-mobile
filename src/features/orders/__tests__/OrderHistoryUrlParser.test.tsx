import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { OrderHistoryScreen } from '../OrderHistoryScreen'

vi.mock('../../../hooks/useCustomerProfile', () => ({
  useCustomerProfile: () => ({ data: null }),
  useCustomerOrders: () => ({ data: { orders: [], hasMore: false }, isLoading: false, error: null }),
  useCustomerOrdersInfinite: () => ({
    data: { pages: [{ orders: [], hasMore: false }] },
    isLoading: false,
    error: null,
    fetchNextPage: () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
  }),
}))

vi.mock('../../../components/ScreenHeader', () => ({
  ScreenHeader: ({ title }: { title: string }) => <div>{title}</div>,
}))

vi.mock('../ActiveOrderTracker', () => ({
  ActiveOrderTracker: ({ orderId }: { orderId: string }) => (
    <div data-testid="tracker">{orderId}</div>
  ),
}))

vi.mock('../OrderDetailSheet', () => ({
  OrderDetailSheet: () => null,
}))

vi.mock('../../reorder/QuickReorderRow', () => ({
  QuickReorderRow: () => null,
}))

function renderWithUrl(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/orders${search}`]}>
      <OrderHistoryScreen />
    </MemoryRouter>
  )
}

describe('OrderHistoryScreen — ?active= URL parser', () => {
  it('renders tracker for a valid UUID', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    renderWithUrl(`?active=${uuid}`)
    expect(screen.getByTestId('tracker')).toHaveTextContent(uuid)
  })

  it('drops ?active=undefined — no tracker rendered', () => {
    renderWithUrl('?active=undefined')
    expect(screen.queryByTestId('tracker')).not.toBeInTheDocument()
  })

  it('drops empty ?active= — no tracker rendered', () => {
    renderWithUrl('?active=')
    expect(screen.queryByTestId('tracker')).not.toBeInTheDocument()
  })

  it('drops short non-uuid ?active=foo,bar — no tracker rendered', () => {
    renderWithUrl('?active=foo,bar')
    expect(screen.queryByTestId('tracker')).not.toBeInTheDocument()
  })

  it('filters mixed valid/invalid — only valid UUID tracker rendered', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    renderWithUrl(`?active=${uuid},undefined,foo`)
    const trackers = screen.getAllByTestId('tracker')
    expect(trackers).toHaveLength(1)
    expect(trackers[0]).toHaveTextContent(uuid)
  })
})
