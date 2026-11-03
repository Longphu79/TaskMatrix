import { useEffect, useRef, useState } from "react";
import { aiApi } from "../api/aiApi";
import { SparkleIcon, UploadIcon, CheckIcon } from "../../../components/icon";

function Bar({ value }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-hairline dark:bg-slate-800">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                        value >= 100 ? "bg-[#3fb27f]" : "bg-brand"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
            <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-ink dark:bg-brand/20 dark:text-brand">
                {value}% done
            </span>
        </div>
    );
}

export default function ProofAi({ task, onClose, onResult }) {
    const taskId = task.id || task._id;
    const initialProgress =
        task.status === "Completed" ? 100 : (task.progress ?? 0);

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [phase, setPhase] = useState("idle"); // idle | analyzing | done
    const [result, setResult] = useState(null);
    const [drag, setDrag] = useState(false);
    const [notes, setNotes] = useState(task.aiNotes ?? "");
    const [claimed, setClaimed] = useState(initialProgress);

    const inputRef = useRef(null);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        if (!file || !file.type.startsWith("image/")) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const reset = () => {
        setFile(null);
        setResult(null);
        setPhase("idle");
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setPhase("analyzing");

        try {
            const formData = new FormData();

            // 🟢 1. Đảm bảo đính kèm đúng file và filename
            formData.append("ProofImage", file, file.name);

            // 🟢 2. Sửa tên trường thành PascalCase khớp chuẩn C# DTO
            if (notes.trim()) {
                formData.append("UserNotes", notes.trim());
            }
            formData.append("ClaimedProgress", Number(claimed));

            const res = await aiApi.verifyCompletion(taskId, formData);

            setResult(res);
            setPhase("done");

            if (onResult) await onResult(res);
        } catch (error) {
            console.error("Lỗi xác minh AI Vision:", error);
            setResult({
                ok: false,
                reasoning:
                    error?.reasoning ||
                    "Không thể kết nối với máy chủ AI Vision.",
                feedback:
                    error?.feedback ||
                    "Vui lòng kiểm tra lại đường truyền hoặc thử lại sau.",
            });
            setPhase("done");
        }
    };

    const currentProgressDisplay =
        phase === "done" && result?.ok
            ? result.progress || claimed
            : initialProgress;

    const stepCls =
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={onClose}
        >
            <div
                role="dialog"
                onMouseDown={(e) => e.stopPropagation()}
                className="my-auto w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-700"
            >
                <header className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-brand dark:bg-brand/20">
                        <SparkleIcon width={20} height={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
                            AI Proof Verification
                        </p>
                        <h3 className="truncate font-display text-lg font-bold text-ink dark:text-white">
                            {task.title}
                        </h3>
                        <div className="mt-3">
                            <Bar value={currentProgressDisplay} />
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline text-lg text-ink hover:bg-canvas dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
                    >
                        &times;
                    </button>
                </header>

                {/* Bước 1: Upload */}
                <section className="mt-7">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
                        <span
                            className={`${stepCls} bg-ink text-white dark:bg-brand dark:text-slate-900`}
                        >
                            1
                        </span>
                        Upload image proof
                    </h4>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (phase === "idle") setDrag(true);
                        }}
                        onDragLeave={() => setDrag(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDrag(false);
                            if (phase === "idle" && e.dataTransfer.files?.[0])
                                setFile(e.dataTransfer.files[0]);
                        }}
                        className={`rounded-3xl border-2 border-dashed p-5 text-center transition ${
                            drag
                                ? "border-brand bg-brand-soft dark:bg-brand/10"
                                : "border-hairline bg-canvas/60 dark:border-slate-700 dark:bg-slate-800/40"
                        }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            hidden
                            onChange={(e) => {
                                if (e.target.files?.[0])
                                    setFile(e.target.files[0]);
                                e.target.value = "";
                            }}
                        />
                        {file ? (
                            <div className="flex items-center gap-4 text-left">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Proof"
                                        className="h-20 w-28 shrink-0 rounded-2xl object-cover"
                                    />
                                ) : (
                                    <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-2xl bg-white text-xs font-semibold text-muted dark:bg-slate-800">
                                        No preview
                                    </span>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink dark:text-white">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted">
                                        {Math.max(
                                            1,
                                            Math.round(file.size / 1024),
                                        )}{" "}
                                        KB
                                    </p>
                                </div>
                                {phase === "idle" && (
                                    <button
                                        onClick={reset}
                                        className="text-xs font-semibold text-muted hover:text-ink dark:hover:text-white"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="py-4">
                                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-ink">
                                    <UploadIcon width={26} height={26} />
                                </span>
                                <p className="mt-3 text-sm font-semibold text-ink dark:text-white">
                                    Drag &amp; drop proof image, or{" "}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            inputRef.current?.click()
                                        }
                                        className="underline decoration-brand decoration-2 underline-offset-4"
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    PNG, JPG, WEBP
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Bước 2: Notes */}
                <section className="mt-7">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
                        <span
                            className={`${stepCls} bg-ink text-white dark:bg-brand dark:text-slate-900`}
                        >
                            2
                        </span>
                        User notes &amp; context
                    </h4>
                    <textarea
                        rows={3}
                        value={notes}
                        disabled={phase !== "idle"}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., Completed homepage wireframes..."
                        className="w-full resize-none rounded-2xl border border-hairline bg-white px-4 py-3 text-sm font-medium text-ink outline-none transition focus:border-brand disabled:opacity-60 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    />
                </section>

                {/* Bước 3: Range */}
                <section className="mt-7">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink dark:text-white">
                        <span
                            className={`${stepCls} bg-ink text-white dark:bg-brand dark:text-slate-900`}
                        >
                            3
                        </span>
                        Estimated completion
                    </h4>
                    <div className="rounded-2xl bg-canvas/70 p-4 dark:bg-slate-800/60">
                        <div className="flex items-center justify-between text-sm font-semibold text-ink dark:text-white">
                            <span>Claimed progress:</span>
                            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold dark:bg-brand/20 dark:text-brand">
                                {claimed}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={claimed}
                            disabled={phase !== "idle"}
                            onChange={(e) => setClaimed(Number(e.target.value))}
                            className="mt-3 w-full accent-[#F6C62E]"
                        />
                    </div>
                </section>

                {/* Action buttons */}
                {phase === "idle" && (
                    <div className="mt-7 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="h-11 rounded-2xl border border-hairline px-6 text-sm font-semibold text-ink hover:bg-canvas dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAnalyze}
                            disabled={!file}
                            className="flex h-11 items-center gap-2 rounded-2xl bg-ink px-6 text-sm font-semibold text-white hover:bg-black disabled:opacity-40 dark:!bg-brand dark:!text-slate-900"
                        >
                            <SparkleIcon width={16} height={16} /> Submit for AI
                            Review
                        </button>
                    </div>
                )}

                {/* Phase Review Result */}
                {phase !== "idle" && (
                    <section className="mt-7">
                        {phase === "analyzing" && (
                            <div className="flex items-center gap-4 rounded-3xl bg-canvas p-5 dark:bg-slate-800">
                                <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-hairline border-t-brand" />
                                <div>
                                    <p className="text-sm font-semibold text-ink dark:text-white">
                                        Analyzing proof...
                                    </p>
                                    <p className="text-xs text-muted">
                                        Checking image against task details
                                    </p>
                                </div>
                            </div>
                        )}

                        {phase === "done" && result && (
                            <div
                                className={`overflow-hidden rounded-3xl border ${
                                    result.ok
                                        ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30"
                                        : "border-orange-200 bg-orange-50/60 dark:border-orange-800 dark:bg-orange-950/30"
                                }`}
                            >
                                <div
                                    className={`flex items-center gap-3 px-5 py-3 text-white ${
                                        result.ok
                                            ? "bg-emerald-500"
                                            : "bg-orange-500"
                                    }`}
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25">
                                        {result.ok ? (
                                            <CheckIcon width={14} height={14} />
                                        ) : (
                                            "!"
                                        )}
                                    </span>
                                    <p className="text-sm font-bold">
                                        {result.ok
                                            ? "Task Verified!"
                                            : "Verification Incomplete"}
                                    </p>
                                </div>
                                <div className="space-y-4 p-5">
                                    <p className="text-sm leading-relaxed text-ink dark:text-slate-200">
                                        {result.reasoning ||
                                            result.feedback ||
                                            "Minh chứng chưa đạt yêu cầu kiểm định từ AI Vision."}
                                    </p>
                                    {result.ok ? (
                                        <button
                                            onClick={onClose}
                                            className="h-11 w-full rounded-2xl bg-ink text-sm font-semibold text-white hover:bg-black dark:!bg-brand dark:!text-slate-900"
                                        >
                                            Close
                                        </button>
                                    ) : (
                                        <button
                                            onClick={reset}
                                            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-bold text-ink hover:brightness-95"
                                        >
                                            <UploadIcon /> Try Another Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
