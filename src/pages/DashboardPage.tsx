import { Link } from 'react-router-dom'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { Raag, RaagInput, raagService } from '../services/raagService'
import Modal from '../components/Modal'
import RaagForm from '../components/RaagForm'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { raags, setRaags, addRaag, updateRaag, deleteRaag } = useAppStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRaag, setEditingRaag] = useState<Raag | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Load mock data on first render
    if (raags.length === 0) {
      loadRaags()
    }
  }, [])

  const loadRaags = async () => {
    try {
      // For V1, use mock data until Tauri commands are set up
      const mockRaags: Raag[] = [
        {
          id: '1',
          name: 'Yaman',
          thaat: 'Kalyan',
          aaroh: 'S R G M P D N S',
          avroh: 'S N D P M G R S',
          pakad: 'MGMGD PDSNS',
          notes: 'Descending from middle octave is rare',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Bhairav',
          thaat: 'Bhairav',
          aaroh: 'S r G m P d N S',
          avroh: 'S N d P m G r S',
          pakad: 'r G M P D',
          notes: 'Morning raga, serious mood',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]
      setRaags(mockRaags)
    } catch (error) {
      console.error('Failed to load Raags:', error)
    }
  }

  const handleCreateRaag = async (data: RaagInput) => {
    try {
      const newRaag: Raag = await raagService.createRaag(data)
      addRaag(newRaag)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create Raag:', error)
    }
  }

  const handleUpdateRaag = async (id: string, data: RaagInput) => {
    try {
      await raagService.updateRaag(id, data)
      updateRaag(id, data)
      setEditingRaag(null)
    } catch (error) {
      console.error('Failed to update Raag:', error)
    }
  }

  const handleDeleteRaag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Raag?')) return

    try {
      await raagService.deleteRaag(id)
      deleteRaag(id)
    } catch (error) {
      console.error('Failed to delete Raag:', error)
    }
  }

  const filteredRaags = raags.filter((raag) =>
    raag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    raag.thaat?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Raags</h1>
          <p className="text-slate-600">Create and manage your Raags, Sargams, Bandishes, and Taans.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          + New Raag
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search Raags by name or thaat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </div>

      {/* Raag List */}
      {filteredRaags.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">
            {raags.length === 0 ? 'No Raags yet. Create your first Raag to get started.' : 'No Raags match your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRaags.map((raag) => (
            <div key={raag.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-slate-900">{raag.name}</h2>
              {raag.thaat && <p className="text-sm text-slate-600">Thaat: {raag.thaat}</p>}
              {raag.notes && <p className="mt-2 text-sm text-slate-500">{raag.notes}</p>}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/raag/${raag.id}`)}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View
                </button>
                <button
                  onClick={() => setEditingRaag(raag)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRaag(raag.id)}
                  className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} title="Create New Raag" onClose={() => setIsCreateModalOpen(false)}>
        <RaagForm onSubmit={handleCreateRaag} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingRaag}
        title="Edit Raag"
        onClose={() => setEditingRaag(null)}
      >
        {editingRaag && (
          <RaagForm
            initialData={editingRaag}
            onSubmit={(data) => handleUpdateRaag(editingRaag.id, data)}
            onCancel={() => setEditingRaag(null)}
          />
        )}
      </Modal>
    </div>
  )
}
