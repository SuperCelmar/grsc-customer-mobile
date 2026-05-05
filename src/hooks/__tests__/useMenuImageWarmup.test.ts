import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoreMenu } from '../../lib/api'
import { __testing } from '../useMenuImageWarmup'

const { collectImageUrls, resetImageWarmupState, runWarmupQueue } = __testing

function menuWithUrls(productUrls: Array<string | null>, onlineUrls: Array<string | null>): StoreMenu {
  return {
    success: true,
    store: {
      id: 'store-1',
      code: 'grsc',
      name: 'GoldRush',
      petpooja_restaurant_id: 'rest-1',
    },
    menu_version: null,
    categories: [],
    products: productUrls.map((url, index) => ({
      id: `product-${index}`,
      name: `Product ${index}`,
      description: null,
      image_url: url,
      price: 100,
      category_ids: [],
      addon_groups: [],
    })),
    online_products: onlineUrls.map((url, index) => ({
      id: `online-${index}`,
      name: `Online ${index}`,
      description: null,
      image_url: url,
      source_id: `source-${index}`,
      category_name: 'Performance Coffee',
      subscription_eligible: false,
      variants: [],
    })),
  }
}

describe('useMenuImageWarmup internals', () => {
  beforeEach(() => {
    resetImageWarmupState()
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    resetImageWarmupState()
  })

  it('deduplicates image URLs and skips null values', () => {
    const urls = collectImageUrls(
      menuWithUrls(
        ['https://cdn.example.com/one.webp', null, 'https://cdn.example.com/two.webp'],
        ['https://cdn.example.com/one.webp', null]
      )
    )

    expect(urls).toEqual([
      'https://cdn.example.com/one.webp',
      'https://cdn.example.com/two.webp',
    ])
  })

  it('warms images with low concurrency', async () => {
    let activeFetches = 0
    let maxActiveFetches = 0
    let releaseFetches: () => void = () => {}
    const waitForRelease = new Promise<void>(resolve => {
      releaseFetches = resolve
    })
    const cache = {
      match: vi.fn<Cache['match']>().mockResolvedValue(undefined),
      put: vi.fn<Cache['put']>().mockResolvedValue(undefined),
    }
    const cachesMock = {
      open: vi.fn<typeof caches.open>().mockResolvedValue(cache as unknown as Cache),
    }
    const fetchMock = vi.fn<typeof fetch>(async () => {
      activeFetches += 1
      maxActiveFetches = Math.max(maxActiveFetches, activeFetches)
      await waitForRelease
      activeFetches -= 1
      return new Response('image')
    })

    vi.stubGlobal('caches', cachesMock)
    vi.stubGlobal('fetch', fetchMock)

    const task = runWarmupQueue(
      [
        'https://cdn.example.com/one.webp',
        'https://cdn.example.com/two.webp',
        'https://cdn.example.com/three.webp',
        'https://cdn.example.com/four.webp',
        'https://cdn.example.com/five.webp',
      ],
      new AbortController().signal
    )

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3)
    })
    releaseFetches()
    await task

    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(maxActiveFetches).toBeLessThanOrEqual(3)
  })

  it('handles failed downloads without blocking later warmup', async () => {
    const cache = {
      match: vi.fn<Cache['match']>().mockResolvedValue(undefined),
      put: vi.fn<Cache['put']>().mockResolvedValue(undefined),
    }
    const cachesMock = {
      open: vi.fn<typeof caches.open>().mockResolvedValue(cache as unknown as Cache),
    }
    const fetchMock = vi.fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValue(new Response('image'))

    vi.stubGlobal('caches', cachesMock)
    vi.stubGlobal('fetch', fetchMock)

    await runWarmupQueue(
      ['https://cdn.example.com/bad.webp', 'https://cdn.example.com/good.webp'],
      new AbortController().signal
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(collectImageUrls(menuWithUrls(['https://cdn.example.com/bad.webp'], []))).toEqual([])
  })
})
