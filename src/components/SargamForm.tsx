import { ChangeEvent, FormEvent, useState } from 'react'
import { Sargam, SargamInput } from '../services/sargamService'
import NotationEditor from './NotationEditor'
import { TAALS, getTaalConfig } from '../utils/taalConfig'

interface SargamFormProps {
  initialData?: Sargam
  onSubmit: (data: SargamInput) => void
  onCancel: () => void
}

export default function SargamForm({ initialData, onSubmit, onCancel }: SargamFormProps) {
  const [formData, setFormData] = useState<SargamInput>({
    title: initialData?.title || '',
    taal: initialData?.taal || '',
    notation: initialData?.notation || '',
    notes: initialData?.notes || '',
    startingBeat: initialData?.startingBeat || 1,
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'startingBeat' ? parseInt(value) || 1 : value,
    }))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Sargam title is required')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Sargam Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Yaman Alap"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="taal" className="block text-sm font-medium text-slate-700">
            Taal
          </label>
          <select
            id="taal"
            name="taal"
            value={formData.taal}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select Taal (optional)</option>
            {Object.entries(TAALS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name} ({config.totalMatras} matras)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startingBeat" className="block text-sm font-medium text-slate-700">
            Starting Beat
          </label>
          <input
            type="number"
            id="startingBeat"
            name="startingBeat"
            value={formData.startingBeat}
            onChange={handleChange}
            min={1}
            max={getTaalConfig(formData.taal)?.totalMatras ?? 16}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      {formData.taal && (
        <NotationEditor
          id="notation"
          name="notation"
          taal={formData.taal}
          startingBeat={formData.startingBeat || 1}
          value={formData.notation}
          onChange={(val) => setFormData((prev) => ({ ...prev, notation: val }))}
          description="Use swar notation here"
        />
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Sargam' : 'Create Sargam'}
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
