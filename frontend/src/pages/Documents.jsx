import { useMemo, useRef, useState } from "react";
import {
    ChevronDownIcon,
    FileIcon,
    FolderIcon,
    MoreIcon,
    SearchIcon,
} from "./icons";

const CATEGORIES = ["Design", "Finance", "Legal", "Engineering", "Marketing"];
const INITIAL_DOCUMENTS = [
    { id: 1, title: "Q3 Product Roadmap", format: "PDF", category: "Engineering", progress: 65, updated: "2025-06-12" },
    { id: 2, title: "Brand Guidelines v2", format: "PDF", category: "Design", progress: 100, updated: "2025-06-10" },
    { id: 3, title: "Annual Budget Forecast", format: "DOCX", category: "Finance", progress: 40, updated: "2025-06-11" },
    { id: 4, title: "Vendor Agreement Draft", format: "DOCX", category: "Legal", progress: 100, updated: "2025-06-06" },
    { id: 5, title: "Campaign Performance Report", format: "PDF", category: "Marketing", progress: 82, updated: "2025-06-09" },
    { id: 6, title: "API Integration Spec", format: "DOCX", category: "Engineering", progress: 100, updated: "2025-06-03" },
    { id: 7, title: "User Research Summary", format: "PDF", category: "Design", progress: 25, updated: "2025-06-12" },
    { id: 8, title: "Security Audit Checklist", format: "PDF", category: "Engineering", progress: 100, updated: "2025-05-30" },
    { id: 9, title: "Expense Reconciliation", format: "DOCX", category: "Finance", progress: 100, updated: "2025-05-28" },
    { id: 10, title: "Press Release Draft", format: "DOCX", category: "Marketing", progress: 100, updated: "2025-05-25" },
    { id: 11, title: "Onboarding Playbook", format: "PDF", category: "Design", progress: 100, updated: "2025-05-20" },
    { id: 12, title: "Compliance Review Notes", format: "PDF", category: "Legal", progress: 100, updated: "2025-05-18" },
].map((document, index) => ({
    ...document,
    owner: "You",
    size: `${(0.6 + ((index * 37) % 40) / 10).toFixed(1)} MB`,
    created: document.updated,
    start: document.updated,
    deadline: document.updated,
    pages: 3 + (index % 4),
}));

const INITIAL_SUBMISSIONS = [
    { id: 1, name: "Amara Okafor", title: "Sprint 24 Retrospective", project: "Atlas", date: "2025-06-12", progress: 100, status: "In Review" },
    { id: 2, name: "Daniel Reyes", title: "Landing Page Copy Deck", project: "Nova", date: "2025-06-11", progress: 90, status: "In Review" },
    { id: 3, name: "Priya Nair", title: "Infrastructure Cost Report", project: "Atlas", date: "2025-06-10", progress: 100, status: "Approved" },
    { id: 4, name: "Lucas Meyer", title: "Customer Interview Notes", project: "Helix", date: "2025-06-09", progress: 55, status: "Needs Revision" },
    { id: 5, name: "Sofia Rossi", title: "Brand Refresh Moodboard", project: "Nova", date: "2025-06-08", progress: 100, status: "Approved" },
    { id: 6, name: "Amara Okafor", title: "Release Notes v3.2", project: "Helix", date: "2025-06-07", progress: 100, status: "In Review" },
    { id: 7, name: "Kenji Watanabe", title: "Quarterly OKR Summary", project: "Atlas", date: "2025-06-05", progress: 72, status: "Needs Revision" },
    { id: 8, name: "Priya Nair", title: "Data Retention Policy", project: "Helix", date: "2025-06-03", progress: 100, status: "Approved" },
];

const card =
    "rounded-3xl bg-white shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50";
const field =
    "h-11 rounded-2xl border border-hairline bg-white px-4 text-sm font-medium text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/20 dark:border-slate-700";

function formatDate(value) {
    if (!value) return "-";
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" },
    );
}

function formatSize(bytes) {
    return bytes > 1048576
        ? `${(bytes / 1048576).toFixed(1)} MB`
        : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function initials(name) {
    return name.split(" ").map((part) => part[0]).join("").slice(0, 2);
}

function downloadDocument(document) {
    const blob = new Blob(
        [`${document.title}\n${document.progress}% complete`],
        { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${document.title}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ProgressBar({ value, dark = false }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline dark:bg-slate-700">
                <div
                    className={`h-full rounded-full transition-all ${
                        value >= 100
                            ? "bg-emerald-500"
                            : dark
                              ? "bg-ink"
                              : "bg-brand"
                    }`}
                    style={{ width: `${value}%` }}
                />
            </div>
            <span className="w-11 rounded-full bg-brand-soft px-2 py-0.5 text-center text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                {value}%
            </span>
        </div>
    );
}

function Stat({ label, value, hint, children, dark = false }) {
    return (
        <div className={`${card} flex items-center justify-between gap-4 p-6 ${dark ? "!bg-ink text-white" : ""}`}>
            <div>
                <p className={`text-sm font-medium ${dark ? "text-white/60" : "text-muted"}`}>
                    {label}
                </p>
                <p className="mt-2 font-display text-4xl font-bold tracking-tight">
                    {value}
                </p>
                {hint && (
                    <p className={`mt-1 text-xs font-medium ${dark ? "text-white/60" : "text-muted"}`}>
                        {hint}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <div className="relative">
            <select
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`${field} w-full appearance-none pr-10 sm:w-auto`}
            >
                {options.map((option) => (
                    <option key={option}>{option}</option>
                ))}
            </select>
            <ChevronDownIcon
                width={16}
                height={16}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            />
        </div>
    );
}

function SearchBox({ value, onChange, placeholder }) {
    return (
        <div className="relative min-w-0 flex-1 sm:min-w-64">
            <SearchIcon
                width={18}
                height={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className={`${field} w-full pl-11`}
            />
        </div>
    );
}

function DocumentModal({ document, onClose, onSave }) {
    const inputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState(document?.title ?? "");
    const [category, setCategory] = useState(document?.category ?? CATEGORIES[0]);
    const [start, setStart] = useState(
        document?.start?.slice(0, 16) ?? new Date().toISOString().slice(0, 16),
    );
    const [deadline, setDeadline] = useState(document?.deadline?.slice(0, 16) ?? "");
    const [progress, setProgress] = useState(document?.progress ?? 0);
    const [error, setError] = useState("");

    const submit = (event) => {
        event.preventDefault();
        if (!document && !file) {
            setError("Please choose a file to upload.");
            return;
        }
        if (!title.trim()) {
            setError("Please enter a document title.");
            return;
        }
        if (deadline && start && deadline < start) {
            setError("Deadline must be after the start date.");
            return;
        }

        onSave({
            title: title.trim(),
            category,
            start,
            deadline: deadline || start,
            progress: Number(progress),
            ...(file
                ? {
                      format: file.name.split(".").pop()?.toUpperCase() || "FILE",
                      size: formatSize(file.size),
                  }
                : {}),
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
            onMouseDown={onClose}
        >
            <form
                onSubmit={submit}
                onMouseDown={(event) => event.stopPropagation()}
                className={`${card} my-auto w-full max-w-2xl space-y-6 p-7`}
            >
                <div>
                    <h3 className="font-display text-2xl font-bold text-ink">
                        {document ? "Edit Document" : "Upload Document"}
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                        Add a file and manage its category, schedule, and progress.
                    </p>
                </div>
                {!document && (
                    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-hairline bg-canvas/60 px-6 py-8 text-center dark:border-slate-600">
                        <input
                            ref={inputRef}
                            type="file"
                            hidden
                            onChange={(event) => {
                                const selectedFile = event.target.files?.[0];
                                if (selectedFile) {
                                    setFile(selectedFile);
                                    setError("");
                                    if (!title) {
                                        setTitle(
                                            selectedFile.name.replace(/\.[^.]+$/, ""),
                                        );
                                    }
                                }
                            }}
                        />
                        {file ? (
                            <div className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-sm">
                                <FileIcon />
                                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
                                    {file.name}
                                </span>
                                <span className="text-xs text-muted">
                                    {formatSize(file.size)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-xs font-semibold text-muted hover:text-ink"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-ink">
                                    <FolderIcon width={26} height={26} />
                                </span>
                                <p className="mt-4 text-sm font-semibold text-ink">
                                    Drag &amp; drop your file here, or{" "}
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="underline decoration-brand decoration-2 underline-offset-4"
                                    >
                                        Browse from computer
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    PDF, DOCX, XLSX, PPTX and more
                                </p>
                            </>
                        )}
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-ink sm:col-span-2">
                        Document Title
                        <input
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            className={`${field} mt-2 w-full`}
                            placeholder="e.g. Quarterly Report"
                        />
                    </label>
                    <label className="text-sm font-semibold text-ink sm:col-span-2">
                        Category
                        <select
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className={`${field} mt-2 w-full`}
                        >
                            {CATEGORIES.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm font-semibold text-ink">
                        Start Date &amp; Time
                        <input
                            type="datetime-local"
                            value={start}
                            onChange={(event) => setStart(event.target.value)}
                            className={`${field} mt-2 w-full`}
                        />
                    </label>
                    <label className="text-sm font-semibold text-ink">
                        Deadline Date &amp; Time
                        <input
                            type="datetime-local"
                            value={deadline}
                            min={start}
                            onChange={(event) => setDeadline(event.target.value)}
                            className={`${field} mt-2 w-full`}
                        />
                    </label>
                    <label className="text-sm font-semibold text-ink sm:col-span-2">
                        <span className="flex justify-between">
                            Progress Completion
                            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold">
                                {progress}%
                            </span>
                        </span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(event) => setProgress(event.target.value)}
                            className="mt-3 w-full accent-[#F6C62E]"
                        />
                    </label>
                </div>
                {error && (
                    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
                        {error}
                    </p>
                )}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 rounded-2xl border border-ink/20 px-6 text-sm font-semibold text-ink"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="h-11 rounded-2xl bg-ink px-6 text-sm font-semibold text-white"
                    >
                        {document ? "Save Changes" : "Upload Document"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function DocumentViewer({ document, onClose, onProgress }) {
    const [page, setPage] = useState(1);
    const pages = document.pages ?? 4;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                aria-label={document.title}
                onMouseDown={(event) => event.stopPropagation()}
                className={`${card} flex h-full max-h-[860px] w-full max-w-6xl flex-col overflow-hidden`}
            >
                <header className="flex flex-wrap items-center gap-3 border-b border-hairline px-6 py-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft">
                        <FileIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="truncate font-display text-lg font-bold text-ink">
                            {document.title}
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                            {document.format} · {document.category}
                        </p>
                    </div>
                    <button
                        onClick={() => downloadDocument(document)}
                        className="h-10 rounded-2xl bg-ink px-5 text-sm font-semibold text-white"
                    >
                        Download
                    </button>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="h-10 w-10 rounded-2xl border border-hairline text-lg text-ink"
                    >
                        &times;
                    </button>
                </header>
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
                    <div className="flex min-h-0 flex-1 flex-col bg-[#2a2a2a]">
                        <div className="flex items-center justify-center gap-4 px-4 py-3 text-white">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((current) => current - 1)}
                                aria-label="Previous page"
                            >
                                &lsaquo;
                            </button>
                            <span className="text-xs font-semibold">
                                Page {page} of {pages}
                            </span>
                            <button
                                disabled={page >= pages}
                                onClick={() => setPage((current) => current + 1)}
                                aria-label="Next page"
                            >
                                &rsaquo;
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-auto p-6">
                            <div className="mx-auto aspect-[1/1.35] max-w-xl rounded-lg bg-white p-12 shadow-2xl">
                                <div className="mb-5 h-2 w-16 rounded-full bg-brand" />
                                <h4 className="text-2xl font-bold text-ink">
                                    {document.title}
                                </h4>
                                <p className="mt-2 text-sm text-muted">
                                    {document.category} · Prepared by {document.owner}
                                </p>
                                <div className="my-8 h-px bg-hairline" />
                                <div className="space-y-4">
                                    {[100, 96, 82, 92, 75, 100, 88, 65].map(
                                        (width, index) => (
                                            <div
                                                key={index}
                                                className="h-2 rounded-full bg-hairline"
                                                style={{ width: `${width}%` }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <aside className="w-full shrink-0 space-y-6 overflow-y-auto border-t border-hairline p-6 lg:w-80 lg:border-l lg:border-t-0">
                        <section>
                            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                                Progress Tracker
                            </h4>
                            <div className="mt-3">
                                <ProgressBar value={document.progress} />
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={document.progress}
                                onChange={(event) =>
                                    onProgress(document.id, Number(event.target.value))
                                }
                                aria-label="Update progress"
                                className="mt-4 w-full accent-[#F6C62E]"
                            />
                        </section>
                        <section>
                            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">
                                File Details
                            </h4>
                            <dl className="mt-3 space-y-3 text-sm">
                                {[
                                    ["Type", document.format],
                                    ["Size", document.size],
                                    ["Owner", document.owner],
                                    ["Created", formatDate(document.created)],
                                    ["Last updated", formatDate(document.updated)],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between">
                                        <dt className="text-muted">{label}</dt>
                                        <dd className="font-semibold text-ink">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function MyDocuments({ documents, setDocuments, setEditing, setViewing }) {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All Categories");
    const [status, setStatus] = useState("All");
    const [menuId, setMenuId] = useState(null);
    const completed = documents.filter((item) => item.progress >= 100).length;
    const rate = documents.length
        ? Math.round(
              documents.reduce((sum, item) => sum + item.progress, 0) /
                  documents.length,
          )
        : 0;
    const visible = useMemo(
        () =>
            documents.filter((item) => {
                const isComplete = item.progress >= 100;
                return (
                    item.title.toLowerCase().includes(query.toLowerCase()) &&
                    (category === "All Categories" || item.category === category) &&
                    (status === "All" ||
                        (status === "Completed" ? isComplete : !isComplete))
                );
            }),
        [documents, query, category, status],
    );

    const handleAction = (action, document) => {
        setMenuId(null);
        if (action === "Open") setViewing(document.id);
        if (action === "Edit") setEditing(document);
        if (action === "Download") downloadDocument(document);
        if (action === "Delete") {
            setDocuments((items) => items.filter((item) => item.id !== document.id));
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <Stat dark label="Total Documents" value={documents.length} hint="Across all categories">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-ink">
                        <FileIcon />
                    </span>
                </Stat>
                <Stat label="Overall Completion" value={`${rate}%`} hint="Average progress">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-brand text-xs font-bold text-ink">
                        {rate}%
                    </span>
                </Stat>
                <Stat label="In Progress" value={documents.length - completed} hint="Awaiting completion">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Active</span>
                </Stat>
                <Stat label="Approved Reports" value={completed} hint="Completed and signed off">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Done</span>
                </Stat>
            </div>

            <section className={`${card} p-6`}>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <SearchBox value={query} onChange={setQuery} placeholder="Search documents..." />
                    <Select label="Category" value={category} onChange={setCategory} options={["All Categories", ...CATEGORIES]} />
                    <Select label="Status" value={status} onChange={setStatus} options={["All", "In Progress", "Completed"]} />
                </div>
                {visible.length === 0 ? (
                    <p className="py-16 text-center text-sm font-medium text-muted">
                        No documents match your filters.
                    </p>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                        {visible.map((document) => (
                            <article
                                key={document.id}
                                onClick={() => setViewing(document.id)}
                                className="group cursor-pointer rounded-3xl border border-hairline bg-white p-5 outline-none transition hover:-translate-y-1 hover:border-brand hover:shadow-[0_0_0_4px_rgba(246,198,46,0.22),0_16px_40px_rgba(17,17,26,0.08)] dark:border-slate-700"
                            >
                                <div className="flex items-start gap-4">
                                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand">
                                        <FileIcon />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-base font-bold text-ink">{document.title}</h3>
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <span className="rounded-lg bg-ink px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">{document.format}</span>
                                            <span className="text-xs font-medium text-muted">{document.category}</span>
                                        </div>
                                    </div>
                                    <div className="relative" onClick={(event) => event.stopPropagation()}>
                                        <button
                                            aria-label={`Actions for ${document.title}`}
                                            onClick={() => setMenuId(menuId === document.id ? null : document.id)}
                                            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-hairline hover:text-ink"
                                        >
                                            <MoreIcon width={18} height={18} />
                                        </button>
                                        {menuId === document.id && (
                                            <div className="absolute right-0 z-20 mt-1 w-36 rounded-2xl border border-hairline bg-white p-1.5 shadow-xl">
                                                {["Open", "Edit", "Download", "Delete"].map((action) => (
                                                    <button
                                                        key={action}
                                                        onClick={() => handleAction(action, document)}
                                                        className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium hover:bg-canvas ${action === "Delete" ? "text-red-600" : "text-ink"}`}
                                                    >
                                                        {action}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                                        <span className="text-muted">{document.progress >= 100 ? "Completed" : "Completion"}</span>
                                        <span className="text-ink">{document.progress}% complete</span>
                                    </div>
                                    <ProgressBar value={document.progress} />
                                </div>
                                <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-medium text-muted">Started {formatDate(document.start)}</p>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${document.progress >= 100 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                        {document.progress >= 100 ? "Completed" : `Due ${formatDate(document.deadline)}`}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function TeamReports() {
    const [rows, setRows] = useState(INITIAL_SUBMISSIONS);
    const [query, setQuery] = useState("");
    const [member, setMember] = useState("All Team Members");
    const [project, setProject] = useState("All Projects");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [feedbackText, setFeedbackText] = useState("");
    const members = [...new Set(INITIAL_SUBMISSIONS.map((row) => row.name))];
    const projects = [...new Set(INITIAL_SUBMISSIONS.map((row) => row.project))];
    const pending = rows.filter((row) => row.status === "In Review").length;
    const visible = rows.filter(
        (row) =>
            row.name.toLowerCase().includes(query.toLowerCase()) &&
            (member === "All Team Members" || row.name === member) &&
            (project === "All Projects" || row.project === project) &&
            (!from || row.date >= from) &&
            (!to || row.date <= to),
    );
    const updateStatus = (id, status) =>
        setRows((current) =>
            current.map((row) => (row.id === id ? { ...row, status } : row)),
        );

    return (
        <div className="space-y-8">
            <div className="grid gap-5 md:grid-cols-3">
                <Stat dark label="Total Team Members" value={8} hint="8 Active">
                    <span className="flex -space-x-2">
                        {members.slice(0, 3).map((name) => (
                            <span key={name} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-ink ring-2 ring-ink">
                                {initials(name)}
                            </span>
                        ))}
                    </span>
                </Stat>
                <Stat label="Team Avg Completion" value="82%" hint="Across active documents">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-brand text-xs font-bold text-ink">82%</span>
                </Stat>
                <Stat label="Pending Reviews" value={pending} hint="Documents awaiting feedback">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Action needed</span>
                </Stat>
            </div>
            <section className={`${card} p-6`}>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <SearchBox value={query} onChange={setQuery} placeholder="Search by member name..." />
                    <Select label="Team member" value={member} onChange={setMember} options={["All Team Members", ...members]} />
                    <Select label="Project" value={project} onChange={setProject} options={["All Projects", ...projects]} />
                    <div className="flex items-center gap-2">
                        <input type="date" aria-label="From date" value={from} onChange={(event) => setFrom(event.target.value)} className={field} />
                        <span className="text-sm text-muted">to</span>
                        <input type="date" aria-label="To date" value={to} onChange={(event) => setTo(event.target.value)} className={field} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                        <thead>
                            <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                                <th className="pb-3 pl-2">Member</th>
                                <th className="pb-3">Document</th>
                                <th className="pb-3">Submitted</th>
                                <th className="w-52 pb-3">Progress</th>
                                <th className="pb-3">Status</th>
                                <th className="pb-3 pr-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((row) => (
                                <tr key={row.id} className="border-t border-hairline transition hover:bg-canvas/60 dark:border-slate-700">
                                    <td className="py-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-bold text-ink">{initials(row.name)}</span>
                                            <span className="whitespace-nowrap text-sm font-semibold text-ink">{row.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4">
                                        <p className="text-sm font-semibold text-ink">{row.title}</p>
                                        <p className="text-xs text-muted">{row.project}</p>
                                    </td>
                                    <td className="whitespace-nowrap py-4 text-sm font-medium text-muted">{formatDate(row.date)}</td>
                                    <td className="py-4 pr-6"><ProgressBar value={row.progress} dark /></td>
                                    <td className="py-4">
                                        <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${row.status === "Approved" ? "bg-emerald-50 text-emerald-700" : row.status === "Needs Revision" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-2">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => { setFeedback(row); setFeedbackText(""); }} className="h-9 rounded-xl border border-hairline px-3 text-xs font-semibold text-ink hover:bg-canvas">Review &amp; Feedback</button>
                                            <button disabled={row.status === "Approved"} onClick={() => updateStatus(row.id, "Approved")} className="h-9 rounded-xl bg-brand px-3 text-xs font-bold text-ink disabled:opacity-40">Approve</button>
                                            <button onClick={() => downloadDocument(row)} className="h-9 rounded-xl px-3 text-xs font-semibold text-muted hover:bg-canvas hover:text-ink">Download</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {visible.length === 0 && (
                        <p className="py-16 text-center text-sm font-medium text-muted">
                            No submissions match your filters.
                        </p>
                    )}
                </div>
            </section>
            {feedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setFeedback(null)}>
                    <form
                        onMouseDown={(event) => event.stopPropagation()}
                        onSubmit={(event) => {
                            event.preventDefault();
                            updateStatus(feedback.id, "Needs Revision");
                            setFeedback(null);
                        }}
                        className={`${card} w-full max-w-md space-y-4 p-7`}
                    >
                        <div>
                            <h3 className="font-display text-xl font-bold text-ink">Review &amp; Feedback</h3>
                            <p className="mt-1 text-sm text-muted">{feedback.title} · {feedback.name}</p>
                        </div>
                        <textarea
                            autoFocus
                            required
                            rows={4}
                            value={feedbackText}
                            onChange={(event) => setFeedbackText(event.target.value)}
                            placeholder="Share what needs to change..."
                            className={`${field} h-auto w-full py-3`}
                        />
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setFeedback(null)} className="h-11 rounded-2xl px-5 text-sm font-semibold text-muted">Cancel</button>
                            <button type="submit" className="h-11 rounded-2xl bg-ink px-6 text-sm font-semibold text-white">Request Revision</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default function Documents() {
    const [tab, setTab] = useState("mine");
    const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
    const [editing, setEditing] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [viewingId, setViewingId] = useState(null);
    const viewing = documents.find((item) => item.id === viewingId);

    const saveDocument = (value) => {
        const today = new Date().toISOString().slice(0, 10);
        if (editing) {
            setDocuments((items) =>
                items.map((item) =>
                    item.id === editing.id
                        ? { ...item, ...value, updated: today }
                        : item,
                ),
            );
        } else {
            setDocuments((items) => [
                {
                    id: Date.now(),
                    ...value,
                    owner: "You",
                    created: today,
                    updated: today,
                    pages: 4,
                },
                ...items,
            ]);
        }
        setEditing(null);
        setUploading(false);
    };

    const setProgress = (id, progress) =>
        setDocuments((items) =>
            items.map((item) =>
                item.id === id
                    ? { ...item, progress, updated: new Date().toISOString().slice(0, 10) }
                    : item,
            ),
        );

    const tabs = [
        { id: "mine", label: "My Documents" },
        { id: "team", label: "Community & Team Reports", badge: "Manager View" },
    ];

    return (
        <div className="px-5 pb-10 lg:px-8">
            <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight text-ink">
                        Document &amp; Progress Reports
                    </h2>
                    <p className="mt-1.5 text-sm font-medium text-muted">
                        Manage personal document completion and review team submissions
                    </p>
                </div>
                <button
                    onClick={() => setUploading(true)}
                    className="h-12 rounded-2xl bg-ink px-6 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-black"
                >
                    + Upload Document
                </button>
            </header>
            <div
                role="tablist"
                className="mb-8 inline-flex max-w-full flex-wrap gap-1 rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50"
            >
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        role="tab"
                        aria-selected={tab === item.id}
                        onClick={() => setTab(item.id)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${tab === item.id ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                    >
                        {item.label}
                        {item.badge && (
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tab === item.id ? "bg-brand text-ink" : "bg-brand-soft text-ink"}`}>
                                {item.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {tab === "mine" ? (
                <MyDocuments
                    documents={documents}
                    setDocuments={setDocuments}
                    setEditing={setEditing}
                    setViewing={setViewingId}
                />
            ) : (
                <TeamReports />
            )}
            {viewing && (
                <DocumentViewer
                    document={viewing}
                    onClose={() => setViewingId(null)}
                    onProgress={setProgress}
                />
            )}
            {(uploading || editing) && (
                <DocumentModal
                    key={editing?.id ?? "upload"}
                    document={editing}
                    onClose={() => {
                        setEditing(null);
                        setUploading(false);
                    }}
                    onSave={saveDocument}
                />
            )}
        </div>
    );
}
