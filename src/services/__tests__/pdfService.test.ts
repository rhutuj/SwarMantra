import { describe, it, expect } from 'vitest'
import { pdfService } from '../pdfService'

describe('pdfService', () => {
  it('should have pdfService object defined', () => {
    expect(pdfService).toBeDefined()
    expect(typeof pdfService.exportRaagPdf).toBe('function')
    expect(typeof pdfService.exportRaagPdfToFile).toBe('function')
  })
})
