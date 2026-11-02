import { useEffect, useMemo, useRef, useState } from "react"
import api, { getApiErrorMessage, isMockApi } from "../api"
import { TEAM_WORKS } from "../teamWorkData"
import {
  FileIcon,
  SearchIcon,
  MoreIcon,
  ChevronDownIcon,
  FolderIcon,
} from "../assets/components/icon"

/* ---------- data ---------- */

const CATEGORIES = ["Design", "Finance", "Legal", "Engineering", "Marketing"]

const pad = (n) => String(n).padStart(2, "0")

const card =
  "rounded-3xl bg-white shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50"
const field =
  "h-11 rounded-2xl border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 dark:border-slate-700"

const fmtDate = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"
const extOf = (name) => {
  const m = /\.([a-z0-9]+)$/i.exec(name || "")
  return m ? m[1].toUpperCase() : ""
}
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const nowLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const deadlineInfo = (d) => {
  if (d.progress >= 100) return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" }
  const days = Math.ceil((new Date(d.deadline) - new Date()) / 86400000)
  const label = `Due ${fmtDateTime(d.deadline)}`
  if (days < 0) return { label: `Overdue \u00b7 ${fmtDateTime(d.deadline)}`, cls: "bg-red-50 text-red-700 ring-red-200" }
  if (days <= 3) return { label, cls: "bg-amber-50 text-amber-700 ring-amber-200" }
  return { label, cls: "bg-hairline text-ink ring-transparent dark:bg-slate-700" }
}
const toLocalInput = (value) => {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const fromApiDocument = (doc) => ({
  ...doc,
  format: doc.format || extOf(doc.fileName),
  start: toLocalInput(doc.start),
  deadline: toLocalInput(doc.deadline),
  created: doc.createdAt?.slice(0, 10),
  updated: doc.updatedAt?.slice(0, 10),
  size: fmtSize(doc.size),
  owner: doc.uploadedBy || "You",
  pages: 4,
})
const downloadDoc = async (doc) => {
  const { data, headers } = await api.get(`/documents/${doc.id}/download`, { responseType: "blob" })
  const disposition = headers["content-disposition"] || ""
  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1]
  const regularName = /filename="?([^";]+)"?/i.exec(disposition)?.[1]
  const fileName = encodedName ? decodeURIComponent(encodedName) : regularName || doc.fileName || doc.title
  const url = URL.createObjectURL(data)
  const link = Object.assign(document.createElement("a"), { href: url, download: fileName })
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ---------- small pieces ---------- */

function ProgressBar({ value, tone = "brand" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline dark:bg-slate-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            value >= 100 ? "bg-emerald-500" : tone === "ink" ? "bg-ink" : "bg-brand"
          }`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-11 rounded-full bg-brand-soft px-2 py-0.5 text-center text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
        {value}%
      </span>
    </div>
  )
}

function Ring({ value }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="7" className="stroke-hairline dark:stroke-slate-700" />
      <circle
        cx="32" cy="32" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
        stroke="#F6C62E" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        className="transition-all duration-700"
      />
    </svg>
  )
}

function Stat({ label, value, hint, children, dark }) {
  return (
    <div className={`${card} flex items-center justify-between gap-4 p-6 ${dark ? "!bg-ink text-white" : ""}`}>
      <div>
        <p className={`text-sm font-medium ${dark ? "text-white/60" : "text-muted"}`}>{label}</p>
        <p className="mt-2 font-display text-4xl font-bold tracking-tight">{value}</p>
        {hint && <p className={`mt-1 text-xs font-medium ${dark ? "text-white/60" : "text-muted"}`}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, label }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={`${field} w-full appearance-none pr-10 sm:w-auto`}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDownIcon width={16} height={16} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted" />
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative min-w-0 flex-1 sm:min-w-64">
      <SearchIcon width={18} height={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${field} w-full pl-11`} />
    </div>
  )
}

function ActionMenu({ onAction, doc }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [open])
  const items = ["Edit", "Download", "Delete"]
  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={`Actions for ${doc.title}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-hairline hover:text-ink dark:hover:bg-slate-700"
      >
        <MoreIcon width={18} height={18} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-2xl border border-hairline bg-white p-1.5 shadow-xl dark:border-slate-700">
          {items.map((i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false)
                onAction(i, doc)
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition hover:bg-hairline dark:hover:bg-slate-700 ${i === "Delete" ? "text-red-600" : "text-ink"}`}
            >
              {i}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- upload / edit modal ---------- */

function DocModal({ mode, doc, onClose, onSave }) {
  const [file, setFile] = useState(null)
  const [drag, setDrag] = useState(false)
  const [title, setTitle] = useState(doc?.title ?? "")
  const [category, setCategory] = useState(doc?.category ?? CATEGORIES[0])
  const [start, setStart] = useState(doc?.start ?? nowLocal())
  const [deadline, setDeadline] = useState(doc?.deadline ?? "")
  const [progress, setProgress] = useState(doc?.progress ?? 0)
  const [workId, setWorkId] = useState(doc?.workId ?? TEAM_WORKS[0].id)
  const [taskId, setTaskId] = useState(doc?.taskId ?? TEAM_WORKS[0].tasks[0].id)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)
  const upload = mode === "upload"
  const format = file ? extOf(file.name) : doc?.format
  const selectedWork = TEAM_WORKS.find((work) => work.id === workId) ?? TEAM_WORKS[0]
  const availableTasks = selectedWork.tasks

  const pick = (f) => {
    if (!f) return
    setFile(f)
    setError("")
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""))
  }
  const submit = async (e) => {
    e.preventDefault()
    if (upload && !file) return setError("Please choose a file to upload.")
    if (!title.trim()) return setError("Please enter a document title.")
    if (!start) return setError("Please choose a start date.")
    if (isMockApi && !availableTasks.some((task) => task.id === taskId)) {
      return setError("Please choose a task for this document.")
    }
    if (deadline && start && deadline < start) return setError("Deadline must be after the start date.")
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        category,
        start,
        deadline: deadline || start,
        progress: Number(progress),
        workId,
        taskId,
        ...(file ? { file, format: extOf(file.name) || "FILE", size: fmtSize(file.size) } : {}),
      })
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onMouseDown={onClose}>
      <form onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className={`${card} my-auto w-full max-w-2xl space-y-6 p-7`}>
        <div>
          <h3 className="font-display text-2xl font-bold text-ink">{upload ? "Upload Document" : "Edit Document"}</h3>
          <p className="mt-1 text-sm text-muted">{upload ? "Add a file and set its schedule and progress." : "Update the details for this document."}</p>
        </div>

        {upload && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]) }}
            className={`flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-8 text-center transition ${drag ? "border-brand bg-brand-soft" : "border-hairline bg-canvas/60 dark:border-slate-600"}`}
          >
            <input ref={inputRef} type="file" hidden onChange={(e) => pick(e.target.files?.[0])} />
            {file ? (
              <div className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm dark:border dark:border-slate-700">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink"><FileIcon /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{file.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{fmtSize(file.size)}</p>
                </div>
                <span className="rounded-lg bg-ink px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">{format || "FILE"}</span>
                <button type="button" onClick={() => setFile(null)} className="text-xs font-semibold text-muted hover:text-ink">Remove</button>
              </div>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-ink"><FolderIcon width={26} height={26} /></span>
                <p className="mt-4 text-sm font-semibold text-ink">
                  Drag &amp; drop your file here, or{" "}
                  <button type="button" onClick={() => inputRef.current?.click()} className="underline decoration-brand decoration-2 underline-offset-4 hover:text-black">Browse from computer</button>
                </p>
                <p className="mt-1 text-xs text-muted">PDF, DOCX, XLSX, PPTX and more</p>
              </>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {isMockApi && (
            <>
              <label className="block text-sm font-semibold text-ink">
                Work
                <select
                  value={workId}
                  onChange={(event) => {
                    const nextWork = TEAM_WORKS.find((work) => work.id === event.target.value)
                    setWorkId(event.target.value)
                    setTaskId(nextWork?.tasks[0]?.id ?? "")
                  }}
                  className={`${field} mt-2 w-full`}
                >
                  {TEAM_WORKS.map((work) => <option key={work.id} value={work.id}>{work.key} · {work.title}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-ink">
                Task
                <select value={taskId} onChange={(event) => setTaskId(event.target.value)} className={`${field} mt-2 w-full`}>
                  {availableTasks.map((task) => <option key={task.id} value={task.id}>{task.key} · {task.title}</option>)}
                </select>
              </label>
            </>
          )}
          <label className="block text-sm font-semibold text-ink sm:col-span-2">
            <span className="flex items-center gap-2">Document Title {!upload && format && <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-bold text-white">{format}</span>}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quarterly Report" className={`${field} mt-2 w-full`} />
          </label>
          <label className="block text-sm font-semibold text-ink sm:col-span-2">
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${field} mt-2 w-full`}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Start Date &amp; Time
            <input type="datetime-local" required value={start} onChange={(e) => setStart(e.target.value)} className={`${field} mt-2 w-full`} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Deadline Date &amp; Time
            <input type="datetime-local" value={deadline} min={start} onChange={(e) => setDeadline(e.target.value)} className={`${field} mt-2 w-full`} />
          </label>
          <label className="block text-sm font-semibold text-ink sm:col-span-2">
            <span className="flex items-center justify-between">Progress Completion <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold dark:bg-brand/15 dark:text-brand">{progress}%</span></span>
            <input type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(e.target.value)} className="mt-3 w-full accent-[#F6C62E]" />
          </label>
        </div>

        {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-ink/20 px-6 text-sm font-semibold text-ink transition hover:bg-hairline dark:hover:bg-slate-700">Cancel</button>
          <button type="submit" disabled={saving} className="h-11 rounded-2xl bg-ink px-6 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60">{saving ? "Saving..." : upload ? "Upload Document" : "Save Changes"}</button>
        </div>
      </form>
    </div>
  )
}

/* ---------- viewer modal ---------- */

function Viewer({ doc, onClose, onDownload }) {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const info = deadlineInfo(doc)
  const pages = doc.pages ?? 4
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])
  const btn = "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-30"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" onMouseDown={onClose}>
      <div role="dialog" aria-label={doc.title} onMouseDown={(e) => e.stopPropagation()} className={`${card} flex h-full max-h-[860px] w-full max-w-6xl flex-col overflow-hidden`}>
        <header className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-4 dark:border-slate-700">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand"><FileIcon /></span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold text-ink">{doc.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-lg bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">{doc.format}</span>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-ink dark:bg-brand/15 dark:text-brand">{doc.category}</span>
            </div>
          </div>
          <button onClick={() => onDownload(doc)} className="h-10 rounded-2xl bg-ink px-5 text-sm font-semibold text-white transition hover:bg-black">Download</button>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-hairline text-lg text-ink transition hover:bg-hairline dark:border-slate-700 dark:hover:bg-slate-700">&times;</button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* reader */}
          <div className="flex min-h-0 flex-1 flex-col bg-[#2a2a2a]">
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <button className={btn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">&lsaquo;</button>
                <span className="px-2 text-xs font-semibold text-white/80">Page {page} of {pages}</span>
                <button className={btn} disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">&rsaquo;</button>
              </div>
              <div className="flex items-center gap-1">
                <button className={btn} disabled={zoom <= 50} onClick={() => setZoom((z) => z - 25)} aria-label="Zoom out">&minus;</button>
                <button className={`${btn} w-14 text-xs`} onClick={() => setZoom(100)}>{zoom}%</button>
                <button className={btn} disabled={zoom >= 200} onClick={() => setZoom((z) => z + 25)} aria-label="Zoom in">+</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-6">
              <div className="mx-auto origin-top transition-all" style={{ width: `${(560 * zoom) / 100}px` }}>
                <div className="aspect-[1/1.35] w-full rounded-lg bg-white p-[8%] shadow-2xl" style={{ fontSize: `${(zoom / 100) * 10}px` }}>
                  {page === 1 && (
                    <>
                      <div className="mb-[1.2em] h-[0.5em] w-[4em] rounded-full bg-[#F6C62E]" />
                      <h4 className="text-[2.2em] leading-tight font-bold text-[#1C1C1C]">{doc.title}</h4>
                      <p className="mt-[0.8em] text-[1.1em] text-[#9195a1]">{doc.category} &middot; Prepared by {doc.owner}</p>
                      <div className="my-[2em] h-px bg-[#eef0f3]" />
                    </>
                  )}
                  <div className="space-y-[0.9em]">
                    {page > 1 && <div className="mb-[1.4em] h-[1.2em] w-2/5 rounded bg-[#1C1C1C]" />}
                    {[100, 96, 99, 88, 100, 94, 70, 0, 100, 97, 92, 100, 85, 60].map((w, i) =>
                      w === 0 ? <div key={i} className="h-[1.4em]" /> : <div key={i} className="h-[0.75em] rounded-full bg-[#eef0f3]" style={{ width: `${w}%` }} />,
                    )}
                    {page % 2 === 0 && (
                      <div className="mt-[1.6em] flex h-[8em] items-end gap-[0.8em] rounded-xl bg-[#F8F9FA] p-[1em]">
                        {[40, 65, 50, 85, 70, 95].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#F6C62E]" style={{ height: `${h}%`, opacity: 0.5 + i * 0.1 }} />)}
                      </div>
                    )}
                  </div>
                  <p className="mt-[2em] text-center text-[0.9em] text-[#9195a1]">{page}</p>
                </div>
              </div>
            </div>
          </div>

          {/* sidebar */}
          <aside className="w-full shrink-0 space-y-6 overflow-y-auto border-t border-hairline p-6 lg:w-80 lg:border-t-0 lg:border-l dark:border-slate-700">
            <section>
              <h4 className="text-xs font-bold tracking-wide text-muted uppercase">Schedule</h4>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Start</dt><dd className="font-semibold text-ink">{fmtDateTime(doc.start)}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-muted">Deadline</dt><dd><span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${info.cls}`}>{info.label}</span></dd></div>
              </dl>
            </section>
            <section>
              <h4 className="text-xs font-bold tracking-wide text-muted uppercase">File Details</h4>
              <dl className="mt-3 space-y-3 text-sm">
                {[["Type", doc.format], ["Size", doc.size ?? "-"], ["Owner", doc.owner ?? "You"], ["Created", fmtDateTime(doc.created)], ["Last updated", fmtDate(doc.updated)]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-muted">{k}</dt><dd className="font-semibold text-ink">{v}</dd></div>
                ))}
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

/* ---------- tab 1 ---------- */

function MyDocuments({ docs, onAction, setModal, setViewing }) {
  const [q, setQ] = useState("")
  const [category, setCategory] = useState("All Categories")
  const [status, setStatus] = useState("All")

  const total = docs.length
  const done = docs.filter((d) => d.progress >= 100).length
  const rate = total ? Math.round(docs.reduce((s, d) => s + d.progress, 0) / total) : 0

  const visible = useMemo(
    () =>
      docs.filter((d) => {
        const done = d.progress >= 100
        return (
          d.title.toLowerCase().includes(q.toLowerCase()) &&
          (category === "All Categories" || d.category === category) &&
          (status === "All" || (status === "Completed" ? done : !done))
        )
      }),
    [docs, q, category, status],
  )

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat dark label="Total Documents" value={total} hint="Across all categories">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-ink"><FileIcon /></span>
        </Stat>
        <Stat label="Overall Completion" value={`${rate}%`} hint="Average progress">
          <div className="relative"><Ring value={rate} /></div>
        </Stat>
        <Stat label="In Progress" value={total - done} hint="Awaiting completion">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Active</span>
        </Stat>
        <Stat label="Approved Reports" value={done} hint="Completed and signed off">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Done</span>
        </Stat>
      </div>

      <section className={`${card} p-6`}>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <SearchBox value={q} onChange={setQ} placeholder="Search documents..." />
          <Select label="Category" value={category} onChange={setCategory} options={["All Categories", ...CATEGORIES]} />
          <Select label="Status" value={status} onChange={setStatus} options={["All", "In Progress", "Completed"]} />
        </div>

        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm font-medium text-muted">No documents match your filters.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map((d) => (
              <article
                key={d.id}
                role="button"
                tabIndex={0}
                aria-label={`Open ${d.title}`}
                onClick={() => setViewing(d)}
                onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && setViewing(d)}
                className="group cursor-pointer rounded-3xl border border-hairline bg-white p-5 transition duration-200 outline-none hover:scale-[1.02] hover:border-brand hover:shadow-[0_0_0_4px_rgba(246,198,46,0.22),0_16px_40px_rgba(17,17,26,0.08)] focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/30 dark:border-slate-700"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand">
                    <FileIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-ink">{d.title}</h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded-lg bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">{d.format}</span>
                      <span className="text-xs font-medium text-muted">{d.category}</span>
                    </div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    <ActionMenu doc={d} onAction={onAction} />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                    <span className="text-muted">{d.progress >= 100 ? "Completed" : "Completion"}</span>
                    <span className="text-ink">{d.progress}% complete</span>
                  </div>
                  <ProgressBar value={d.progress} />
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted">Started {fmtDateTime(d.start)}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${deadlineInfo(d).cls}`}>{deadlineInfo(d).label}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ---------- tab 2 ---------- */

function TeamReports({ refreshKey, onPreview }) {
  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(isMockApi)
  const [error, setError] = useState("")
  const [openWorks, setOpenWorks] = useState({})
  const [openTasks, setOpenTasks] = useState({})

  useEffect(() => {
    if (!isMockApi) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    api.get("/team/works")
      .then(({ data }) => {
        if (active) {
          setWorks(data)
          setError("")
        }
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, "Could not load team works."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [refreshKey])

  const taskCount = works.reduce((total, work) => total + work.tasks.length, 0)
  const documents = works.flatMap((work) => work.tasks.flatMap((task) => task.documents))
  const memberCount = new Set(documents.map((document) => document.uploadedBy)).size

  return (
    <div className="space-y-8">
      {!isMockApi && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-900">
          Team Work → Task → Documents is available in offline demo mode. The live API does not yet have shared Work/Task assignments or team document access.
        </p>
      )}
      {error && <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid gap-5 sm:grid-cols-3">
        <Stat dark label="Works" value={works.length} hint="Team work items">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-ink"><FolderIcon /></span>
        </Stat>
        <Stat label="Tasks" value={taskCount} hint="Across all works">
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-ink">Tasks</span>
        </Stat>
        <Stat label="Member Documents" value={documents.length} hint={`${memberCount} members uploaded`}>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Uploaded</span>
        </Stat>
      </div>

      <section className={`${card} overflow-hidden`}>
        <div className="border-b border-hairline p-6 dark:border-slate-700">
          <h3 className="font-display text-xl font-bold text-ink">Works</h3>
          <p className="mt-1 text-sm text-muted">Expand a Work to see its Tasks, then open a Task to view member uploads.</p>
        </div>
        {loading ? (
          <p className="py-14 text-center text-sm font-medium text-muted">Loading team works...</p>
        ) : !isMockApi ? (
          <p className="py-14 text-center text-sm font-medium text-muted">Switch to offline demo mode to explore the sample Work and Task hierarchy.</p>
        ) : works.length === 0 ? (
          <p className="py-14 text-center text-sm font-medium text-muted">No Works found.</p>
        ) : (
          <div>
            <div className="hidden grid-cols-[minmax(240px,1.8fr)_120px_140px_90px] gap-4 bg-canvas px-6 py-3 text-xs font-bold uppercase tracking-wide text-muted sm:grid">
              <span>Work</span><span>Priority</span><span>Status</span><span>Tasks</span>
            </div>
            {works.map((work) => (
              <div key={work.id} className="border-b border-hairline last:border-b-0 dark:border-slate-700">
                <button
                  type="button"
                  aria-expanded={Boolean(openWorks[work.id])}
                  onClick={() => setOpenWorks((current) => ({ ...current, [work.id]: !current[work.id] }))}
                  className="grid w-full grid-cols-1 gap-2 px-5 py-4 text-left transition hover:bg-canvas/70 sm:grid-cols-[minmax(240px,1.8fr)_120px_140px_90px] sm:items-center sm:gap-4 sm:px-6"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${openWorks[work.id] ? "" : "-rotate-90"}`} />
                    <span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-bold text-ink">{work.key}</span>
                    <span className="truncate text-sm font-bold text-ink">{work.title}</span>
                  </span>
                  <span className="pl-7 text-sm text-ink sm:pl-0">{work.priority}</span>
                  <span className="pl-7 sm:pl-0"><span className="rounded-full bg-hairline px-3 py-1 text-xs font-semibold text-ink">{work.status}</span></span>
                  <span className="pl-7 text-xs font-semibold text-muted sm:pl-0">{work.tasks.length} tasks</span>
                </button>

                {openWorks[work.id] && (
                  <div className="bg-canvas/60 pb-3 pl-5 pr-4 dark:bg-slate-800/30 sm:pl-12">
                    {work.tasks.map((task) => (
                      <div key={task.id} className="border-t border-hairline dark:border-slate-700">
                        <button
                          type="button"
                          aria-expanded={Boolean(openTasks[task.id])}
                          onClick={() => setOpenTasks((current) => ({ ...current, [task.id]: !current[task.id] }))}
                          className="grid w-full grid-cols-1 gap-2 py-3 text-left sm:grid-cols-[minmax(220px,1.6fr)_120px_120px] sm:items-center sm:gap-4"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <ChevronDownIcon className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${openTasks[task.id] ? "" : "-rotate-90"}`} />
                            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-brand shadow-sm dark:bg-slate-800">{task.key}</span>
                            <span className="truncate text-sm font-semibold text-ink">{task.title}</span>
                          </span>
                          <span className="pl-6 sm:pl-0"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${task.status === "Done" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{task.status}</span></span>
                          <span className="pl-6 text-xs font-semibold text-muted sm:pl-0">{task.documents.length} documents</span>
                        </button>

                        {openTasks[task.id] && (
                          <div className="mb-3 ml-5 space-y-2 border-l-2 border-brand/40 pl-4 sm:ml-6">
                            {task.documents.length === 0 ? (
                              <p className="py-3 text-sm text-muted">No member has uploaded a document for this Task yet.</p>
                            ) : task.documents.map((document) => (
                              <article
                                key={document.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Preview ${document.title}`}
                                onClick={() => onPreview(fromApiDocument(document))}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    onPreview(fromApiDocument(document))
                                  }
                                }}
                                className="flex cursor-pointer flex-wrap items-center gap-3 rounded-2xl border border-hairline bg-white p-3 transition hover:border-brand hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand"><FileIcon width={17} height={17} /></span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-ink">{document.title}</p>
                                  <p className="truncate text-xs text-muted">{document.fileName} · {document.uploadedBy}</p>
                                </div>
                                <span className="rounded-md bg-ink px-2 py-1 text-[10px] font-bold text-white">{document.format}</span>
                                <div className="w-full sm:w-40"><ProgressBar value={document.progress} tone="ink" /></div>
                                <span className="text-xs text-muted">{fmtDateTime(document.createdAt)}</span>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ---------- page ---------- */

export default function Documents() {
  const [tab, setTab] = useState("mine")
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [modal, setModal] = useState(null)
  const [teamRefresh, setTeamRefresh] = useState(0)

  const [preview, setPreview] = useState(null)
  const viewDoc = preview?.doc
  const setViewing = (doc) => setPreview(doc ? { doc } : null)

  useEffect(() => {
    let active = true
    api.get("/documents")
      .then(({ data }) => {
        if (active) setDocs(data.map(fromApiDocument))
      })
      .catch((error) => {
        if (active) setPageError(getApiErrorMessage(error, "Could not load documents."))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const save = async (value) => {
    setPageError("")
    const form = new FormData()
    form.append("title", value.title)
    form.append("category", value.category)
    form.append("progress", String(value.progress))
    form.append("start", new Date(value.start).toISOString())
    form.append("deadline", new Date(value.deadline).toISOString())
    if (isMockApi) {
      form.append("workId", value.workId)
      form.append("taskId", value.taskId)
    }
    if (value.file) {
      form.append("file", value.file)
    }

    try {
      const { data } = modal.mode === "upload"
        ? await api.post("/documents", form)
        : await api.put(`/documents/${modal.doc.id}`, form)
      const saved = fromApiDocument(data)
      setDocs((current) => modal.mode === "upload"
        ? [saved, ...current]
        : current.map((document) => document.id === saved.id ? saved : document))
      setTeamRefresh((current) => current + 1)
      setModal(null)
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Could not save this document."))
    }
  }

  const onAction = async (action, doc) => {
    if (action === "Edit") {
      setModal({ mode: "edit", doc })
    } else if (action === "Delete") {
      if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
      setPageError("")
      try {
        await api.delete(`/documents/${doc.id}`)
        setDocs((current) => current.filter((item) => item.id !== doc.id))
        if (preview?.doc.id === doc.id) setViewing(null)
      } catch (error) {
        setPageError(getApiErrorMessage(error, "Could not delete this document."))
      }
    } else if (action === "Download") {
      try {
        await downloadDoc(doc)
      } catch (error) {
        setPageError(getApiErrorMessage(error, "Could not download this document."))
      }
    }
  }

  const tabs = [
    { id: "mine", label: "My Documents" },
    { id: "team", label: "Community & Team Reports", badge: "Manager View" },
  ]

  return (
    <div className="px-5 pb-10 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink">Document &amp; Progress Reports</h2>
          <p className="mt-1.5 text-sm font-medium text-muted">Manage personal document completion and review team submissions</p>
          {isMockApi && <p className="mt-2 text-xs font-semibold text-amber-700">Offline demo mode · changes are saved in this browser · upload limit 1 MB</p>}
        </div>
        <button onClick={() => setModal({ mode: "upload" })} className="h-12 rounded-2xl bg-ink px-6 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-black">
          + Upload Document
        </button>
      </header>

      {pageError && <p role="alert" className="mb-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{pageError}</p>}

      <div role="tablist" className="mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === t.id ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
          >
            {t.label}
            {t.badge && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === t.id ? "bg-brand text-ink" : "bg-brand-soft text-ink"}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "mine" ? (
        loading
          ? <p className="py-16 text-center text-sm font-medium text-muted">Loading documents...</p>
          : <MyDocuments docs={docs} onAction={onAction} setModal={setModal} setViewing={setViewing} />
      ) : <TeamReports refreshKey={teamRefresh} onPreview={setViewing} />}

      {viewDoc && <Viewer key={viewDoc.id} doc={viewDoc} onClose={() => setViewing(null)} onDownload={onAction.bind(null, "Download")} />}
      {modal && <DocModal key={modal.mode + (modal.doc?.id ?? "")} mode={modal.mode} doc={modal.doc} onClose={() => setModal(null)} onSave={save} />}
    </div>
  )
}
