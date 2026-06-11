import { useParams, Link } from 'react-router-dom'

function TaanPage() {
  const { taanId } = useParams<{ taanId: string }>()

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Taan Detail</h1>
          <p className="text-slate-600">Taan ID: {taanId}</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Edit Taan</button>
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2">Delete Taan</button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <h2 className="text-sm font-medium text-slate-500">Title</h2>
            <p className="mt-2 text-slate-700">Sample Taan</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-500">Taal</h2>
            <p className="mt-2 text-slate-700">Teentaal</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-slate-500">Notes</h2>
            <p className="mt-2 text-slate-700">Placeholder taan notes.</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-medium text-slate-500">Notation</h2>
          <textarea className="mt-2 h-40 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" readOnly value="S R G M P D N S'" />
        </div>
      </section>

      <div className="mt-8">
        <Link to="/" className="text-sm text-slate-600 underline">Back to dashboard</Link>
      </div>
    </div>
  )
}

export default TaanPage
