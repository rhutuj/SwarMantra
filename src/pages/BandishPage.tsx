import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { taanService, TaanInput } from '../services/taanService'
import Modal from '../components/Modal'
import TaanForm from '../components/TaanForm'

export default function BandishPage() {
  const { bandishId } = useParams<{ bandishId: string }>()
  const navigate = useNavigate()
  const { bandishes, taans, addTaan, deleteTaan } = useAppStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTaan, setEditingTaan] = useState<any>(null)

  const bandish = bandishes.find((b) => b.id === bandishId)
  const bandishTaans = taans.filter((t) => t.bandishId === bandishId).sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!bandish) {
      navigate('/')
    }
  }, [bandish, navigate])

  const handleCreateTaan = async (data: TaanInput) => {
    if (!bandishId) return
    try {
      const newTaan = await taanService.createTaan(null, bandishId, data)
      addTaan(newTaan)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create Taan:', error)
    }
  }

  const handleDeleteTaan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Taan?')) return
    try {
      await taanService.deleteTaan(id)
      deleteTaan(id)
    } catch (error) {
      console.error('Failed to delete Taan:', error)
    }
  }

  if (!bandish) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to={`/raag/${bandish.raagId}`} className="text-sm text-slate-600 underline hover:text-slate-900">
          ← Back to Raag
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{bandish.title}</h1>
      </div>

      {/* Bandish Information */}
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Bandish Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {bandish.composer && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Composer</h3>
                <p className="mt-2 text-slate-700">{bandish.composer}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-500">Taal</h3>
              <p className="mt-2 text-slate-700">{bandish.taal || '—'}</p>
            </div>
            {bandish.laya && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Laya (Speed)</h3>
                <p className="mt-2 text-slate-700">{bandish.laya}</p>
              </div>
            )}
            {bandish.notes && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Notes</h3>
                <p className="mt-2 text-slate-700">{bandish.notes}</p>
              </div>
            )}
          </div>
          {bandish.lyrics && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Lyrics</h3>
              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap break-words">
                {bandish.lyrics}
              </div>
            </div>
          )}
          {bandish.notation && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Notation</h3>
              <div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700 whitespace-pre-wrap break-words">
                {bandish.notation}
              </div>
            </div>
          )}
        </section>

        {/* Taans Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Taans ({bandishTaans.length})</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              + Add Taan
            </button>
          </div>

          {bandishTaans.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No Taans yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bandishTaans.map((taan) => (
                <div key={taan.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{taan.title}</h3>
                      <p className="text-sm text-slate-600">Order: {taan.order}</p>
                      {taan.taal && <p className="text-sm text-slate-600">Taal: {taan.taal}</p>}
                    </div>
                  </div>
                  {taan.notation && (
                    <div className="mb-3 rounded-lg bg-slate-50 p-2 font-mono text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {taan.notation}
                    </div>
                  )}
                  {taan.notes && <p className="mb-3 text-sm text-slate-600">{taan.notes}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingTaan(taan)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTaan(taan.id)}
                      className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Create Taan Modal */}
      <Modal isOpen={isCreateModalOpen} title="Create New Taan" onClose={() => setIsCreateModalOpen(false)}>
        <TaanForm onSubmit={handleCreateTaan} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Edit Taan Modal */}
      <Modal isOpen={!!editingTaan} title="Edit Taan" onClose={() => setEditingTaan(null)}>
        {editingTaan && (
          <TaanForm
            initialData={editingTaan}
            onSubmit={(data) => {
              // Update logic will be added when Taan update service is implemented
              setEditingTaan(null)
            }}
            onCancel={() => setEditingTaan(null)}
          />
        )}
      </Modal>
    </div>
  )
}
