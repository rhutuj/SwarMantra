import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'
import { taanService, Taan } from '../services/taanService'
import { sargamService } from '../services/sargamService'
import { bandishService } from '../services/bandishService'
import { raagService } from '../services/raagService'
import { swarService } from '../services/swarService'
import { pdfService } from '../services/pdfService'
import { useToast } from '../components/Toast'

export default function TaanPage() {
  const { taanId } = useParams<{ taanId: string }>()
  const navigate = useNavigate()
  const { taans, setTaans, updateTaan } = useAppStore()

  const [loadedTaan, setLoadedTaan] = useState<Taan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [parentTaal, setParentTaal] = useState<string>('')
  const [parentTitle, setParentTitle] = useState<string>('')
  const [raagName, setRaagName] = useState<string>('')
  const [isExportingSwar, setIsExportingSwar] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const { addToast } = useToast()

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [draftNotation, setDraftNotation] = useState('')

  const cachedTaan = taans.find((t) => t.id === taanId)
  const taan = cachedTaan || loadedTaan

  useEffect(() => {
    const loadTaanData = async () => {
      if (!taanId) {
        navigate('/')
        return
      }

      try {
        const nextTaan = await taanService.getTaanById(taanId)

        if (!nextTaan) {
          navigate('/')
          return
        }

        setLoadedTaan(nextTaan)
        setTaans([...taans.filter((item) => item.id !== nextTaan.id), nextTaan])

        let taal = ''
        let parentTitle = ''
        let raagName = ''
        if (nextTaan.sargamId) {
          const parent = await sargamService.getSargamById(nextTaan.sargamId)
          taal = parent?.taal || ''
          parentTitle = parent?.title || ''
          if (parent?.raagId) {
            const raag = await raagService.getRaagById(parent.raagId)
            raagName = raag?.name || ''
          }
        } else if (nextTaan.bandishId) {
          const parent = await bandishService.getBandishById(nextTaan.bandishId)
          taal = parent?.taal || ''
          parentTitle = parent?.title || ''
          if (parent?.raagId) {
            const raag = await raagService.getRaagById(parent.raagId)
            raagName = raag?.name || ''
          }
        }
        setParentTaal(taal)
        setParentTitle(parentTitle)
        setRaagName(raagName)
      } catch (error) {
        console.error('Failed to load Taan:', error)
        navigate('/')
      } finally {
        setIsLoading(false)
      }
    }

    loadTaanData()
  }, [taanId, navigate])

  const enterEditMode = () => {
    if (!taan) return
    setDraftNotation(taan.notation || '')
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setDraftNotation('')
  }

  const saveChanges = async () => {
    if (!taan) return
    try {
      const saved = await taanService.updateTaan(taan.id, {
        notation: draftNotation,
        startingMatra: taan.startingMatra,
        textNote: taan.textNote ?? undefined,
      })
      updateTaan(taan.id, saved)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const handleExportSwar = async () => {
    if (!taanId || isExportingSwar) return
    setIsExportingSwar(true)
    try {
      const saved = await swarService.exportTaanToFile(taanId, 'taan.swar')
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
    if (!taan || isExportingPdf) return
    setIsExportingPdf(true)
    try {
      const saved = await pdfService.exportTaanPdfToFile(taan, raagName, parentTitle, parentTaal)
      if (saved) {
        addToast('PDF exported successfully', 'success')
      }
    } catch (error) {
      addToast('Failed to export PDF', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading || !taan) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  const backLink = taan.sargamId
    ? { to: `/sargam/${taan.sargamId}`, label: 'Back to Sargam' }
    : taan.bandishId
      ? { to: `/bandish/${taan.bandishId}`, label: 'Back to Bandish' }
      : null

  return (
    <div>
      {backLink && (
        <Link to={backLink.to} className="text-sm text-slate-600 underline hover:text-slate-900">
          {backLink.label}
        </Link>
      )}

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-end gap-4">
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
          </div>
        </div>

        <div className="mt-6 flex gap-6">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Starting Matra</h2>
            <p className="mt-1 text-slate-700">{taan.startingMatra}</p>
          </div>
          {taan.textNote && (
            <div>
              <h2 className="text-sm font-medium text-slate-500">Text Note</h2>
              <p className="mt-1 text-slate-700">{taan.textNote}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-end">
            <button
              onClick={isEditing ? cancelEdit : enterEditMode}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div className="mt-2">
            {isEditing ? (
              <textarea
                value={draftNotation}
                onChange={(e) => setDraftNotation(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-200">
                {taan.notation || 'No notation'}
              </pre>
            )}
          </div>
          {isEditing && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveChanges}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Save
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
      </section>
    </div>
  )
}
