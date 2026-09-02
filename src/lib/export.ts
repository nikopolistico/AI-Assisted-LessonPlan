import type { Competency, LessonPlan } from '@/types'
import { romanQuarter } from './format'

/** Renders a plan as plain text or Markdown for download. */
export function planToText(
  plan: LessonPlan,
  competency: Competency | null,
  kind: 'txt' | 'md',
): string {
  const md = kind === 'md'
  const h1 = (s: string) => (md ? `# ${s}` : s.toUpperCase())
  const h2 = (s: string) => (md ? `\n## ${s}` : `\n${s.toUpperCase()}\n${'-'.repeat(s.length)}`)
  const h3 = (s: string) => (md ? `\n### ${s}` : `\n${s}`)
  const bullet = (s: string) => (md ? `- ${s}` : `  • ${s}`)

  const lines: string[] = [
    h1(plan.title),
    '',
    `${plan.grade} · Quarter ${romanQuarter(plan.quarter)} · ${plan.duration} minutes`,
    `Template: ${plan.templateName}`,
    `MELC: ${plan.competencyCode}${competency ? ` — ${competency.description}` : ''}`,
    '',
    h2('I. Objectives'),
    'At the end of the lesson, the learners should be able to:',
    ...plan.objectives.map((o, i) => (md ? `${i + 1}. ${o}` : `  ${i + 1}. ${o}`)),
    '',
    h2('II. Learning Resources'),
    ...plan.materials.map(bullet),
    '',
    h2('III. Procedure'),
  ]

  for (const section of plan.sections) {
    lines.push(h3(`${section.title} (${section.minutes} minutes)`), '', section.body, '')
  }

  lines.push(
    h2('IV. Evaluation'),
    plan.assessment,
    '',
    h2('V. Assignment'),
    plan.assignment,
    '',
    h2('VI. Remarks'),
    plan.remarks || '—',
    '',
  )

  return lines.join('\n')
}
