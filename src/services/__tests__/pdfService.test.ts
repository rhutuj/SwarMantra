import { describe, it, expect } from 'vitest'
import { pdfService } from '../pdfService'

describe('pdfService', () => {
  it('should have pdfService object defined with all methods', () => {
    expect(pdfService).toBeDefined()
    expect(typeof pdfService.exportRaagPdf).toBe('function')
    expect(typeof pdfService.exportRaagPdfToFile).toBe('function')
    expect(typeof pdfService.exportSargamPdf).toBe('function')
    expect(typeof pdfService.exportSargamPdfToFile).toBe('function')
    expect(typeof pdfService.exportBandishPdf).toBe('function')
    expect(typeof pdfService.exportBandishPdfToFile).toBe('function')
    expect(typeof pdfService.exportTaanPdf).toBe('function')
    expect(typeof pdfService.exportTaanPdfToFile).toBe('function')
  })
})
