import { invoke } from '@tauri-apps/api/core'

export interface Taan {
  id: string
  taal?: string | null
  notation?: string | null
  startingMatra: number
  textNote?: string | null
  sargamId?: string | null
  bandishId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TaanInput {
  notation?: string
  startingMatra?: number
  textNote?: string
}

type TaanRow = Omit<Taan, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

const mapDates = (row: TaanRow): Taan => ({
  ...row,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export const taanService = {
  async getTaansBySargamId(sargamId: string): Promise<Taan[]> {
    const rows = await invoke<TaanRow[]>('list_taans_by_sargam', { sargamId })
    return rows.map(mapDates)
  },

  async getTaansByBandishId(bandishId: string): Promise<Taan[]> {
    const rows = await invoke<TaanRow[]>('list_taans_by_bandish', { bandishId })
    return rows.map(mapDates)
  },

  async getTaanById(id: string): Promise<Taan | null> {
    const row = await invoke<TaanRow | null>('get_taan', { id })
    return row ? mapDates(row) : null
  },

  async createTaan(sargamId: string | null, bandishId: string | null, data: TaanInput): Promise<Taan> {
    const row = await invoke<TaanRow>('create_taan', { sargamId, bandishId, input: data })
    return mapDates(row)
  },

  async updateTaan(id: string, data: TaanInput): Promise<Taan> {
    const row = await invoke<TaanRow>('update_taan', { id, input: data })
    return mapDates(row)
  },

  async deleteTaan(id: string): Promise<void> {
    await invoke<void>('delete_taan', { id })
  },
}
