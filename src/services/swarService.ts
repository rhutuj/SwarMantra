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
}
