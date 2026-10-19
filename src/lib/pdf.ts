/**
 * Writes the lesson plan straight to an A4 PDF as real text (1-inch margins,
 * black text, "title — Page X of Y" footer). Drawing text with jsPDF instead of
 * screenshotting the DOM means the output never depends on CSS, fonts or
 * off-screen layout, which is what made the old html2canvas export blank.
 */
import { jsPDF } from 'jspdf'
import type { Competency, LessonPlan } from '@/types'
import { formatDate, romanQuarter } from '@/lib/format'

const MARGIN = 72 // 1 inch
const BLACK = 0
const LINE = 1.4 // line height as a multiple of font size

export interface PlanPdfInput {
  plan: LessonPlan
  competency: Competency | null
  teacherName: string
  school: string
}

// shortcut: built-in PDF fonts only cover WinAnsi (Latin-1 + a few marks), so common
// math symbols are spelled out and anything else becomes "?"; embed a Unicode TTF if
// plans start needing Greek letters or other symbols verbatim.
const SYMBOLS: Record<string, string> = {
  'π': 'pi', '√': 'sqrt', '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~', '−': '-', '∞': 'infinity',
  'θ': 'theta', 'Δ': 'Delta', 'α': 'alpha', 'β': 'beta', '∠': 'angle', '→': '->', '←': '<-',
  '⁄': '/', '∑': 'sum', '…': '...',
}
export function pdfSafe(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/\t/g, '    ')
    .replace(/[^\n\x20-\x7e\xa0-\xff]/g, (c) => SYMBOLS[c] ?? ('‘’“”–—•€™'.includes(c) ? c : '?'))
}

export function buildPlanPdf({ plan, competency, teacherName, school }: PlanPdfInput): jsPDF {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const width = pageWidth - MARGIN * 2
  const bottom = pageHeight - MARGIN
  let y = MARGIN

  pdf.setTextColor(BLACK)
  pdf.setDrawColor(BLACK)

  function font(family: 'times' | 'helvetica', style: string, size: number) {
    pdf.setFont(family, style)
    pdf.setFontSize(size)
  }
  // Start a new page when the next `height` points would run into the bottom margin.
  function ensure(height: number) {
    if (y + height > bottom) {
      pdf.addPage()
      y = MARGIN
    }
  }
  function lines(text: string, maxWidth: number): string[] {
    return pdf.splitTextToSize(pdfSafe(text), maxWidth)
  }
  // Wrapped paragraph in the current font; breaks across pages line by line.
  function paragraph(text: string, indent = 0, align: 'left' | 'center' = 'left', gapAfter = 6) {
    const size = pdf.getFontSize()
    for (const line of lines(text, width - indent)) {
      ensure(size * LINE)
      const x = align === 'center' ? pageWidth / 2 : MARGIN + indent
      pdf.text(line, x, y, { baseline: 'top', align })
      y += size * LINE
    }
    y += gapAfter
  }
  function rule(weight: number) {
    pdf.setLineWidth(weight)
    pdf.line(MARGIN, y, pageWidth - MARGIN, y)
  }
  function heading(text: string) {
    // Keep the heading on the same page as at least a few lines of its content.
    ensure(12.5 * LINE + 6 + 13 * LINE * 3)
    font('helvetica', 'bold', 12.5)
    pdf.text(pdfSafe(text.toUpperCase()), MARGIN, y, { baseline: 'top' })
    y += 12.5 * LINE
    rule(0.5)
    y += 6
    font('times', 'normal', 13)
  }
  function list(items: string[], marker: (i: number) => string) {
    font('times', 'normal', 13)
    items.forEach((item, i) => {
      ensure(13 * LINE)
      pdf.text(marker(i), MARGIN + 4, y, { baseline: 'top' })
      paragraph(item, 22, 'left', 3)
    })
    y += 3
  }

  // Masthead: crest, title block, heavy rule.
  pdf.setLineWidth(1.2)
  pdf.circle(MARGIN + 22, y + 22, 22)
  font('helvetica', 'bold', 9)
  pdf.text('DepEd', MARGIN + 22, y + 22, { align: 'center', baseline: 'middle' })
  const tx = MARGIN + 58
  font('helvetica', 'normal', 9)
  pdf.text('DEPARTMENT OF EDUCATION', tx, y + 2, { baseline: 'top', charSpace: 1 })
  font('times', 'bold', 20)
  pdf.text('Daily Lesson Plan', tx, y + 14, { baseline: 'top' })
  font('helvetica', 'normal', 10.5)
  pdf.text(pdfSafe(`Mathematics · ${plan.grade}`), tx, y + 38, { baseline: 'top' })
  y += 56
  rule(1.5)
  y += 16

  // Meta table: label / value / label / value, cells grow to fit wrapped text.
  const meta: [string, string, string, string][] = [
    ['School', school || '—', 'Grade Level', plan.grade],
    ['Teacher', teacherName || '—', 'Learning Area', 'Mathematics'],
    ['Teaching Date', formatDate(plan.updatedAt), 'Quarter', romanQuarter(plan.quarter)],
    ['Time Allotment', `${plan.duration} minutes`, 'Instructional Model', plan.templateName],
  ]
  const cols = [0.2, 0.3, 0.2, 0.3].map((f) => f * width)
  const pad = 5
  const metaSize = 10.5
  pdf.setLineWidth(0.5)
  for (const row of meta) {
    const cells = row.map((cell, c) => {
      font('helvetica', c % 2 === 0 ? 'bold' : 'normal', metaSize)
      return lines(cell, cols[c]! - pad * 2)
    })
    const rowHeight = Math.max(...cells.map((l) => l.length)) * metaSize * LINE + pad * 2
    ensure(rowHeight)
    let x = MARGIN
    cells.forEach((cellLines, c) => {
      if (c % 2 === 0) {
        pdf.setFillColor(243, 242, 238)
        pdf.rect(x, y, cols[c]!, rowHeight, 'FD')
      } else {
        pdf.rect(x, y, cols[c]!, rowHeight)
      }
      font('helvetica', c % 2 === 0 ? 'bold' : 'normal', metaSize)
      pdf.text(cellLines, x + pad, y + pad, { baseline: 'top', lineHeightFactor: LINE })
      x += cols[c]!
    })
    y += rowHeight
  }
  y += 18

  font('times', 'bold', 16)
  paragraph(plan.title, 0, 'center', 2)
  font('times', 'italic', 12)
  paragraph(`Topic: ${plan.topic}`, 0, 'center', 16)

  heading('I. Objectives')
  font('times', 'italic', 13)
  paragraph('At the end of the lesson, the learners should be able to:', 0, 'left', 4)
  list(plan.objectives, (i) => `${i + 1}.`)
  if (competency) {
    font('times', 'bold', 12)
    paragraph(`Learning Competency (${competency.code}):`, 10, 'left', 0)
    font('times', 'normal', 12)
    paragraph(competency.description, 10, 'left', 6)
  }
  y += 8

  heading('II. Learning Resources')
  list(plan.materials, () => '•')
  y += 8

  const total = plan.sections.reduce((sum, s) => sum + s.minutes, 0)
  heading('III. Procedures')
  font('times', 'italic', 12)
  paragraph(`${plan.templateName} — ${total} min`, 0, 'left', 6)
  plan.sections.forEach((section, i) => {
    ensure(13 * LINE * 3)
    font('times', 'bold', 13)
    paragraph(`${'abcdefghijklmnopqrstuvwxyz'[i] ?? i + 1}. ${section.title} (${section.minutes} min)`, 0, 'left', 1)
    font('times', 'normal', 13)
    paragraph(section.body, 0, 'left', 10)
  })
  y += 6

  for (const [title, body] of [
    ['IV. Evaluation', plan.assessment],
    ['V. Assignment', plan.assignment],
    ['VI. Remarks', plan.remarks || '—'],
  ] as const) {
    heading(title)
    paragraph(body, 0, 'left', 14)
  }

  // Sign-off: two signature lines side by side.
  ensure(90)
  y += 30
  const colWidth = (width - 40) / 2
  ;[
    [teacherName || '', `Teacher, ${plan.grade}`],
    ['', 'Noted by: School Head / Master Teacher'],
  ].forEach(([name, label], i) => {
    const x = MARGIN + i * (colWidth + 40)
    const cx = x + colWidth / 2
    font('times', 'bold', 13)
    if (name) pdf.text(pdfSafe(name), cx, y, { align: 'center', baseline: 'top', maxWidth: colWidth })
    pdf.setLineWidth(0.75)
    pdf.line(x, y + 20, x + colWidth, y + 20)
    font('helvetica', 'normal', 10)
    pdf.text(pdfSafe(label!), cx, y + 26, { align: 'center', baseline: 'top', maxWidth: colWidth })
  })

  const pages = pdf.getNumberOfPages()
  font('helvetica', 'normal', 8)
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    const fy = pageHeight - MARGIN / 2
    pdf.text(pdfSafe(plan.title), MARGIN, fy, { maxWidth: width - 80 })
    pdf.text(`Page ${i} of ${pages}`, pageWidth - MARGIN, fy, { align: 'right' })
  }
  return pdf
}

export function downloadPlanAsPdf(input: PlanPdfInput, filename: string) {
  buildPlanPdf(input).save(filename)
}
