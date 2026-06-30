import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { bandishService, Bandish } from '../services/bandishService'
import { taanService, Taan, TaanInput } from '../services/taanService'
import { raagService } from '../services/raagService'
import { swarService } from '../services/swarService'
import { pdfService } from '../services/pdfService'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import TaanForm from '../components/TaanForm'
import TaanGroupedList from '../components/TaanGroupedList'
import NotationEditor from '../components/NotationEditor'

export default function BandishPage() {
  const { bandishId } = useParams<{ bandishId: string }>()
  const navigate = useNavigate()
  const { bandishes, taans, setBandishes, setTaans, addTaan, updateTaan, deleteTaan, updateBandish } = useAppStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loadedBandish, setLoadedBandish] = useState<Bandish | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingSwar, setIsExportingSwar] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const { addToast } = useToast()

  // Notation edit state
  const [editingSection, setEditingSection] = useState<'asthayi' | 'antara' | null>(null)
  const [draftAsthayi, setDraftAsthayi] = useState('')
  const [draftAntara, setDraftAntara] = useState('')

  // Taan notation edit state
  const [editingTaanNotationId, setEditingTaanNotationId] = useState<string | null>(null)
  const [taanDraftNotation, setTaanDraftNotation] = useState('')

  const cachedBandish = bandishes.find((b) => b.id === bandishId)
  const bandish = cachedBandish || loadedBandish
  const bandishTaans = taans.filter((t) => t.bandishId === bandishId)
  const bandishTaal = bandish?.taal || ''

  useEffect(() => {
    const loadBandishData = async () => {
      if (!bandishId) {
        navigate('/')
        return
      }

      try {
        const [nextBandish, nextTaans] = await Promise.all([
          bandishService.getBandishById(bandishId),
          taanService.getTaansByBandishId(bandishId),
        ])

        if (!nextBandish) {
          navigate('/')
          return
        }

        setLoadedBandish(nextBandish)
        setBandishes([...bandishes.filter((item) => item.id !== nextBandish.id), nextBandish])
        setTaans([...taans.filter((item) => item.bandishId !== bandishId), ...nextTaans])
      } catch (error) {
        console.error('Failed to load Bandish:', error)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadBandishData()
  }, [bandishId, navigate])

  const enterEditMode = (section: 'asthayi' | 'antara') => {
    setDraftAsthayi(bandish?.asthayi || '')
    setDraftAntara(bandish?.antara || '')
    setEditingSection(section)
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setDraftAsthayi('')
    setDraftAntara('')
  }

  const saveNotation = async () => {
    if (!bandish) return
    try {
      const saved = await bandishService.updateBandish(bandish.id, {
        title: bandish.title,
        taal: bandish.taal ?? undefined,
        laya: bandish.laya ?? undefined,
        composer: bandish.composer ?? undefined,
        lyrics: bandish.lyrics ?? undefined,
        asthayi: draftAsthayi,
        antara: draftAntara,
        notes: bandish.notes ?? undefined,
        startingBeat: bandish.startingBeat,
      })
      updateBandish(bandish.id, saved)
      setEditingSection(null)
    } catch (error) {
      console.error('Failed to save notation:', error)
    }
  }

  const enterTaanEditMode = (taan: Taan) => {
    setTaanDraftNotation(taan.notation || '')
    setEditingTaanNotationId(taan.id)
  }

  const cancelTaanEdit = () => {
    setEditingTaanNotationId(null)
    setTaanDraftNotation('')
  }

  const saveTaanNotation = async (taan: Taan) => {
    try {
      const saved = await taanService.updateTaan(taan.id, {
        notation: taanDraftNotation,
        startingMatra: taan.startingMatra,
        textNote: taan.textNote ?? undefined,
      })
      updateTaan(taan.id, saved)
      setEditingTaanNotationId(null)
    } catch (error) {
      console.error('Failed to save taan notation:', error)
    }
  }

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

  const handleExportSwar = async () => {
    if (!bandishId || isExportingSwar) return
    setIsExportingSwar(true)
    try {
      const saved = await swarService.exportBandishToFile(bandishId, `${bandish?.title || 'bandish'}.swar`)
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
    if (!bandish || isExportingPdf) return
    setIsExportingPdf(true)
    try {
      const raag = await raagService.getRaagById(bandish.raagId)
      if (!raag) {
        addToast('Failed to load parent Raag for PDF export', 'error')
        return
      }
      const saved = await pdfService.exportBandishPdfToFile(bandish, raag, bandishTaans)
      if (saved) {
        addToast('PDF exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export PDF', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading || !bandish) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to={`/raag/${bandish.raagId}`} className="text-sm text-slate-600 underline hover:text-slate-900">
          Back to Raag
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{bandish.title}</h1>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Bandish Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bandish.composer && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Composer</h3>
                <p className="mt-2 text-slate-700">{bandish.composer}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-500">Taal</h3>
              <p className="mt-2 text-slate-700">{bandish.taal || '-'}</p>
            </div>
            {bandish.laya && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Laya (Speed)</h3>
                <p className="mt-2 text-slate-700">{bandish.laya}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-slate-500">Starting Beat</h3>
              <p className="mt-2 text-slate-700">{bandish.startingBeat}</p>
            </div>
            {bandish.notes && (
              <div className="sm:col-span-2 lg:col-span-4">
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
          {bandishTaal && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500">Notation</h3>
                <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-0.5">
                  <button
                    onClick={() => setEditingSection(null)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      !editingSection
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    View
                  </button>
                  <button
                    onClick={() => enterEditMode('asthayi')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      editingSection === 'asthayi'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Asthayi</h4>
                <NotationEditor
                  taal={bandishTaal}
                  startingBeat={bandish.startingBeat}
                  value={editingSection ? draftAsthayi : (bandish.asthayi ?? undefined)}
                  onChange={setDraftAsthayi}
                  readOnly={!editingSection}
                />
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Antara</h4>
                <NotationEditor
                  taal={bandishTaal}
                  startingBeat={bandish.startingBeat}
                  value={editingSection ? draftAntara : (bandish.antara ?? undefined)}
                  onChange={setDraftAntara}
                  readOnly={!editingSection}
                />
              </div>
              {editingSection && (
                <div className="flex gap-2">
                  <button
                    onClick={saveNotation}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Save Notation
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Taans ({bandishTaans.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={handleExportSwar}
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
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                + Add Taan
              </button>
            </div>
          </div>

          {bandishTaans.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No Taans yet. Create one to get started.</p>
            </div>
          )}

          {bandishTaans.length > 0 && (
            <TaanGroupedList
              taans={bandishTaans}
              editingTaanNotationId={editingTaanNotationId}
              taanDraftNotation={taanDraftNotation}
              onEditNotation={enterTaanEditMode}
              onCancelNotation={cancelTaanEdit}
              onSaveNotation={saveTaanNotation}
              onDeleteTaan={handleDeleteTaan}
              onDraftNotationChange={setTaanDraftNotation}
            />
          )}
        </section>
      </div>

      <Modal isOpen={isCreateModalOpen} title="Create New Taan" onClose={() => setIsCreateModalOpen(false)}>
        <TaanForm
          taal={bandishTaal}
          onSubmit={handleCreateTaan}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
