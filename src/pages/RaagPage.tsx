import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { raagService } from '../services/raagService'
import { sargamService, Sargam, SargamInput } from '../services/sargamService'
import { bandishService, Bandish, BandishInput } from '../services/bandishService'
import { swarService } from '../services/swarService'
import { pdfService } from '../services/pdfService'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import SargamForm from '../components/SargamForm'
import BandishForm from '../components/BandishForm'

export default function RaagPage() {
  const { raagId } = useParams<{ raagId: string }>()
  const navigate = useNavigate()
  const {
    raags,
    sargams,
    bandishes,
    addSargam,
    addBandish,
    updateSargam,
    updateBandish,
    deleteSargam,
    deleteBandish,
    setRaags,
    setSargams,
    setBandishes,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<'sargams' | 'bandishes'>('sargams')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSargam, setEditingSargam] = useState<Sargam | null>(null)
  const [editingBandish, setEditingBandish] = useState<Bandish | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingSwar, setIsExportingSwar] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const { addToast } = useToast()

  const raag = raags.find((r) => r.id === raagId)
  const raagSargams = sargams.filter((s) => s.raagId === raagId)
  const raagBandishes = bandishes.filter((b) => b.raagId === raagId)

  useEffect(() => {
    const loadRaagData = async () => {
      if (!raagId) {
        navigate('/')
        return
      }

      try {
        const [loadedRaag, loadedSargams, loadedBandishes] = await Promise.all([
          raagService.getRaagById(raagId),
          sargamService.getSargamsByRaagId(raagId),
          bandishService.getBandishesByRaagId(raagId),
        ])

        if (!loadedRaag) {
          navigate('/')
          return
        }

        setRaags([loadedRaag, ...raags.filter((item) => item.id !== loadedRaag.id)])
        setSargams([...sargams.filter((item) => item.raagId !== raagId), ...loadedSargams])
        setBandishes([...bandishes.filter((item) => item.raagId !== raagId), ...loadedBandishes])
      } catch (error) {
        console.error('Failed to load Raag details:', error)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadRaagData()
  }, [raagId, navigate])

  const handleCreateSargam = async (data: SargamInput) => {
    if (!raagId) return
    try {
      const newSargam = await sargamService.createSargam(raagId, data)
      addSargam(newSargam)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create Sargam:', error)
    }
  }

  const handleCreateBandish = async (data: BandishInput) => {
    if (!raagId) return
    try {
      const newBandish = await bandishService.createBandish(raagId, data)
      addBandish(newBandish)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create Bandish:', error)
    }
  }

  const handleUpdateSargam = async (id: string, data: SargamInput) => {
    try {
      const savedSargam = await sargamService.updateSargam(id, data)
      updateSargam(id, savedSargam)
      setEditingSargam(null)
    } catch (error) {
      console.error('Failed to update Sargam:', error)
    }
  }

  const handleUpdateBandish = async (id: string, data: BandishInput) => {
    try {
      const savedBandish = await bandishService.updateBandish(id, data)
      updateBandish(id, savedBandish)
      setEditingBandish(null)
    } catch (error) {
      console.error('Failed to update Bandish:', error)
    }
  }

  const handleDeleteSargam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Sargam?')) return
    try {
      await sargamService.deleteSargam(id)
      deleteSargam(id)
    } catch (error) {
      console.error('Failed to delete Sargam:', error)
    }
  }

  const handleDeleteBandish = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Bandish?')) return
    try {
      await bandishService.deleteBandish(id)
      deleteBandish(id)
    } catch (error) {
      console.error('Failed to delete Bandish:', error)
    }
  }

  const handleExportSwarm = async () => {
    if (!raagId || isExportingSwar) return
    setIsExportingSwar(true)
    try {
      const saved = await swarService.exportRaagToFile(raagId, `${raag?.name || 'raag'}.swar`)
      if (saved) {
        addToast('SWAR file exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export SWAR file', 'error')
    } finally {
      setIsExportingSwar(false)
    }
  }

  const handleExportPdf = async () => {
    if (!raag || isExportingPdf) return
    setIsExportingPdf(true)
    try {
      const saved = await pdfService.exportRaagPdfToFile(raag)
      if (saved) {
        addToast('PDF exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export PDF', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading || !raag) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{raag.name}</h1>
          <p className="text-slate-600">Raag ID: {raagId}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setActiveTab('sargams')
              setIsCreateModalOpen(true)
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            New Sargam
          </button>
          <button
            onClick={() => {
              setActiveTab('bandishes')
              setIsCreateModalOpen(true)
            }}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            New Bandish
          </button>
          <button
            onClick={handleExportSwarm}
            disabled={isExportingSwar}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {isExportingSwar ? 'Exporting...' : 'Export .swar'}
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {isExportingPdf ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Raag Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Thaat</h3>
              <p className="mt-2 text-slate-700">{raag.thaat || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Aaroh</h3>
              <p className="mt-2 font-mono text-slate-700">{raag.aaroh || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Avroh</h3>
              <p className="mt-2 font-mono text-slate-700">{raag.avroh || '-'}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium text-slate-500">Pakad</h3>
              <p className="mt-2 font-mono text-slate-700">{raag.pakad || '-'}</p>
            </div>
            {raag.notes && (
              <div className="sm:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-medium text-slate-500">Notes</h3>
                <p className="mt-2 text-slate-700">{raag.notes}</p>
              </div>
            )}
          </div>
        </section>

        <div className="border-b border-slate-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('sargams')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'sargams'
                  ? 'border-b-2 border-slate-900 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sargams ({raagSargams.length})
            </button>
            <button
              onClick={() => setActiveTab('bandishes')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'bandishes'
                  ? 'border-b-2 border-slate-900 text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bandishes ({raagBandishes.length})
            </button>
          </div>
        </div>

        {activeTab === 'sargams' && (
          <div>
            {raagSargams.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-slate-600">No Sargams yet. Create one to get started.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                >
                  Create Sargam
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {raagSargams.map((sargam) => (
                  <div key={sargam.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="font-semibold text-slate-900">{sargam.title}</h3>
                    {sargam.taal && <p className="text-sm text-slate-600">Taal: {sargam.taal}</p>}
                    {sargam.notes && <p className="mt-2 text-sm text-slate-500">{sargam.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/sargam/${sargam.id}`)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditingSargam(sargam)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSargam(sargam.id)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bandishes' && (
          <div>
            {raagBandishes.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-slate-600">No Bandishes yet. Create one to get started.</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                >
                  Create Bandish
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {raagBandishes.map((bandish) => (
                  <div key={bandish.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <h3 className="font-semibold text-slate-900">{bandish.title}</h3>
                    {bandish.composer && <p className="text-sm text-slate-600">Composer: {bandish.composer}</p>}
                    {bandish.taal && <p className="text-sm text-slate-600">Taal: {bandish.taal}</p>}
                    {bandish.notes && <p className="mt-2 text-sm text-slate-500">{bandish.notes}</p>}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => navigate(`/bandish/${bandish.id}`)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditingBandish(bandish)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBandish(bandish.id)}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8">
        <Link to="/" className="text-sm text-slate-600 underline hover:text-slate-900">
          Back to dashboard
        </Link>
      </div>

      <Modal
        isOpen={isCreateModalOpen && activeTab === 'sargams'}
        title="Create New Sargam"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <SargamForm onSubmit={handleCreateSargam} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={isCreateModalOpen && activeTab === 'bandishes'}
        title="Create New Bandish"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <BandishForm onSubmit={handleCreateBandish} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!editingSargam} title="Edit Sargam" onClose={() => setEditingSargam(null)}>
        {editingSargam && (
          <SargamForm
            initialData={editingSargam}
            onSubmit={(data) => handleUpdateSargam(editingSargam.id, data)}
            onCancel={() => setEditingSargam(null)}
          />
        )}
      </Modal>

      <Modal isOpen={!!editingBandish} title="Edit Bandish" onClose={() => setEditingBandish(null)}>
        {editingBandish && (
          <BandishForm
            initialData={editingBandish}
            onSubmit={(data) => handleUpdateBandish(editingBandish.id, data)}
            onCancel={() => setEditingBandish(null)}
          />
        )}
      </Modal>
    </div>
  )
}
