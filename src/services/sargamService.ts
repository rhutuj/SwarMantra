import { invoke } from '@tauri-apps/api/core'

export interface Sargam {
  id: string
  raagId: string
  title: string
  taal?: string | null
  bpm?: number | null
  laya?: string | null
  asthayi?: string | null
  antara?: string | null
  notes?: string | null
  startingBeat: number
  createdAt: Date
  updatedAt: Date
}

export interface SargamInput {
  title: string
  taal?: string
  bpm?: number | null
  laya?: string
  asthayi?: string
  antara?: string
  notes?: string
  startingBeat?: number
}

type SargamRow = Omit<Sargam, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

const mapDates = (row: SargamRow): Sargam => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export const sargamService = {
  async getSargamsByRaagId(raagId: string): Promise<Sargam[]> {
    const rows = await invoke<SargamRow[]>('list_sargams_by_raag', { raagId })
    return rows.map(mapDates)
  },

  async getSargamById(id: string): Promise<Sargam | null> {
    const row = await invoke<SargamRow | null>('get_sargam', { id })
    return row ? mapDates(row) : null
  },

  async createSargam(raagId: string, data: SargamInput): Promise<Sargam> {
    const row = await invoke<SargamRow>('create_sargam', { raagId, input: data })
    return mapDates(row)
  },

  async updateSargam(id: string, data: SargamInput): Promise<Sargam> {
    const row = await invoke<SargamRow>('update_sargam', { id, input: data })
    return mapDates(row)
  },

  async deleteSargam(id: string): Promise<void> {
    await invoke<void>('delete_sargam', { id })
  },
}
