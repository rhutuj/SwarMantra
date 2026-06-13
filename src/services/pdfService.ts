import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { sargamService } from './sargamService'
import { bandishService } from './bandishService'
import { taanService } from './taanService'

async function buildPdf(raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; notes?: string | null }): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontSize = 10
  const titleSize = 16
  const margin = 50
  const pageWidth = 595
  let y = 800

  function addPage() {
    const page = doc.addPage([pageWidth, 842])
    return { page, y: 800 }
  }

  function drawText(text: string, size: number, bold?: boolean) {
    const page = doc.getPages()[doc.getPageCount() - 1]
    const f = bold ? fontBold : font
    page.drawText(text, { x: margin, y, size, font: f, color: rgb(0.1, 0.1, 0.1) })
    y -= size + 4
  }

  function drawPair(label: string, value: string | undefined | null) {
    if (!value) return
    const page = doc.getPages()[doc.getPageCount() - 1]
    page.drawText(`${label}: `, { x: margin, y, size: fontSize, font: fontBold })
    page.drawText(value, { x: margin + 50, y, size: fontSize, font })
    y -= fontSize + 4
  }

  function drawNotation(label: string, notation: string | undefined | null, taal: string | undefined | null) {
    if (!notation) return
    checkSpace(40)
    const page = doc.getPages()[doc.getPageCount() - 1]
    page.drawText(`${label}${taal ? ` (${taal})` : ''}:`, { x: margin, y, size: fontSize, font: fontBold, color: rgb(0.1, 0.1, 0.1) })
    y -= fontSize + 3

    const lines = notation.split('\n')
    for (const line of lines) {
      if (y < margin + 20) {
        ;({ y } = addPage())
      }
      const matras = line.split('|')
      page.drawText(matras.join(' | '), { x: margin + 8, y, size: fontSize - 1, font, color: rgb(0.3, 0.3, 0.3) })
      y -= fontSize + 2
    }
    y -= 4
  }

  function checkSpace(needed: number) {
    if (y < margin + needed) {
      ;({ y } = addPage())
    }
  }

  function drawDivider() {
    checkSpace(20)
    const page = doc.getPages()[doc.getPageCount() - 1]
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) })
    y -= 12
  }

  addPage()
  drawText(raag.name, titleSize, true)
  y -= 4

  if (raag.thaat) drawPair('Thaat', raag.thaat)
  drawPair('Aaroh', raag.aaroh)
  drawPair('Avroh', raag.avroh)
  drawPair('Pakad', raag.pakad)
  if (raag.notes) {
    checkSpace(20)
    drawText('Notes:', fontSize, true)
    y += 2
    drawText(raag.notes, fontSize)
  }

  try {
    const sargams = await sargamService.getSargamsByRaagId(raag.id)
    if (sargams.length > 0) {
      y -= 8
      drawDivider()
      drawText('Sargams', titleSize - 2, true)
      y -= 4
      for (const s of sargams) {
        checkSpace(60)
        drawText(s.title, fontSize + 1, true)
        y -= 2
        drawNotation('', s.notation, s.taal)
        if (s.notes) { checkSpace(20); drawText(s.notes, fontSize - 1) }
        const taans = await taanService.getTaansBySargamId(s.id)
        for (const t of taans) {
          checkSpace(30)
          drawText(`  ${t.title}`, fontSize, true)
          drawNotation('', t.notation, undefined)
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const bandishes = await bandishService.getBandishesByRaagId(raag.id)
    if (bandishes.length > 0) {
      y -= 8
      drawDivider()
      drawText('Bandishes', titleSize - 2, true)
      y -= 4
      for (const b of bandishes) {
        checkSpace(80)
        drawText(b.title, fontSize + 1, true)
        y -= 2
        if (b.composer) drawPair('Composer', b.composer)
        if (b.taal) drawPair('Taal', b.taal)
        if (b.laya) drawPair('Laya', b.laya)
        if (b.lyrics) { checkSpace(20); drawText('Lyrics:', fontSize, true); drawText(b.lyrics, fontSize - 1) }
        drawNotation('Notation', b.notation, undefined)
        if (b.notes) { checkSpace(20); drawText(b.notes, fontSize - 1) }
        const taans = await taanService.getTaansByBandishId(b.id)
        for (const t of taans) {
          checkSpace(30)
          drawText(`  ${t.title}`, fontSize, true)
          drawNotation('', t.notation, undefined)
        }
      }
    }
  } catch { /* ignore */ }

  return doc.save()
}

export const pdfService = {
  async exportRaagPdf(raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; notes?: string | null }): Promise<Uint8Array> {
    return buildPdf(raag)
  },

  async exportRaagPdfToFile(raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; notes?: string | null }): Promise<boolean> {
    const pdfBytes = await buildPdf(raag)
    const filePath = await save({
      defaultPath: `${raag.name}.pdf`,
      filters: [{ name: 'PDF files', extensions: ['pdf'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(pdfBytes) })
    return true
  },
}
