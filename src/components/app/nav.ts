import type { Component } from 'vue'

export interface NavItem {
  label: string
  to: string
  icon: Component
  /** Match the path exactly instead of by prefix — used for index routes. */
  exact?: boolean
  badge?: number
}
