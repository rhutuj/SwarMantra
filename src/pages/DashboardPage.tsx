import { Link } from 'react-router-dom'

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { Raag, RaagInput, raagService } from '../services/raagService'
import { swarService } from '../services/swarService'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import RaagForm from '../components/RaagForm'

interface SwarPreview {
  name: string
  sargams: number
  bandishes: number
  taans: number
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { raags, setRaags, addRaag, updateRaag, deleteRaag } = useAppStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRaag, setEditingRaag] = useState<Raag | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isExportingLibrary, setIsExportingLibrary] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [showDupeDialog, setShowDupeDialog] = useState(false)
  const [pendingImportJson, setPendingImportJson] = useState('')
  const [dupeNames, setDupeNames] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  useEffect(() => {
    if (raags.length === 0) {
      loadRaags()
    }
  }, [])

  const loadRaags = async () => {
    try {
      const savedRaags = await raagService.getAllRaags()
      setRaags(savedRaags)
    } catch (error) {
      addToast('Failed to load raags', 'error')
    }
  }

  const handleCreateRaag = async (data: RaagInput) => {
    try {
      const newRaag: Raag = await raagService.createRaag(data)
      addRaag(newRaag)
      setIsCreateModalOpen(false)
      addToast(`Raag "${newRaag.name}" created`, 'success')
    } catch (error) {
      addToast('Failed to create Raag', 'error')
    }
  }

  const handleUpdateRaag = async (id: string, data: RaagInput) => {
    try {
      const savedRaag = await raagService.updateRaag(id, data)
      updateRaag(id, savedRaag)
      setEditingRaag(null)
      addToast(`Raag "${savedRaag.name}" updated`, 'success')
    } catch (error) {
      addToast('Failed to update Raag', 'error')
    }
  }

  const handleDeleteRaag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Raag?')) return

    try {
      await raagService.deleteRaag(id)
      deleteRaag(id)
      addToast('Raag deleted', 'success')
    } catch (error) {
      addToast('Failed to delete Raag', 'error')
    }
  }

  const handleImportClick = () => {
    setShowImportConfirm(true)
  }

  const confirmImport = () => {
    setShowImportConfirm(false)
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let text = ''
    try {
      text = await file.text()
    } catch {
      addToast('Failed to read file', 'error')
      return
    }

    let parsed: { raags?: Array<{ name?: string; sargams?: unknown[]; bandishes?: unknown[]; taans?: unknown[] }> }
    try {
      parsed = JSON.parse(text)
    } catch {
      addToast('Invalid SWAR file format', 'error')
      return
    }

    const incomingRaags = parsed.raags || []
    if (incomingRaags.length === 0) {
      addToast('No raags found in file', 'error')
      return
    }

    const existingNames = new Set(raags.map((r) => r.name.toLowerCase()))
    const duplicates = incomingRaags
      .filter((r) => r.name && existingNames.has(r.name.toLowerCase()))
      .map((r) => r.name!)

    if (duplicates.length > 0) {
      setPendingImportJson(text)
      setDupeNames(duplicates)
      setShowDupeDialog(true)
      e.target.value = ''
      return
    }

    await doImport(text)
    e.target.value = ''
  }

  const doImport = async (json: string) => {
    setIsImporting(true)
    try {
      await swarService.importSwar(json)
      await loadRaags()
      const count = JSON.parse(json).raags?.length || 0
      addToast(`Imported ${count} raag(s) successfully`, 'success')
    } catch (error) {
      addToast('Failed to import raags', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDupeSkip = async () => {
    setShowDupeDialog(false)
    const json = pendingImportJson
    const parsed = JSON.parse(json)
    const existingNames = new Set(raags.map((r) => r.name.toLowerCase()))
    const filtered = {
      ...parsed,
      raags: parsed.raags.filter(
        (r: { name?: string }) => r.name && !existingNames.has(r.name.toLowerCase())
      ),
    }
    if (filtered.raags.length === 0) {
      addToast('All raags already exist — nothing to import', 'error')
      return
    }
    await doImport(JSON.stringify(filtered))
  }

  const handleDupeOverwrite = async () => {
    setShowDupeDialog(false)
    const json = pendingImportJson
    const parsed = JSON.parse(json)
    const existingNames = new Set(raags.map((r) => r.name.toLowerCase()))

    for (const raag of raags) {
      if (existingNames.has(raag.name.toLowerCase())) {
        try {
          await raagService.deleteRaag(raag.id)
        } catch { /* ignore */ }
      }
    }
    await doImport(json)
  }

  const handleDupeCopy = async () => {
    setShowDupeDialog(false)
    await doImport(pendingImportJson)
  }

  const handleExportLibrary = async () => {
    if (isExportingLibrary) return
    setIsExportingLibrary(true)
    try {
      const saved = await swarService.exportLibraryToFile()
      if (saved) {
        addToast('Library backup exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export library backup', 'error')
    } finally {
      setIsExportingLibrary(false)
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
        <div className="flex gap-2">
          <button
            onClick={handleExportLibrary}
            disabled={isExportingLibrary}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {isExportingLibrary ? 'Exporting...' : 'Export Library'}
          </button>
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {isImporting ? 'Importing...' : 'Import .swar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".swar,.swarpack,.json"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            + New Raag
          </button>
        </div>
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

      {/* Import Confirmation */}
      <Modal isOpen={showImportConfirm} title="Import .swar" onClose={() => setShowImportConfirm(false)}>
        <p className="text-sm text-slate-600 mb-4">
          This will create new raags from the .swar file. Do you want to continue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={confirmImport}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Continue
          </button>
          <button
            onClick={() => setShowImportConfirm(false)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Duplicate Detection Dialog */}
      <Modal isOpen={showDupeDialog} title="Duplicate Raags Detected" onClose={() => setShowDupeDialog(false)}>
        <p className="text-sm text-slate-600 mb-2">
          These raags already exist:
        </p>
        <div className="mb-4 rounded bg-amber-50 p-2 text-sm text-amber-800">
          {dupeNames.join(', ')}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleDupeSkip}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
          >
            <span className="font-medium">Skip duplicates</span>
            <span className="block text-xs text-slate-500">Only import new raags</span>
          </button>
          <button
            onClick={handleDupeOverwrite}
            className="w-full rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 text-left"
          >
            <span className="font-medium">Overwrite duplicates</span>
            <span className="block text-xs text-red-500">Replace existing raags with imported ones</span>
          </button>
          <button
            onClick={handleDupeCopy}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
          >
            <span className="font-medium">Import as copy</span>
            <span className="block text-xs text-slate-500">Keep existing and create duplicates</span>
          </button>
          <button
            onClick={() => setShowDupeDialog(false)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </Modal>

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
