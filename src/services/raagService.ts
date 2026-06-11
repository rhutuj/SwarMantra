// Data types for Raag operations
export interface Raag {
  id: string
  name: string
  thaat?: string
  aaroh?: string
  avroh?: string
  pakad?: string
  notes?: string
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

// Mock data service (will be replaced with Prisma backend)
export const raagService = {
  // In V1, this uses in-memory storage via Zustand
  // Future versions will use Tauri commands + Prisma backend
  
  async getAllRaags(): Promise<Raag[]> {
    // Placeholder - will be implemented via Zustand store
    return []
  },

  async getRaagById(id: string): Promise<Raag | null> {
    // Placeholder - will be implemented via Zustand store
    return null
  },

  async createRaag(data: RaagInput): Promise<Raag> {
    // Placeholder - will be implemented via Zustand store
    const now = new Date()
    return {
      id: Math.random().toString(36).slice(2),
      ...data,
      createdAt: now,
      updatedAt: now,
    }
  },

  async updateRaag(id: string, data: Partial<RaagInput>): Promise<Raag> {
    // Placeholder - will be implemented via Zustand store
    const now = new Date()
    return {
      id,
      name: data.name || '',
      createdAt: now,
      updatedAt: now,
    }
  },

  async deleteRaag(id: string): Promise<void> {
    // Placeholder - will be implemented via Zustand store
  },
}
