import { useParams, Link } from 'react-router-dom'

function SargamPage() {
  const { sargamId } = useParams<{ sargamId: string }>()

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Sargam Detail</h1>
          <p className="text-slate-600">Sargam ID: {sargamId}</p>
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">Edit Sargam</button>
      </div>

      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Metadata</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Taal</h3>
              <p className="mt-2 text-slate-700">Teentaal</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Notes</h3>
              <p className="mt-2 text-slate-700">Placeholder for Sargam notes.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Notation Editor</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Notation</label>
              <textarea className="mt-2 h-40 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" readOnly value="S R G M P D N S'" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Notes</label>
              <textarea className="mt-2 h-24 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800" readOnly value="Use the notation editor to add your Sargam content." />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8">
        <Link to="/" className="text-sm text-slate-600 underline">Back to dashboard</Link>
      </div>
    </div>
  )
}

export default SargamPage
