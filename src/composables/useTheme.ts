import { ref, watch } from 'vue'
import { loadState, saveState } from '@/lib/persist'

const KEY = 'alp.theme'

const isDark = ref(
  loadState<boolean | null>(KEY, null) ??
    (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches),
)

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

watch(isDark, (value) => {
  apply(value)
  saveState(KEY, value)
})

export function useTheme() {
  apply(isDark.value)
  return { isDark, toggle: () => (isDark.value = !isDark.value) }
}
