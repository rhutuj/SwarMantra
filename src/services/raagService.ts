import { invoke } from '@tauri-apps/api/core'

export interface Raag {
  id: string
  name: string
  thaat?: string | null
  aaroh?: string | null
  avroh?: string | null
  pakad?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RaagInput {
  name: string
  thaat?: string
  aaroh?: string
  avroh?: string
  pakad?: string
  notes?: string
}

type RaagRow = Omit<Raag, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

const mapDates = (row: RaagRow): Raag => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export const raagService = {
  async getAllRaags(): Promise<Raag[]> {
    const rows = await invoke<RaagRow[]>('list_raags')
    return rows.map(mapDates)
  },

  async getRaagById(id: string): Promise<Raag | null> {
    const row = await invoke<RaagRow | null>('get_raag', { id })
    return row ? mapDates(row) : null
  },

  async createRaag(data: RaagInput): Promise<Raag> {
    const row = await invoke<RaagRow>('create_raag', { input: data })
    return mapDates(row)
  },

  async updateRaag(id: string, data: RaagInput): Promise<Raag> {
    const row = await invoke<RaagRow>('update_raag', { id, input: data })
    return mapDates(row)
  },

  async deleteRaag(id: string): Promise<void> {
    await invoke<void>('delete_raag', { id })
  },
}
