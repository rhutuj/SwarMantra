import { invoke } from '@tauri-apps/api/core'

export interface Bandish {
  id: string
  raagId: string
  title: string
  taal?: string | null
  bpm?: number | null
  laya?: string | null
  composer?: string | null
  lyrics?: string | null
  asthayi?: string | null
  antara?: string | null
  notes?: string | null
  startingBeat: number
  createdAt: Date
  updatedAt: Date
}

export interface BandishInput {
  title: string
  taal?: string
  bpm?: number | null
  laya?: string
  composer?: string
  lyrics?: string
  asthayi?: string
  antara?: string
  notes?: string
  startingBeat?: number
}

type BandishRow = Omit<Bandish, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

const mapDates = (row: BandishRow): Bandish => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export const bandishService = {
  async getBandishesByRaagId(raagId: string): Promise<Bandish[]> {
    const rows = await invoke<BandishRow[]>('list_bandishes_by_raag', { raagId })
    return rows.map(mapDates)
  },

  async getBandishById(id: string): Promise<Bandish | null> {
    const row = await invoke<BandishRow | null>('get_bandish', { id })
    return row ? mapDates(row) : null
  },

  async createBandish(raagId: string, data: BandishInput): Promise<Bandish> {
    const row = await invoke<BandishRow>('create_bandish', { raagId, input: data })
    return mapDates(row)
  },

  async updateBandish(id: string, data: BandishInput): Promise<Bandish> {
    const row = await invoke<BandishRow>('update_bandish', { id, input: data })
    return mapDates(row)
  },

  async deleteBandish(id: string): Promise<void> {
    await invoke<void>('delete_bandish', { id })
  },
}
