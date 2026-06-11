import { FormEvent, useState } from 'react'
import { Raag, RaagInput } from '../services/raagService'

interface RaagFormProps {
  initialData?: Raag
  onSubmit: (data: RaagInput) => void
  onCancel: () => void
}

export default function RaagForm({ initialData, onSubmit, onCancel }: RaagFormProps) {
  const [formData, setFormData] = useState<RaagInput>({
    name: initialData?.name || '',
    thaat: initialData?.thaat || '',
    aaroh: initialData?.aaroh || '',
    avroh: initialData?.avroh || '',
    pakad: initialData?.pakad || '',
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
    if (!formData.name.trim()) {
      alert('Raag name is required')
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Raag Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Yaman"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="thaat" className="block text-sm font-medium text-slate-700">
            Thaat
          </label>
          <input
            type="text"
            id="thaat"
            name="thaat"
            value={formData.thaat}
            onChange={handleChange}
            placeholder="e.g., Kalyan"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="aaroh" className="block text-sm font-medium text-slate-700">
          Aaroh (Ascending)
        </label>
        <textarea
          id="aaroh"
          name="aaroh"
          value={formData.aaroh}
          onChange={handleChange}
          placeholder="Ascending notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="avroh" className="block text-sm font-medium text-slate-700">
          Avroh (Descending)
        </label>
        <textarea
          id="avroh"
          name="avroh"
          value={formData.avroh}
          onChange={handleChange}
          placeholder="Descending notes"
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div>
        <label htmlFor="pakad" className="block text-sm font-medium text-slate-700">
          Pakad (Characteristic)
        </label>
        <textarea
          id="pakad"
          name="pakad"
          value={formData.pakad}
          onChange={handleChange}
          placeholder="Characteristic phrase"
          rows={2}
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
          placeholder="Additional notes about this Raag"
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Raag' : 'Create Raag'}
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
