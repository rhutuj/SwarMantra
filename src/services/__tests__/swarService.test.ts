import { describe, it, expect } from 'vitest'
import { swarService } from '../swarService'

describe('swarService', () => {
  it('should have swarService object defined', () => {
    expect(swarService).toBeDefined()
    expect(typeof swarService.exportRaag).toBe('function')
    expect(typeof swarService.exportRaagToFile).toBe('function')
    expect(typeof swarService.importSwar).toBe('function')
  })
})
