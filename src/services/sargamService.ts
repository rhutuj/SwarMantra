export interface Sargam {
  id: string
  raagId: string
  title: string
  taal?: string
  notation?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface SargamInput {
  title: string
  taal?: string
  notation?: string
  notes?: string
}

export const sargamService = {
  async getSargamsByRaagId(raagId: string): Promise<Sargam[]> {
    // Placeholder - will be replaced with Tauri commands
    return []
  },

  async createSargam(raagId: string, data: SargamInput): Promise<Sargam> {
    // Placeholder - will be replaced with Tauri commands
    const now = new Date()
    return {
      id: Math.random().toString(36).slice(2),
      raagId,
      ...data,
      createdAt: now,
      updatedAt: now,
    }
  },

  async updateSargam(id: string, data: Partial<SargamInput>): Promise<Sargam> {
    // Placeholder - will be replaced with Tauri commands
    const now = new Date()
    return {
      id,
      raagId: '',
      title: data.title || '',
      createdAt: now,
      updatedAt: now,
    }
  },

  async deleteSargam(id: string): Promise<void> {
    // Placeholder - will be replaced with Tauri commands
  },
}
