import { create } from 'zustand'
import { Raag, RaagInput } from '../services/raagService'
import { Sargam, SargamInput } from '../services/sargamService'
import { Bandish, BandishInput } from '../services/bandishService'
import { Taan, TaanInput } from '../services/taanService'

interface AppState {
  // Selection state
  selectedRaagId: string | null
  selectedSargamId: string | null
  selectedBandishId: string | null
  selectedTaanId: string | null
  setSelectedRaagId: (id: string | null) => void
  setSelectedSargamId: (id: string | null) => void
  setSelectedBandishId: (id: string | null) => void
  setSelectedTaanId: (id: string | null) => void

  // Raag data state
  raags: Raag[]
  isLoadingRaags: boolean
  raagError: string | null
  setRaags: (raags: Raag[]) => void
  addRaag: (raag: Raag) => void
  updateRaag: (id: string, data: Partial<RaagInput>) => void
  deleteRaag: (id: string) => void
  setIsLoadingRaags: (loading: boolean) => void
  setRaagError: (error: string | null) => void

  // Sargam data state
  sargams: Sargam[]
  isLoadingSargams: boolean
  sargamError: string | null
  setSargams: (sargams: Sargam[]) => void
  addSargam: (sargam: Sargam) => void
  updateSargam: (id: string, data: Partial<SargamInput>) => void
  deleteSargam: (id: string) => void
  setIsLoadingSargams: (loading: boolean) => void
  setSargamError: (error: string | null) => void

  // Bandish data state
  bandishes: Bandish[]
  isLoadingBandishes: boolean
  bandishError: string | null
  setBandishes: (bandishes: Bandish[]) => void
  addBandish: (bandish: Bandish) => void
  updateBandish: (id: string, data: Partial<BandishInput>) => void
  deleteBandish: (id: string) => void
  setIsLoadingBandishes: (loading: boolean) => void
  setBandishError: (error: string | null) => void

  // Taan data state
  taans: Taan[]
  isLoadingTaans: boolean
  taanError: string | null
  setTaans: (taans: Taan[]) => void
  addTaan: (taan: Taan) => void
  updateTaan: (id: string, data: Partial<TaanInput>) => void
  deleteTaan: (id: string) => void
  setIsLoadingTaans: (loading: boolean) => void
  setTaanError: (error: string | null) => void
}

const useAppStore = create<AppState>((set) => ({
  // Selection state
  selectedRaagId: null,
  selectedSargamId: null,
  selectedBandishId: null,
  selectedTaanId: null,
  setSelectedRaagId: (id) => set({ selectedRaagId: id }),
  setSelectedSargamId: (id) => set({ selectedSargamId: id }),
  setSelectedBandishId: (id) => set({ selectedBandishId: id }),
  setSelectedTaanId: (id) => set({ selectedTaanId: id }),

  // Raag data state
  raags: [],
  isLoadingRaags: false,
  raagError: null,
  setRaags: (raags) => set({ raags }),
  addRaag: (raag) =>
    set((state) => ({
      raags: [raag, ...state.raags],
    })),
  updateRaag: (id, data) =>
    set((state) => ({
      raags: state.raags.map((raag) =>
        raag.id === id
          ? {
              ...raag,
              ...data,
              updatedAt: new Date(),
            }
          : raag
      ),
    })),
  deleteRaag: (id) =>
    set((state) => ({
      raags: state.raags.filter((raag) => raag.id !== id),
    })),
  setIsLoadingRaags: (loading) => set({ isLoadingRaags: loading }),
  setRaagError: (error) => set({ raagError: error }),

  // Sargam data state
  sargams: [],
  isLoadingSargams: false,
  sargamError: null,
  setSargams: (sargams) => set({ sargams }),
  addSargam: (sargam) =>
    set((state) => ({
      sargams: [sargam, ...state.sargams],
    })),
  updateSargam: (id, data) =>
    set((state) => ({
      sargams: state.sargams.map((sargam) =>
        sargam.id === id
          ? {
              ...sargam,
              ...data,
              updatedAt: new Date(),
            }
          : sargam
      ),
    })),
  deleteSargam: (id) =>
    set((state) => ({
      sargams: state.sargams.filter((sargam) => sargam.id !== id),
    })),
  setIsLoadingSargams: (loading) => set({ isLoadingSargams: loading }),
  setSargamError: (error) => set({ sargamError: error }),

  // Bandish data state
  bandishes: [],
  isLoadingBandishes: false,
  bandishError: null,
  setBandishes: (bandishes) => set({ bandishes }),
  addBandish: (bandish) =>
    set((state) => ({
      bandishes: [bandish, ...state.bandishes],
    })),
  updateBandish: (id, data) =>
    set((state) => ({
      bandishes: state.bandishes.map((bandish) =>
        bandish.id === id
          ? {
              ...bandish,
              ...data,
              updatedAt: new Date(),
            }
          : bandish
      ),
    })),
  deleteBandish: (id) =>
    set((state) => ({
      bandishes: state.bandishes.filter((bandish) => bandish.id !== id),
    })),
  setIsLoadingBandishes: (loading) => set({ isLoadingBandishes: loading }),
  setBandishError: (error) => set({ bandishError: error }),

  // Taan data state
  taans: [],
  isLoadingTaans: false,
  taanError: null,
  setTaans: (taans) => set({ taans }),
  addTaan: (taan) =>
    set((state) => ({
      taans: [taan, ...state.taans],
    })),
  updateTaan: (id, data) =>
    set((state) => ({
      taans: state.taans.map((taan) =>
        taan.id === id
          ? {
              ...taan,
              ...data,
              updatedAt: new Date(),
            }
          : taan
      ),
    })),
  deleteTaan: (id) =>
    set((state) => ({
      taans: state.taans.filter((taan) => taan.id !== id),
    })),
  setIsLoadingTaans: (loading) => set({ isLoadingTaans: loading }),
  setTaanError: (error) => set({ taanError: error }),
}))

export default useAppStore
