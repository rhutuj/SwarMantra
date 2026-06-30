import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { sargamService, Sargam } from '../services/sargamService'
import { taanService, Taan, TaanInput } from '../services/taanService'
import { raagService } from '../services/raagService'
import { swarService } from '../services/swarService'
import { pdfService } from '../services/pdfService'
import { useToast } from '../components/Toast'
import Modal from '../components/Modal'
import TaanForm from '../components/TaanForm'
import TaanGroupedList from '../components/TaanGroupedList'
import NotationEditor from '../components/NotationEditor'

export default function SargamPage() {
  const { sargamId } = useParams<{ sargamId: string }>()
  const navigate = useNavigate()
  const { sargams, taans, setSargams, setTaans, addTaan, updateTaan, deleteTaan, updateSargam } = useAppStore()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [loadedSargam, setLoadedSargam] = useState<Sargam | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingSwar, setIsExportingSwar] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const { addToast } = useToast()

  // Notation edit state
  const [editingSection, setEditingSection] = useState<'asthayi' | 'antara' | null>(null)
  const [draftAsthayi, setDraftAsthayi] = useState('')
  const [draftAntara, setDraftAntara] = useState('')

  // Taan edit state
  const [editingTaanNotationId, setEditingTaanNotationId] = useState<string | null>(null)
  const [taanDraftNotation, setTaanDraftNotation] = useState('')

  const cachedSargam = sargams.find((s) => s.id === sargamId)
  const sargam = cachedSargam || loadedSargam
  const sargamTaans = taans.filter((t) => t.sargamId === sargamId)
  const sargamTaal = sargam?.taal || ''

  useEffect(() => {
    const loadSargamData = async () => {
      if (!sargamId) {
        navigate('/')
        return
      }

      try {
        const [nextSargam, nextTaans] = await Promise.all([
          sargamService.getSargamById(sargamId),
          taanService.getTaansBySargamId(sargamId),
        ])

        if (!nextSargam) {
          navigate('/')
          return
        }

        setLoadedSargam(nextSargam)
        setSargams([...sargams.filter((item) => item.id !== nextSargam.id), nextSargam])
        setTaans([...taans.filter((item) => item.sargamId !== sargamId), ...nextTaans])
      } catch (error) {
        console.error('Failed to load Sargam:', error)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadSargamData()
  }, [sargamId, navigate])

  const enterEditMode = (section: 'asthayi' | 'antara') => {
    setDraftAsthayi(sargam?.asthayi || '')
    setDraftAntara(sargam?.antara || '')
    setEditingSection(section)
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setDraftAsthayi('')
    setDraftAntara('')
  }

  const saveNotation = async () => {
    if (!sargam) return
    try {
      const saved = await sargamService.updateSargam(sargam.id, {
        title: sargam.title,
        taal: sargam.taal ?? undefined,
        asthayi: draftAsthayi,
        antara: draftAntara,
        notes: sargam.notes ?? undefined,
        startingBeat: sargam.startingBeat,
      })
      updateSargam(sargam.id, saved)
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
    if (!sargamId) return
    try {
      const newTaan = await taanService.createTaan(sargamId, null, data)
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
    if (!sargamId || isExportingSwar) return
    setIsExportingSwar(true)
    try {
      const saved = await swarService.exportSargamToFile(sargamId, `${sargam?.title || 'sargam'}.swar`)
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
    if (!sargam || isExportingPdf) return
    setIsExportingPdf(true)
    try {
      const raag = await raagService.getRaagById(sargam.raagId)
      if (!raag) {
        addToast('Failed to load parent Raag for PDF export', 'error')
        return
      }
      const saved = await pdfService.exportSargamPdfToFile(sargam, raag, sargamTaans)
      if (saved) {
        addToast('PDF exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export PDF', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading || !sargam) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <Link to={`/raag/${sargam.raagId}`} className="text-sm text-slate-600 underline hover:text-slate-900">
          Back to Raag
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{sargam.title}</h1>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Sargam Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Taal</h3>
              <p className="mt-2 text-slate-700">{sargam.taal || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Starting Beat</h3>
              <p className="mt-2 text-slate-700">{sargam.startingBeat}</p>
            </div>
            {sargam.notes && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Notes</h3>
                <p className="mt-2 text-slate-700">{sargam.notes}</p>
              </div>
            )}
          </div>
          {sargamTaal && (
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
                  taal={sargamTaal}
                  startingBeat={sargam.startingBeat}
                  value={editingSection ? draftAsthayi : (sargam.asthayi ?? undefined)}
                  onChange={setDraftAsthayi}
                  readOnly={!editingSection}
                />
              </div>
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Antara</h4>
                <NotationEditor
                  taal={sargamTaal}
                  startingBeat={sargam.startingBeat}
                  value={editingSection ? draftAntara : (sargam.antara ?? undefined)}
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
            <h2 className="text-xl font-semibold text-slate-900">Taans ({sargamTaans.length})</h2>
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

          {sargamTaans.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-600">No Taans yet. Create one to get started.</p>
            </div>
          )}

          {sargamTaans.length > 0 && (
            <TaanGroupedList
              taans={sargamTaans}
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
          taal={sargamTaal}
          onSubmit={handleCreateTaan}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
