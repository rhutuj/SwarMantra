import { describe, it, expect } from 'vitest'
import { swarService } from '../swarService'

describe('swarService', () => {
  it('should have swarService object defined with all methods', () => {
    expect(swarService).toBeDefined()
    expect(typeof swarService.exportRaag).toBe('function')
    expect(typeof swarService.exportRaagToFile).toBe('function')
    expect(typeof swarService.importSwar).toBe('function')
    expect(typeof swarService.exportSargam).toBe('function')
    expect(typeof swarService.exportSargamToFile).toBe('function')
    expect(typeof swarService.exportBandish).toBe('function')
    expect(typeof swarService.exportBandishToFile).toBe('function')
    expect(typeof swarService.exportTaan).toBe('function')
    expect(typeof swarService.exportTaanToFile).toBe('function')
    expect(typeof swarService.exportLibrary).toBe('function')
    expect(typeof swarService.exportLibraryToFile).toBe('function')
  })
})
