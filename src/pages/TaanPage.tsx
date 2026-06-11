import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import useAppStore from '../store/appStore'

export default function TaanPage() {
  const { taanId } = useParams<{ taanId: string }>()
  const navigate = useNavigate()
  const { taans, sargams, bandishes, deleteTaan } = useAppStore()

  const taan = taans.find((t) => t.id === taanId)
  const sargam = taan?.sargamId ? sargams.find((s) => s.id === taan.sargamId) : null
  const bandish = taan?.bandishId ? bandishes.find((b) => b.id === taan.bandishId) : null
  const parentRaagId = sargam?.raagId || bandish?.raagId

  useEffect(() => {
    if (!taan) {
      navigate('/')
    }
  }, [taan, navigate])

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this Taan?')) return
    try {
      deleteTaan(taanId!)
      // Navigate back to parent
      if (sargam) {
        navigate(`/sargam/${sargam.id}`)
      } else if (bandish) {
        navigate(`/bandish/${bandish.id}`)
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to delete Taan:', error)
    }
  }

  if (!taan) {
    return <div className="p-8 text-center text-slate-600">Loading...</div>
  }

  return (
    <div>
      {/* Header with Back Button */}
      <div className="mb-6">
        {sargam ? (
          <Link to={`/sargam/${sargam.id}`} className="text-sm text-slate-600 underline hover:text-slate-900">
            ← Back to Sargam
          </Link>
        ) : bandish ? (
          <Link to={`/bandish/${bandish.id}`} className="text-sm text-slate-600 underline hover:text-slate-900">
            ← Back to Bandish
          </Link>
        ) : (
          <Link to="/" className="text-sm text-slate-600 underline hover:text-slate-900">
            ← Back to Dashboard
          </Link>
        )}
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{taan.title}</h1>
      </div>

      {/* Taan Information */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Taan Information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Order</h3>
            <p className="mt-2 text-slate-700">{taan.order}</p>
          </div>
          {taan.taal && (
            <div>
              <h3 className="text-sm font-medium text-slate-500">Taal</h3>
              <p className="mt-2 text-slate-700">{taan.taal}</p>
            </div>
          )}
          {sargam && (
            <div>
              <h3 className="text-sm font-medium text-slate-500">In Sargam</h3>
              <p className="mt-2 text-slate-700">{sargam.title}</p>
            </div>
          )}
          {bandish && (
            <div>
              <h3 className="text-sm font-medium text-slate-500">In Bandish</h3>
              <p className="mt-2 text-slate-700">{bandish.title}</p>
            </div>
          )}
          {taan.notes && (
            <div className="sm:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium text-slate-500">Notes</h3>
              <p className="mt-2 text-slate-700">{taan.notes}</p>
            </div>
          )}
        </div>

        {taan.notation && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-500">Notation</h3>
            <div className="mt-2 rounded-lg bg-slate-50 p-3 font-mono text-sm text-slate-700 whitespace-pre-wrap break-words">
              {taan.notation}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDelete}
            className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete Taan
          </button>
        </div>
      </section>
    </div>
  )
}
