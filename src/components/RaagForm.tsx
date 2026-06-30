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
    vadi: initialData?.vadi || '',
    samvadi: initialData?.samvadi || '',
    komalSur: initialData?.komalSur || '',
    tivraSur: initialData?.tivraSur || '',
    jati: initialData?.jati || '',
    notes: initialData?.notes || '',
  })

  const handleChange = (e: FormEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        <div>
          <label htmlFor="vadi" className="block text-sm font-medium text-slate-700">
            Vadi
          </label>
          <input
            type="text"
            id="vadi"
            name="vadi"
            value={formData.vadi}
            onChange={handleChange}
            placeholder="e.g., Ga"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="samvadi" className="block text-sm font-medium text-slate-700">
            Samvadi
          </label>
          <input
            type="text"
            id="samvadi"
            name="samvadi"
            value={formData.samvadi}
            onChange={handleChange}
            placeholder="e.g., Ni"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label htmlFor="jati" className="block text-sm font-medium text-slate-700">
            Jati
          </label>
          <select
            id="jati"
            name="jati"
            value={formData.jati}
            onChange={handleChange}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select Jati (optional)</option>
            <option value="Audav-Audav">Audav-Audav</option>
            <option value="Audav-Shadav">Audav-Shadav</option>
            <option value="Audav-Sampurna">Audav-Sampurna</option>
            <option value="Shadav-Audav">Shadav-Audav</option>
            <option value="Shadav-Shadav">Shadav-Shadav</option>
            <option value="Shadav-Sampurna">Shadav-Sampurna</option>
            <option value="Sampurna-Audav">Sampurna-Audav</option>
            <option value="Sampurna-Shadav">Sampurna-Shadav</option>
            <option value="Sampurna-Sampurna">Sampurna-Sampurna</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="komalSur" className="block text-sm font-medium text-slate-700">
            Komal Sur
          </label>
          <input
            type="text"
            id="komalSur"
            name="komalSur"
            value={formData.komalSur}
            onChange={handleChange}
            placeholder="e.g., Re, Ga, Dha, Ni"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
        <div>
          <label htmlFor="tivraSur" className="block text-sm font-medium text-slate-700">
            Tivra Sur
          </label>
          <input
            type="text"
            id="tivraSur"
            name="tivraSur"
            value={formData.tivraSur}
            onChange={handleChange}
            placeholder="e.g., Ma"
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
