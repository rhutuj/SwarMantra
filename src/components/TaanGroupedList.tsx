import { useState } from 'react'
import { Taan } from '../services/taanService'

interface TaanGroupedListProps {
  taans: Taan[]
  editingTaanNotationId: string | null
  taanDraftNotation: string
  onEditNotation: (taan: Taan) => void
  onCancelNotation: () => void
  onSaveNotation: (taan: Taan) => void
  onDeleteTaan: (id: string) => void
  onDraftNotationChange: (val: string) => void
}

export default function TaanGroupedList({
  taans,
  editingTaanNotationId,
  taanDraftNotation,
  onEditNotation,
  onCancelNotation,
  onSaveNotation,
  onDeleteTaan,
  onDraftNotationChange,
}: TaanGroupedListProps) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const groups = new Map<string, Taan[]>()
  for (const taan of taans) {
    const key = `${taan.startingMatra}|${taan.textNote || ''}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(taan)
  }

  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className="space-y-2">
      {sortedGroups.map(([key, groupTaans]) => {
        const [matra, textNote] = key.split('|')
        const isOpen = openGroups.has(key)

        return (
          <div key={key} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => toggleGroup(key)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-800">
                Matra {matra}{textNote ? ` — ${textNote}` : ''}
                <span className="ml-2 text-sm font-normal text-slate-500">({groupTaans.length})</span>
              </span>
              <svg
                className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {groupTaans.map((taan) => {
                  const isEditingThisTaan = editingTaanNotationId === taan.id
                  return (
                    <div key={taan.id} className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditNotation(taan)}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          {isEditingThisTaan ? 'Editing...' : 'Edit'}
                        </button>
                        <button
                          onClick={() => onDeleteTaan(taan.id)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                      {taan.notation && (
                        <div className="mt-2">
                          {isEditingThisTaan ? (
                            <div className="mt-1">
                              <textarea
                                value={taanDraftNotation}
                                onChange={(e) => onDraftNotationChange(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                              />
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => onSaveNotation(taan)}
                                  className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={onCancelNotation}
                                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <pre className="mt-1 whitespace-pre-wrap font-mono text-sm text-slate-700 bg-slate-50 rounded p-2">
                              {taan.notation}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
