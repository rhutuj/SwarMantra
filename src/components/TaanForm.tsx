import { ChangeEvent, FormEvent, useState } from 'react'
import { Taan, TaanInput } from '../services/taanService'
import { getTaalConfig } from '../utils/taalConfig'

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      textNote: formData.textNote?.trim() || undefined,
    })
  }

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
          id="notation"
          name="notation"
          value={formData.notation}
          onChange={handleChange}
          placeholder="Enter taan notation (plain text, e.g., S R G M P D N S')"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 font-mono"
        />
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
