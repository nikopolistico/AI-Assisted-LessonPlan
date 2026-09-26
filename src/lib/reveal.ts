import type { Directive } from 'vue'

/**
 * `v-reveal` — fades and lifts an element into place the first time it scrolls
 * into view. Pass a number to stagger siblings: `v-reveal="120"` waits 120ms.
 * The hidden state is only applied once JS runs, so content never goes missing
 * without it; reduced-motion users get the content immediately (see index.css).
 */
let observer: IntersectionObserver | null = null

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer?.unobserve(entry.target)
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  )
  return observer
}

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    el.classList.add('reveal')
    if (value) el.style.setProperty('--reveal-delay', `${value}ms`)
    getObserver().observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
