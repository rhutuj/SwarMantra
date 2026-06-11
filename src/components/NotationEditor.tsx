import { ChangeEvent } from 'react'

interface NotationEditorProps {
  id?: string
  name?: string
  label?: string
  description?: string
  value?: string
  placeholder?: string
  rows?: number
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
}

export default function NotationEditor({
  id,
  name,
  label = 'Notation',
  description,
  value,
  placeholder,
  rows = 6,
  onChange,
}: NotationEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
      />
    </div>
  )
}
