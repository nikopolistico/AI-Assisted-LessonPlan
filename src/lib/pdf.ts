/**
 * Renders the lesson-plan document to an A4 PDF with standard 1-inch margins.
 * The element is rasterised once (padding stripped, width set to the printable
 * area) and sliced into pages. Slices break only at section / procedure
 * boundaries so a block of text is never cut in half, and each page gets a
 * "title — Page X of Y" footer inside the bottom margin.
 */
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'

const MARGIN_PT = 72 // 1 inch
const PX_PER_PT = 96 / 72
// Elements a page may start at. The procedures section is only a break point as
// a whole, never at its first procedure, so its heading is not orphaned.
const BREAK_SELECTOR =
  '.lp-doc__section:not(.lp-doc__section--procedures), .lp-doc__section--procedures, .lp-doc__procedure:not(:first-of-type), .lp-doc__signoff'

export async function downloadElementAsPdf(el: HTMLElement, filename: string, footerLabel = '') {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidthPt = pageWidth - MARGIN_PT * 2
  const contentHeightPt = pageHeight - MARGIN_PT * 2

  // Lay the element out at exactly the printable width; el is off-screen so
  // restyling it for the capture is invisible.
  const originalStyle = el.style.cssText
  el.style.padding = '0'
  el.style.maxWidth = 'none'
  el.style.width = `${contentWidthPt * PX_PER_PT}px`

  let canvas: HTMLCanvasElement
  let breaksPx: number[]
  try {
    canvas = await html2canvas(el, { scale: 2 })
    const top = el.getBoundingClientRect().top
    const ratio = canvas.width / el.getBoundingClientRect().width
    breaksPx = [...el.querySelectorAll(BREAK_SELECTOR)].map(
      (n) => (n.getBoundingClientRect().top - top) * ratio,
    )
  } finally {
    el.style.cssText = originalStyle
  }

  const pxPerPt = canvas.width / contentWidthPt
  const pageHeightPx = contentHeightPt * pxPerPt

  let start = 0
  let pages = 0
  while (start < canvas.height) {
    const limit = start + pageHeightPx
    // Latest clean break that fits on this page; hard cut only if a single block is taller than a page.
    const fit = breaksPx.filter((b) => b > start + 1 && b <= limit)
    const end = limit >= canvas.height ? canvas.height : (fit[fit.length - 1] ?? limit)
    const sliceHeightPx = end - start

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = Math.ceil(sliceHeightPx)
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('Could not create a canvas context for PDF export.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(canvas, 0, start, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)

    if (pages > 0) pdf.addPage()
    pdf.addImage(
      pageCanvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      MARGIN_PT,
      MARGIN_PT,
      contentWidthPt,
      sliceHeightPx / pxPerPt,
    )

    start = end
    pages++
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(106)
  for (let i = 1; i <= pages; i++) {
    pdf.setPage(i)
    const y = pageHeight - MARGIN_PT / 2
    if (footerLabel) pdf.text(footerLabel, MARGIN_PT, y, { maxWidth: contentWidthPt - 80 })
    pdf.text(`Page ${i} of ${pages}`, pageWidth - MARGIN_PT, y, { align: 'right' })
  }

  pdf.save(filename)
}
