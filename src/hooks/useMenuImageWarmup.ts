import { useEffect } from 'react'
import type { StoreMenu } from '../lib/api'

const IMAGE_CACHE = 'grsc-menu-images'
const WARMUP_CONCURRENCY = 3
const PRIORITY_IMAGE_COUNT = 8

const warmedUrls = new Set<string>()
const failedUrls = new Set<string>()

type NavigatorConnection = {
  saveData?: boolean
  effectiveType?: string
}

type NavigatorWithConnection = Navigator & {
  connection?: NavigatorConnection
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
  cancelIdleCallback?: (handle: number) => void
}

function canWarmImages() {
  if (typeof navigator === 'undefined') return false
  if (!navigator.onLine) return false

  const connection = (navigator as NavigatorWithConnection).connection
  if (connection?.saveData) return false
  return connection?.effectiveType !== 'slow-2g' && connection?.effectiveType !== '2g'
}

function collectImageUrls(menu: StoreMenu | undefined): string[] {
  if (!menu) return []

  const urls = [
    ...menu.online_products.map(product => product.image_url),
    ...menu.products.map(product => product.image_url ?? null),
  ]

  return Array.from(
    new Set(
      urls.filter((url): url is string => Boolean(url && !failedUrls.has(url)))
    )
  )
}

function preloadWithImage(url: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const img = new Image()
    const cleanup = () => {
      img.onload = null
      img.onerror = null
      signal.removeEventListener('abort', handleAbort)
    }
    const handleAbort = () => {
      cleanup()
      resolve()
    }

    img.onload = () => {
      cleanup()
      resolve()
    }
    img.onerror = () => {
      cleanup()
      reject(new Error(`image preload failed: ${url}`))
    }
    signal.addEventListener('abort', handleAbort)
    img.decoding = 'async'
    img.src = url
  })
}

async function warmImage(url: string, signal: AbortSignal) {
  if (signal.aborted || warmedUrls.has(url) || failedUrls.has(url) || !canWarmImages()) return

  try {
    if ('caches' in window) {
      const cache = await caches.open(IMAGE_CACHE)
      const cached = await cache.match(url)
      if (cached) {
        warmedUrls.add(url)
        return
      }

      const response = await fetch(url, {
        cache: 'force-cache',
        credentials: 'omit',
        mode: 'no-cors',
        signal,
      })
      if (!signal.aborted) await cache.put(url, response.clone())
    } else {
      await preloadWithImage(url, signal)
    }

    warmedUrls.add(url)
  } catch {
    if (!signal.aborted) failedUrls.add(url)
  }
}

async function runWarmupQueue(urls: string[], signal: AbortSignal) {
  let nextIndex = 0

  async function worker() {
    while (!signal.aborted && nextIndex < urls.length) {
      const url = urls[nextIndex]
      nextIndex += 1
      await warmImage(url, signal)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(WARMUP_CONCURRENCY, urls.length) }, () => worker())
  )
}

export function useMenuImageWarmup(menu: StoreMenu | undefined) {
  useEffect(() => {
    const urls = collectImageUrls(menu)
    if (urls.length === 0 || !canWarmImages()) return

    const controller = new AbortController()
    const priorityUrls = urls.slice(0, PRIORITY_IMAGE_COUNT)
    const backgroundUrls = urls.slice(PRIORITY_IMAGE_COUNT)

    const start = () => {
      void runWarmupQueue([...priorityUrls, ...backgroundUrls], controller.signal)
    }

    const idleWindow = window as IdleWindow
    const idleCallback = idleWindow.requestIdleCallback
    if (idleCallback) {
      const idleId = idleCallback(start, { timeout: 1500 })
      return () => {
        controller.abort()
        idleWindow.cancelIdleCallback?.(idleId)
      }
    }

    const timer = window.setTimeout(start, 200)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [menu])
}

function resetImageWarmupState() {
  warmedUrls.clear()
  failedUrls.clear()
}

export const __testing = {
  collectImageUrls,
  resetImageWarmupState,
  runWarmupQueue,
}
