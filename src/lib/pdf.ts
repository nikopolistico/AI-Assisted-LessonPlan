/**
 * Renders a DOM node to a paginated PDF by rasterising it once with html2canvas
 * and slicing the tall canvas into A4-height pages. Good enough for a document
 * this size; a line of text can land on a page break since pagination follows
 * pixel height, not layout.
 */
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas-pro'

export async function downloadElementAsPdf(el: HTMLElement, filename: string) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
  })

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  const imgWidthPt = pageWidth
  const pxPerPt = canvas.width / imgWidthPt
  const pageHeightPx = pageHeight * pxPerPt

  let renderedPx = 0
  let first = true

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')
    if (!ctx) throw new Error('Could not create a canvas context for PDF export.')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    ctx.drawImage(
      canvas,
      0,
      renderedPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    )

    const imgData = pageCanvas.toDataURL('image/jpeg', 0.95)
    if (!first) pdf.addPage()
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidthPt, sliceHeightPx / pxPerPt)

    renderedPx += sliceHeightPx
    first = false
  }

  pdf.save(filename)
}
