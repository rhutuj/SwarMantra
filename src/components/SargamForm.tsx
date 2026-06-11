import { FormEvent, useState } from 'react'
import { Sargam, SargamInput } from '../services/sargamService'
import NotationEditor from './NotationEditor'

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
  })

  const handleChange = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.currentTarget
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

      <div>
        <label htmlFor="taal" className="block text-sm font-medium text-slate-700">
          Taal
        </label>
        <input
          type="text"
          id="taal"
          name="taal"
          value={formData.taal}
          onChange={handleChange}
          placeholder="e.g., Teentaal"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <NotationEditor
        id="notation"
        name="notation"
        value={formData.notation}
        onChange={handleChange}
        placeholder="Sargam notation"
        description="Use swar notation here"
        rows={4}
      />

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
