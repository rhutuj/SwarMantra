import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'

export const swarService = {
  async exportRaag(raagId: string): Promise<string> {
    return invoke<string>('export_raag_swar', { raagId })
  },

  async exportRaagToFile(raagId: string, defaultName: string): Promise<boolean> {
    const json = await this.exportRaag(raagId)
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'SWAR files', extensions: ['swar'] }, { name: 'JSON files', extensions: ['json'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(new TextEncoder().encode(json)) })
    return true
  },

  async importSwar(json: string): Promise<string[]> {
    const rows = await invoke<Array<{ id: string }>>('import_swar', { json })
    return rows.map((r) => r.id)
  },

  async exportSargam(sargamId: string): Promise<string> {
    return invoke<string>('export_sargam_swar', { sargamId })
  },

  async exportSargamToFile(sargamId: string, defaultName: string): Promise<boolean> {
    const json = await this.exportSargam(sargamId)
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'SWAR files', extensions: ['swar'] }, { name: 'JSON files', extensions: ['json'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(new TextEncoder().encode(json)) })
    return true
  },

  async exportBandish(bandishId: string): Promise<string> {
    return invoke<string>('export_bandish_swar', { bandishId })
  },

  async exportBandishToFile(bandishId: string, defaultName: string): Promise<boolean> {
    const json = await this.exportBandish(bandishId)
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'SWAR files', extensions: ['swar'] }, { name: 'JSON files', extensions: ['json'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(new TextEncoder().encode(json)) })
    return true
  },

  async exportTaan(taanId: string): Promise<string> {
    return invoke<string>('export_taan_swar', { taanId })
  },

  async exportTaanToFile(taanId: string, defaultName: string): Promise<boolean> {
    const json = await this.exportTaan(taanId)
    const filePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'SWAR files', extensions: ['swar'] }, { name: 'JSON files', extensions: ['json'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(new TextEncoder().encode(json)) })
    return true
  },

  async exportLibrary(): Promise<string> {
    return invoke<string>('export_library_swar')
  },

  async exportLibraryToFile(): Promise<boolean> {
    const json = await this.exportLibrary()
    const filePath = await save({
      defaultPath: 'SwarMantra Backup.swarpack',
      filters: [{ name: 'SWAR Pack', extensions: ['swarpack'] }, { name: 'JSON files', extensions: ['json'] }],
    })
    if (!filePath) return false
    await invoke('save_file', { path: filePath, content: Array.from(new TextEncoder().encode(json)) })
    return true
  },
}
