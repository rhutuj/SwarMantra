import { FormEvent, useState } from 'react'
import { Bandish, BandishInput } from '../services/bandishService'

interface BandishFormProps {
  initialData?: Bandish
  onSubmit: (data: BandishInput) => void
  onCancel: () => void
}

export default function BandishForm({ initialData, onSubmit, onCancel }: BandishFormProps) {
  const [formData, setFormData] = useState<BandishInput>({
    title: initialData?.title || '',
    taal: initialData?.taal || '',
    laya: initialData?.laya || '',
    composer: initialData?.composer || '',
    lyrics: initialData?.lyrics || '',
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
      alert('Bandish title is required')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
          Bandish Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Bandish in Teentaal"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div>
          <label htmlFor="laya" className="block text-sm font-medium text-slate-700">
            Laya (Speed)
          </label>
          <input
            type="text"
            id="laya"
            name="laya"
            value={formData.laya}
            onChange={handleChange}
            placeholder="e.g., Vilambith, Madhya"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="composer" className="block text-sm font-medium text-slate-700">
          Composer
        </label>
        <input
          type="text"
          id="composer"
          name="composer"
          value={formData.composer}
          onChange={handleChange}
          placeholder="Composer name"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="lyrics" className="block text-sm font-medium text-slate-700">
          Lyrics
        </label>
        <textarea
          id="lyrics"
          name="lyrics"
          value={formData.lyrics}
          onChange={handleChange}
          placeholder="Bandish lyrics"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="notation" className="block text-sm font-medium text-slate-700">
          Notation
        </label>
        <textarea
          id="notation"
          name="notation"
          value={formData.notation}
          onChange={handleChange}
          placeholder="Sargam notation"
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

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
          {initialData ? 'Update Bandish' : 'Create Bandish'}
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
