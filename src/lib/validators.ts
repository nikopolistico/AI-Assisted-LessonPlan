/**
 * Shared field validation for the teacher sign-up form (login screen) and the
 * admin-side "Register teacher" tab, so both forms enforce the same rules.
 */

export const EMAIL_MAX = 254
export const NAME_MAX = 80
export const SCHOOL_MAX = 120
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72 // Supabase/bcrypt ceiling.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const HAS_DIGIT = /\d/
const HAS_LETTER = /[A-Za-z]/
// Letters (incl. accented), spaces, apostrophes, hyphens and dots — no digits.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u

export function validateEmail(value: string): string {
  const v = value.trim()
  if (!v) return 'Enter an email address.'
  if (v.length > EMAIL_MAX) return `Email must be at most ${EMAIL_MAX} characters.`
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address, e.g. name@school.com.'
  return ''
}

export function validatePassword(value: string, requireStrength: boolean): string {
  if (!value) return 'Enter a password.'
  if (value.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`
  if (!requireStrength) return ''
  if (value.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`
  if (!HAS_LETTER.test(value) || !HAS_DIGIT.test(value)) {
    return 'Password must include both letters and numbers.'
  }
  return ''
}

export function validateFullName(value: string): string {
  const v = value.trim()
  if (!v) return 'Enter a full name.'
  if (v.length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`
  if (HAS_DIGIT.test(v)) return 'Name should not contain numbers.'
  if (!NAME_RE.test(v)) return 'Use letters only, e.g. Maria Santos.'
  return ''
}

export function validateSchool(value: string): string {
  const v = value.trim()
  if (!v) return 'Enter a school or office.'
  if (v.length > SCHOOL_MAX) return `This must be at most ${SCHOOL_MAX} characters.`
  return ''
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

/** A random password that satisfies validatePassword's strength check. */
export function generatePassword(length = 12): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('')
}
