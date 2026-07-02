import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { sargamService } from './sargamService'
import { bandishService } from './bandishService'
import { taanService } from './taanService'
import { Taan } from './taanService'
import { getTaalConfig, getMatraInfo } from '../utils/taalConfig'

/* ──────────────────────── PDF Drawing Context ──────────────────────── */

interface PdfContext {
  doc: PDFDocument
  font: PDFFont
  fontBold: PDFFont
  fontSize: number
  titleSize: number
  margin: number
  pageWidth: number
  y: number
}

function createContext(doc: PDFDocument, font: PDFFont, fontBold: PDFFont): PdfContext {
  return {
    doc,
    font,
    fontBold,
    fontSize: 10,
    titleSize: 16,
    margin: 50,
    pageWidth: 595,
    y: 800,
  }
}

/* ──────────────────────── Drawing Helpers ──────────────────────── */

function addPage(ctx: PdfContext) {
  ctx.doc.addPage([ctx.pageWidth, 842])
  ctx.y = 800
}

function checkSpace(ctx: PdfContext, needed: number) {
  if (ctx.y < ctx.margin + needed) {
    addPage(ctx)
  }
}

function drawText(ctx: PdfContext, text: string, size: number, bold?: boolean, color = rgb(0.1, 0.1, 0.1)) {
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  const f = bold ? ctx.fontBold : ctx.font
  page.drawText(text, { x: ctx.margin, y: ctx.y, size, font: f, color })
  ctx.y -= size + 4
}

function drawPair(ctx: PdfContext, label: string, value: string | undefined | null) {
  if (!value) return
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawText(`${label}: `, { x: ctx.margin, y: ctx.y, size: ctx.fontSize, font: ctx.fontBold })
  page.drawText(value, { x: ctx.margin + 50, y: ctx.y, size: ctx.fontSize, font: ctx.font })
  ctx.y -= ctx.fontSize + 4
}

function drawTitle(ctx: PdfContext, text: string, size?: number) {
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawText(text, { x: ctx.margin, y: ctx.y, size: size || ctx.titleSize, font: ctx.fontBold, color: rgb(0.1, 0.1, 0.1) })
  ctx.y -= (size || ctx.titleSize) + 4
}

function drawSubTitle(ctx: PdfContext, text: string) {
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawText(text, { x: ctx.margin, y: ctx.y, size: ctx.fontSize + 1, font: ctx.fontBold, color: rgb(0.15, 0.15, 0.15) })
  ctx.y -= (ctx.fontSize + 1) + 4
}

function drawDivider(ctx: PdfContext, thick = false) {
  checkSpace(ctx, 20)
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawLine({
    start: { x: ctx.margin, y: ctx.y },
    end: { x: ctx.pageWidth - ctx.margin, y: ctx.y },
    thickness: thick ? 1 : 0.5,
    color: thick ? rgb(0.2, 0.2, 0.2) : rgb(0.7, 0.7, 0.7),
  })
  ctx.y -= thick ? 14 : 12
}

function drawSectionHeader(ctx: PdfContext, label: string) {
  checkSpace(ctx, 30)
  ctx.y -= 4
  drawDivider(ctx, true)
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawText(label, {
    x: ctx.margin,
    y: ctx.y,
    size: ctx.fontSize + 1,
    font: ctx.fontBold,
    color: rgb(0.2, 0.2, 0.2),
  })
  ctx.y -= ctx.fontSize + 6
}

function drawLabel(ctx: PdfContext, label: string) {
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
  page.drawText(label, { x: ctx.margin, y: ctx.y, size: ctx.fontSize, font: ctx.fontBold, color: rgb(0.1, 0.1, 0.1) })
  ctx.y -= ctx.fontSize + 3
}

/* ──────────────────────── Swar Token Parsing ──────────────────────── */

interface SwarToken {
  base: string
  marks: string[]
}

function parseSwarTokens(text: string): SwarToken[] {
  if (!text.trim()) return []
  const result: SwarToken[] = []
  for (const part of text.trim().split(/\s+/)) {
    let current: SwarToken | null = null
    for (let i = 0; i < part.length; i++) {
      const code = part.charCodeAt(i)
      if (code >= 0x0300 && code <= 0x036F) {
        if (current) current.marks.push(part[i])
      } else {
        if (current) result.push(current)
        current = { base: part[i], marks: [] }
      }
    }
    if (current) result.push(current)
  }
  return result
}

/* ──────────────────────── Notation Helpers ──────────────────────── */

function getCellPositions(
  totalMatras: number,
  margin: number,
  pageWidth: number,
): { cellWidth: number; cellX: number[] } {
  const cellWidth = (pageWidth - 2 * margin) / totalMatras
  const cellX: number[] = []
  for (let i = 0; i < totalMatras; i++) {
    cellX.push(margin + i * cellWidth)
  }
  return { cellWidth, cellX }
}

function drawCenteredSwarTokens(
  page: PDFPage,
  tokens: { base: string; marks: string[] }[],
  cellX: number,
  cellWidth: number,
  baselineY: number,
  fontSize: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  align: 'center' | 'left' = 'center',
) {
  if (tokens.length === 0) return

  const gap = 0
  let totalWidth = 0
  for (const token of tokens) {
    if (token.base.length === 0) continue
    totalWidth += font.widthOfTextAtSize(token.base, fontSize)
  }
  totalWidth += (tokens.filter((t) => t.base.length > 0).length - 1) * gap

  let x = align === 'center'
    ? cellX + (cellWidth - totalWidth) / 2
    : cellX + 4

  for (const token of tokens) {
    if (token.base.length === 0) continue
    const baseWidth = font.widthOfTextAtSize(token.base, fontSize)

    page.drawText(token.base, { x, y: baselineY, size: fontSize, font, color })

    for (const mark of token.marks) {
      const centerX = x + baseWidth / 2
      switch (mark) {
        case '\u0307':
          page.drawCircle({ x: centerX, y: baselineY + fontSize + 2, size: 0.8, color })
          break
        case '\u0323':
          page.drawCircle({ x: centerX, y: baselineY - 1.5, size: 0.8, color })
          break
        case '\u0331':
          page.drawLine({ start: { x: x + 1, y: baselineY - 1.5 }, end: { x: x + baseWidth - 1, y: baselineY - 1.5 }, thickness: 0.8, color })
          break
        case '\u0304':
          page.drawLine({ start: { x: x + 1, y: baselineY + fontSize + 2 }, end: { x: x + baseWidth - 1, y: baselineY + fontSize + 2 }, thickness: 0.8, color })
          break
      }
    }

    x += baseWidth + gap
  }
}

function drawHalfMoonArc(
  page: PDFPage,
  cellX: number,
  cellWidth: number,
  notchY: number,
  noteCount: number,
  color: ReturnType<typeof rgb>,
) {
  if (noteCount < 2) return
  const left = cellX + 2
  const right = cellX + cellWidth - 2
  const midX = (left + right) / 2
  const controlDelta = noteCount > 1 ? 6 : 4

  page.drawSvgPath(
    `M ${left} ${notchY} Q ${midX} ${notchY - controlDelta} ${right} ${notchY}`,
    { borderColor: color, borderWidth: 1.2 },
  )
}

/* ──────────────────────── Notation (Clean, no box) ──────────────────────── */

function drawNotation(
  ctx: PdfContext,
  notation: string | undefined | null,
  _startingBeat: number = 1,
  taal?: string | null,
  align: 'center' | 'left' = 'center',
) {
  if (!notation) return
  checkSpace(ctx, 50)

  const taalConfig = taal ? getTaalConfig(taal) : null
  const lineStrings = notation.split('\n').filter(Boolean)
  if (lineStrings.length === 0) return

  const cellLines = lineStrings.map((line) => line.split('|'))
  const totalMatras = cellLines[0].length
  const { cellWidth, cellX } = getCellPositions(totalMatras, ctx.margin, ctx.pageWidth)
  const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]

  // ── Header rows (drawn once, before line loop) ──
  // Serial numbers
  for (let i = 0; i < totalMatras; i++) {
    const numText = String(i + 1)
    const tw = ctx.font.widthOfTextAtSize(numText, 7)
    page.drawText(numText, {
      x: cellX[i] + (cellWidth - tw) / 2,
      y: ctx.y,
      size: 7,
      font: ctx.font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }
  ctx.y -= 10

  // Vibhag markers (only at vibhag starts)
  for (let i = 0; i < totalMatras; i++) {
    if (!taalConfig) continue
    const info = getMatraInfo(taalConfig, i)
    if (info.matraInVibhag === 0) {
      const marker = info.marker
      const markerColor = info.type === 'sam' ? rgb(0.85, 0.1, 0.1) : rgb(0.1, 0.1, 0.1)
      const mw = ctx.fontBold.widthOfTextAtSize(marker, 8)
      page.drawText(marker, {
        x: cellX[i] + (cellWidth - mw) / 2,
        y: ctx.y,
        size: 8,
        font: ctx.fontBold,
        color: markerColor,
      })
    }
  }
  ctx.y -= 14

  // ── Notation lines ──
  for (let lineIdx = 0; lineIdx < cellLines.length; lineIdx++) {
    if (ctx.y < ctx.margin + 20) {
      addPage(ctx)
    }

    const currentPage = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
    const cells = cellLines[lineIdx]
    const lineTopY = ctx.y + 8
    const lineBottomY = ctx.y - 12

    // Draw vibhag separator lines (thick vertical lines between groups)
    if (taalConfig) {
      let matraAccum = 0
      for (let v = 0; v < taalConfig.vibhags.length; v++) {
        matraAccum += taalConfig.vibhags[v].matras
        if (v < taalConfig.vibhags.length - 1) {
          const sepX = cellX[matraAccum]
          currentPage.drawLine({
            start: { x: sepX, y: lineTopY },
            end: { x: sepX, y: lineBottomY },
            thickness: 1.5,
            color: rgb(0.2, 0.2, 0.2),
          })
        }
      }
    }

    // Draw cells
    for (let i = 0; i < totalMatras; i++) {
      const cellText = cells[i] || ''
      if (!cellText.trim()) continue

      const tokens = parseSwarTokens(cellText)
      drawCenteredSwarTokens(currentPage, tokens, cellX[i], cellWidth, ctx.y, 8, ctx.font, rgb(0.1, 0.1, 0.1), align)

      const noteCount = tokens.length
      const arcColor = (taalConfig && getMatraInfo(taalConfig, i).type === 'sam')
        ? rgb(0.86, 0.15, 0.15)
        : rgb(0.2, 0.2, 0.2)
      drawHalfMoonArc(currentPage, cellX[i], cellWidth, ctx.y - 5, noteCount, arcColor)
    }

    ctx.y -= 28
  }
}

/* ──────────────────────── PDF Builders ──────────────────────── */

async function buildRaagPdf(
  raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; vadi?: string | null; samvadi?: string | null; komalSur?: string | null; tivraSur?: string | null; jati?: string | null; notes?: string | null }
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx = createContext(doc, font, fontBold)

  addPage(ctx)
  drawTitle(ctx, `RAAG ${raag.name.toUpperCase()}`)
  drawDivider(ctx)

  if (raag.thaat) drawPair(ctx, 'Thaat', raag.thaat)
  if (raag.vadi) drawPair(ctx, 'Vadi', raag.vadi)
  if (raag.samvadi) drawPair(ctx, 'Samvadi', raag.samvadi)
  if (raag.komalSur) drawPair(ctx, 'Komal Sur', raag.komalSur)
  if (raag.tivraSur) drawPair(ctx, 'Tivra Sur', raag.tivraSur)
  if (raag.jati) drawPair(ctx, 'Jati', raag.jati)
  drawPair(ctx, 'Aaroh', raag.aaroh)
  drawPair(ctx, 'Avroh', raag.avroh)
  drawPair(ctx, 'Pakad', raag.pakad)
  if (raag.notes) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Notes')
    drawText(ctx, raag.notes, ctx.fontSize)
  }

  try {
    const sargams = await sargamService.getSargamsByRaagId(raag.id)
    if (sargams.length > 0) {
      drawSectionHeader(ctx, 'SARGAM SECTION')
      for (const s of sargams) {
        checkSpace(ctx, 60)
        drawSubTitle(ctx, `SARGAM : ${s.title}`)
        drawDivider(ctx)
        if (s.taal) drawPair(ctx, 'Taal', s.taal)
        if (s.laya) drawPair(ctx, 'Laya', s.laya)
        if (s.bpm) drawPair(ctx, 'BPM', String(s.bpm))
        if (s.notes) { checkSpace(ctx, 20); drawText(ctx, s.notes, ctx.fontSize - 1) }
        if (s.asthayi) {
          checkSpace(ctx, 20)
          drawLabel(ctx, 'Asthayi')
          drawNotation(ctx, s.asthayi, s.startingBeat, s.taal)
        }
        if (s.antara) {
          checkSpace(ctx, 20)
          drawLabel(ctx, 'Antara')
          drawNotation(ctx, s.antara, s.startingBeat, s.taal)
        }

        const taans = await taanService.getTaansBySargamId(s.id)
        for (const t of taans) {
          checkSpace(ctx, 30)
          if (t.notation) {
            drawText(ctx, t.notation, ctx.fontSize - 1)
          }
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const bandishes = await bandishService.getBandishesByRaagId(raag.id)
    if (bandishes.length > 0) {
      drawSectionHeader(ctx, 'BANDISH SECTION')
      for (const b of bandishes) {
        checkSpace(ctx, 80)
        drawSubTitle(ctx, `BANDISH : ${b.title}`)
        drawDivider(ctx)
        if (b.composer) drawPair(ctx, 'Composer', b.composer)
        if (b.taal) drawPair(ctx, 'Taal', b.taal)
        if (b.laya) drawPair(ctx, 'Laya', b.laya)
        if (b.bpm) drawPair(ctx, 'BPM', String(b.bpm))
        if (b.lyrics) {
          checkSpace(ctx, 20)
          drawLabel(ctx, 'Lyrics')
          drawText(ctx, b.lyrics, ctx.fontSize - 1)
        }
        if (b.asthayi) {
          checkSpace(ctx, 20)
          drawLabel(ctx, 'Asthayi')
          drawNotation(ctx, b.asthayi, b.startingBeat, b.taal)
        }
        if (b.antara) {
          checkSpace(ctx, 20)
          drawLabel(ctx, 'Antara')
          drawNotation(ctx, b.antara, b.startingBeat, b.taal)
        }
        if (b.notes) { checkSpace(ctx, 20); drawText(ctx, b.notes, ctx.fontSize - 1) }

        const taans = await taanService.getTaansByBandishId(b.id)
        for (const t of taans) {
          checkSpace(ctx, 30)
          if (t.notation) {
            drawText(ctx, t.notation, ctx.fontSize - 1)
          }
        }
      }
    }
  } catch { /* ignore */ }

  return doc.save()
}

async function buildSargamPdf(
  sargam: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
  raag: { name: string },
  taans: Taan[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx = createContext(doc, font, fontBold)

  addPage(ctx)
  drawTitle(ctx, `SARGAM : ${sargam.title.toUpperCase()}`)
  drawDivider(ctx)

  drawPair(ctx, 'Raag', raag.name)
  if (sargam.taal) drawPair(ctx, 'Taal', sargam.taal)
  if (sargam.laya) drawPair(ctx, 'Laya', sargam.laya)
  if (sargam.bpm) drawPair(ctx, 'BPM', String(sargam.bpm))
  if (sargam.notes) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Notes')
    drawText(ctx, sargam.notes, ctx.fontSize)
  }

  if (sargam.asthayi) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Asthayi')
    drawNotation(ctx, sargam.asthayi, sargam.startingBeat, sargam.taal)
  }
  if (sargam.antara) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Antara')
    drawNotation(ctx, sargam.antara, sargam.startingBeat, sargam.taal)
  }

  if (taans.length > 0) {
    drawSectionHeader(ctx, 'TAANS')
    for (const t of taans) {
      checkSpace(ctx, 30)

      drawText(ctx, `Matra ${t.startingMatra}`, ctx.fontSize, true)
      if (t.textNote) drawText(ctx, t.textNote, ctx.fontSize)

      if (t.notation) {
        const lines = t.notation.split('\n').filter(Boolean)
        for (const line of lines) {
          const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
          page.drawText(line, { x: ctx.margin + 12, y: ctx.y, size: ctx.fontSize, font: ctx.font })
          ctx.y -= ctx.fontSize + 4
        }
      }
    }
  }

  return doc.save()
}

async function buildBandishPdf(
  bandish: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; composer?: string | null; lyrics?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
  raag: { name: string },
  taans: Taan[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx = createContext(doc, font, fontBold)

  addPage(ctx)
  drawTitle(ctx, `BANDISH : ${bandish.title.toUpperCase()}`)
  drawDivider(ctx)

  drawPair(ctx, 'Raag', raag.name)
  if (bandish.composer) drawPair(ctx, 'Composer', bandish.composer)
  if (bandish.taal) drawPair(ctx, 'Taal', bandish.taal)
  if (bandish.laya) drawPair(ctx, 'Laya', bandish.laya)
  if (bandish.bpm) drawPair(ctx, 'BPM', String(bandish.bpm))
  if (bandish.lyrics) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Lyrics')
    drawText(ctx, bandish.lyrics, ctx.fontSize)
  }
  if (bandish.notes) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Notes')
    drawText(ctx, bandish.notes, ctx.fontSize)
  }

  if (bandish.asthayi) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Asthayi')
    drawNotation(ctx, bandish.asthayi, bandish.startingBeat, bandish.taal)
  }
  if (bandish.antara) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Antara')
    drawNotation(ctx, bandish.antara, bandish.startingBeat, bandish.taal)
  }

  if (taans.length > 0) {
    drawSectionHeader(ctx, 'TAANS')
    for (const t of taans) {
      checkSpace(ctx, 30)

      drawText(ctx, `Matra ${t.startingMatra}`, ctx.fontSize, true)
      if (t.textNote) drawText(ctx, t.textNote, ctx.fontSize)

      if (t.notation) {
        const lines = t.notation.split('\n').filter(Boolean)
        for (const line of lines) {
          const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
          page.drawText(line, { x: ctx.margin + 12, y: ctx.y, size: ctx.fontSize, font: ctx.font })
          ctx.y -= ctx.fontSize + 4
        }
      }
    }
  }

  return doc.save()
}

async function buildTaanPdf(
  taan: { notation?: string | null; startingMatra: number; textNote?: string | null },
  raagName: string,
  parentTitle: string,
  taal: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ctx = createContext(doc, font, fontBold)

  addPage(ctx)
  drawTitle(ctx, `TAAN`)
  drawDivider(ctx)

  drawPair(ctx, 'Raag', raagName)
  drawPair(ctx, 'Parent', parentTitle)
  drawPair(ctx, 'Taal', taal)
  drawPair(ctx, 'Starting Matra', String(taan.startingMatra))

  if (taan.textNote) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Text Note')
    drawText(ctx, taan.textNote, ctx.fontSize)
  }

  if (taan.notation) {
    checkSpace(ctx, 20)
    drawLabel(ctx, 'Notation')
    const lines = taan.notation.split('\n').filter(Boolean)
    for (const line of lines) {
      const page = ctx.doc.getPages()[ctx.doc.getPageCount() - 1]
      page.drawText(line, { x: ctx.margin, y: ctx.y, size: ctx.fontSize, font: ctx.font })
      ctx.y -= ctx.fontSize + 4
    }
  }

  return doc.save()
}

/* ──────────────────────── File Saving ──────────────────────── */

async function savePdf(bytes: Uint8Array, defaultPath: string): Promise<boolean> {
  const filePath = await save({
    defaultPath,
    filters: [{ name: 'PDF files', extensions: ['pdf'] }],
  })
  if (!filePath) return false
  await invoke('save_file', { path: filePath, content: Array.from(bytes) })
  return true
}

/* ──────────────────────── Public API ──────────────────────── */

export const pdfService = {
  async exportRaagPdf(
    raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; vadi?: string | null; samvadi?: string | null; komalSur?: string | null; tivraSur?: string | null; jati?: string | null; notes?: string | null }
  ): Promise<Uint8Array> {
    return buildRaagPdf(raag)
  },

  async exportRaagPdfToFile(
    raag: { id: string; name: string; thaat?: string | null; aaroh?: string | null; avroh?: string | null; pakad?: string | null; vadi?: string | null; samvadi?: string | null; komalSur?: string | null; tivraSur?: string | null; jati?: string | null; notes?: string | null }
  ): Promise<boolean> {
    const bytes = await buildRaagPdf(raag)
    return savePdf(bytes, `${raag.name}.pdf`)
  },

  async exportSargamPdf(
    sargam: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
    raag: { name: string },
    taans: Taan[]
  ): Promise<Uint8Array> {
    return buildSargamPdf(sargam, raag, taans)
  },

  async exportSargamPdfToFile(
    sargam: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
    raag: { name: string },
    taans: Taan[]
  ): Promise<boolean> {
    const bytes = await buildSargamPdf(sargam, raag, taans)
    return savePdf(bytes, `${raag.name} - ${sargam.title}.pdf`)
  },

  async exportBandishPdf(
    bandish: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; composer?: string | null; lyrics?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
    raag: { name: string },
    taans: Taan[]
  ): Promise<Uint8Array> {
    return buildBandishPdf(bandish, raag, taans)
  },

  async exportBandishPdfToFile(
    bandish: { id: string; title: string; taal?: string | null; bpm?: number | null; laya?: string | null; composer?: string | null; lyrics?: string | null; asthayi?: string | null; antara?: string | null; notes?: string | null; startingBeat: number; raagId: string },
    raag: { name: string },
    taans: Taan[]
  ): Promise<boolean> {
    const bytes = await buildBandishPdf(bandish, raag, taans)
    return savePdf(bytes, `${raag.name} - ${bandish.title}.pdf`)
  },

  async exportTaanPdf(
    taan: { notation?: string | null; startingMatra: number; textNote?: string | null },
    raagName: string,
    parentTitle: string,
    taal: string
  ): Promise<Uint8Array> {
    return buildTaanPdf(taan, raagName, parentTitle, taal)
  },

  async exportTaanPdfToFile(
    taan: { notation?: string | null; startingMatra: number; textNote?: string | null },
    raagName: string,
    parentTitle: string,
    taal: string
  ): Promise<boolean> {
    const bytes = await buildTaanPdf(taan, raagName, parentTitle, taal)
    return savePdf(bytes, `${raagName} - ${parentTitle}.pdf`)
  },
}