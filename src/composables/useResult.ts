import { reactive } from 'vue'

/**
 * State for a <ResultDialog>: call `success()` or `error()` after an edit or
 * delete and bind `state` to the dialog. Errors accept anything thrown.
 */
export function useResult() {
  const state = reactive({
    open: false,
    kind: 'success' as 'success' | 'error',
    title: '',
    description: '',
  })

  function show(kind: 'success' | 'error', title: string, description = '') {
    Object.assign(state, { open: true, kind, title, description })
  }

  return {
    state,
    success: (title: string, description?: string) => show('success', title, description),
    error: (title: string, cause: unknown, fallback = 'Please try again.') =>
      show('error', title, cause instanceof Error && cause.message ? cause.message : fallback),
  }
}
