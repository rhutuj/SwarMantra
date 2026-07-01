import { ChangeEvent, FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Taan, TaanInput } from '../services/taanService'
import { getTaalConfig } from '../utils/taalConfig'
import {
  isSwarLetter,
  isModifierKey,
  isValidCombination,
  getUnicodeSwar,
  beep,
  flashElement,
} from '../utils/swarInput'

interface TaanFormProps {
  taal?: string
  initialData?: Taan
  onSubmit: (data: TaanInput) => void
  onCancel: () => void
}

function getMatraOptions(taal?: string): number[] {
  if (!taal) return []
  const config = getTaalConfig(taal)
  if (!config) return []
  return Array.from({ length: config.totalMatras }, (_, i) => i + 1)
}

export default function TaanForm({ taal, initialData, onSubmit, onCancel }: TaanFormProps) {
  const matraOptions = getMatraOptions(taal)
  const notationRef = useRef<HTMLTextAreaElement>(null)
  const pendingModsRef = useRef<Set<string>>(new Set())
  const modTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearModTimeout = useCallback(() => {
    if (modTimeoutRef.current) {
      clearTimeout(modTimeoutRef.current)
      modTimeoutRef.current = null
    }
  }, [])

  const resetModTimeout = useCallback(() => {
    clearModTimeout()
    modTimeoutRef.current = setTimeout(() => {
      pendingModsRef.current = new Set()
    }, 800)
  }, [clearModTimeout])

  const [formData, setFormData] = useState<TaanInput>({
    notation: initialData?.notation || '',
    startingMatra: initialData?.startingMatra || 1,
    textNote: initialData?.textNote ?? '',
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'startingMatra' ? parseInt(value) || 1 : value,
    }))
  }

  const handleNotationKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const key = e.key.toLowerCase()
    const textarea = notationRef.current
    if (!textarea) return

    if (isModifierKey(key)) {
      e.preventDefault()
      const currentMods = pendingModsRef.current
      if (currentMods.has(key)) {
        beep()
        flashElement(textarea)
        pendingModsRef.current = new Set()
        clearModTimeout()
        return
      }
      if ((key === 'q' && currentMods.has('a')) || (key === 'a' && currentMods.has('q'))) {
        beep()
        flashElement(textarea)
        pendingModsRef.current = new Set()
        clearModTimeout()
        return
      }
      const newMods = new Set(currentMods)
      newMods.add(key)
      pendingModsRef.current = newMods
      resetModTimeout()
      return
    }

    if (isSwarLetter(key)) {
      e.preventDefault()
      const currentMods = pendingModsRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentValue = formData.notation || ''

      const validation = isValidCombination(key, currentMods)
      if (!validation.valid) {
        beep()
        flashElement(textarea)
      }

      const swar = validation.valid
        ? getUnicodeSwar(key, currentMods)
        : key.toUpperCase()

      const before = currentValue.slice(0, start)
      const after = currentValue.slice(end)
      const newValue = before + swar + after
      const newCursor = start + swar.length

      setFormData((prev) => ({ ...prev, notation: newValue }))
      requestAnimationFrame(() => {
        textarea.setSelectionRange(newCursor, newCursor)
      })

      pendingModsRef.current = new Set()
      clearModTimeout()
      return
    }

    if (pendingModsRef.current.size > 0) {
      pendingModsRef.current = new Set()
      clearModTimeout()
    }
  }, [formData.notation, clearModTimeout, resetModTimeout])

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      textNote: formData.textNote?.trim() || undefined,
    })
  }

  useEffect(() => {
    return () => clearModTimeout()
  }, [clearModTimeout])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="startingMatra" className="block text-sm font-medium text-slate-700">
            Starting Matra
          </label>
          <select
            id="startingMatra"
            name="startingMatra"
            value={formData.startingMatra}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            {matraOptions.map((matra) => (
              <option key={matra} value={matra}>
                {matra}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="textNote" className="block text-sm font-medium text-slate-700">
            Text Note
          </label>
          <input
            type="text"
            id="textNote"
            name="textNote"
            value={formData.textNote}
            onChange={handleChange}
            placeholder="e.g., Fast Alankars"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div>
        <textarea
          ref={notationRef}
          id="notation"
          name="notation"
          value={formData.notation}
          onChange={handleChange}
          onKeyDown={handleNotationKeyDown}
          placeholder="Enter taan notation (e.g., S r G M P d N S' or kR tM)"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
        />
        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
          <span>s=shudh q+swar=tar a+swar=mandra k+swar=komal t+swar=tivra</span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Taan' : 'Create Taan'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
