import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { ChevronDownIcon, UserIcon, BuildingIcon } from "./icon";
import apiClient from "../services/apiClient";

export default function WorkspaceSwitcher({ onSwitch }) {
    const {
        workspaces,
        currentWorkspace,
        switchWorkspace,
        addCompany,
        fetchWorkspaces,
        leaveWorkspace,
    } = useWorkspace();

    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [mode, setMode] = useState("create"); // "create" | "join"
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // 🟢 State quản lý Modal xác nhận Rời Workspace
    const [leaveTargetWs, setLeaveTargetWs] = useState(null);
    const [leaveLoading, setLeaveLoading] = useState(false);

    const root = useRef(null);
    const trigger = useRef(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const outside = (event) => {
            if (!root.current?.contains(event.target)) setOpen(false);
        };
        const escape = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
                trigger.current?.focus();
            }
        };
        document.addEventListener("pointerdown", outside);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("keydown", escape);
        };
    }, [open]);

    useEffect(() => {
        if (!dialog) return;
        dialogRef.current?.querySelector("input")?.focus();
        const handleKey = (event) => {
            if (event.key === "Escape") setDialog(false);
        };
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("keydown", handleKey);
            trigger.current?.focus();
        };
    }, [dialog]);

    const select = (workspace) => {
        switchWorkspace(workspace.id);
        setOpen(false);
        navigate("/dashboard");
        onSwitch?.();
    };

    // 🟢 Mở Custom Modal xác nhận (thay cho window.confirm)
    const handleLeaveClick = (e, workspace) => {
        e.stopPropagation();
        setOpen(false);
        setLeaveTargetWs(workspace);
    };

    // 🟢 Thực thi Rời khỏi Workspace
    const confirmLeaveWorkspace = async () => {
        if (!leaveTargetWs) return;

        setLeaveLoading(true);
        try {
            if (leaveWorkspace) {
                await leaveWorkspace(leaveTargetWs.id);
            } else {
                await apiClient.post(`/workspaces/${leaveTargetWs.id}/leave`);
                await fetchWorkspaces();
                if (currentWorkspace.id === leaveTargetWs.id) {
                    switchWorkspace("personal");
                }
            }
            setLeaveTargetWs(null);
        } catch (err) {
            console.error("Failed to leave workspace:", err);
            alert(
                err?.response?.data?.message ||
                    "Failed to leave workspace. Please try again.",
            );
        } finally {
            setLeaveLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const inputVal = name.trim();

        if (!inputVal) {
            return setError(
                mode === "create"
                    ? "Please enter a company name."
                    : "Please enter a join code.",
            );
        }

        setLoading(true);
        setError("");

        try {
            if (mode === "create") {
                if (
                    workspaces.some(
                        (w) => w.name.toLowerCase() === inputVal.toLowerCase(),
                    )
                ) {
                    setLoading(false);
                    return setError(
                        "This workspace already exists. Select it from the switcher.",
                    );
                }
                await addCompany(inputVal);
            } else {
                await apiClient.post("/workspaces/join", {
                    joinCode: inputVal,
                });
                await fetchWorkspaces();
            }

            setDialog(false);
            setOpen(false);
            setName("");
            navigate("/dashboard");
            onSwitch?.();
        } catch (err) {
            console.error("Workspace action failed:", err);
            setError(
                err?.response?.data?.message ||
                    (mode === "create"
                        ? "Failed to create company."
                        : "Invalid join code or network error."),
            );
        } finally {
            setLoading(false);
        }
    };

    const row = (workspace) => {
        const Icon = workspace.type === "personal" ? UserIcon : BuildingIcon;
        const selected = workspace.id === currentWorkspace.id;
        return (
            <div
                key={workspace.id}
                className="group relative flex w-full items-center"
            >
                <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => select(workspace)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        selected
                            ? "bg-brand-soft dark:bg-amber-400/10"
                            : "hover:bg-canvas"
                    }`}
                >
                    <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            selected
                                ? "bg-brand text-slate-950"
                                : "bg-canvas text-muted"
                        }`}
                    >
                        <Icon width={17} height={17} />
                    </span>
                    <span className="min-w-0 flex-1 pr-6">
                        <span className="block truncate text-sm font-semibold text-ink">
                            {workspace.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                            {workspace.type === "personal"
                                ? "Tasks, timesheets & todos"
                                : `Role: ${workspace.role}`}
                        </span>
                    </span>
                    {selected && (
                        <span className="mr-1 text-sm text-amber-600 dark:text-amber-300">
                            ✓
                        </span>
                    )}
                </button>

                {/* Nút kích hoạt Modal Rời Nhóm */}
                {workspace.type === "company" && (
                    <button
                        type="button"
                        title="Leave Workspace"
                        onClick={(e) => handleLeaveClick(e, workspace)}
                        className="absolute right-2 hidden rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 group-hover:block dark:hover:bg-red-950/40"
                    >
                        <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="relative mt-6" ref={root}>
            <span className="mb-2 block px-1 text-xs font-medium text-muted">
                Workspace
            </span>
            <button
                ref={trigger}
                aria-expanded={open}
                aria-controls="workspace-popover"
                onClick={() => setOpen((previous) => !previous)}
                className="flex w-full items-center gap-2 rounded-2xl border border-hairline px-4 py-3 text-sm font-medium text-ink transition hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
                <span className="min-w-0 flex-1 truncate text-left">
                    {currentWorkspace.name}
                </span>
                <ChevronDownIcon
                    width={16}
                    height={16}
                    className={`text-muted transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>
            <div
                id="workspace-popover"
                aria-label="Choose workspace"
                inert={!open}
                className={`absolute bottom-full left-0 z-50 mb-3 max-h-[65vh] w-[280px] max-w-[calc(100vw-40px)] origin-bottom-left overflow-y-auto rounded-2xl border border-hairline bg-white p-2 shadow-[0_15px_50px_rgba(0,0,0,0.16)] transition-all duration-200 motion-reduce:transition-none dark:border-slate-700 dark:bg-slate-900 ${
                    open
                        ? "visible translate-y-0 scale-100 opacity-100"
                        : "invisible translate-y-2 scale-95 opacity-0"
                }`}
            >
                <p className="px-3 pb-2 pt-3 text-[9px] font-semibold tracking-[0.12em] text-muted">
                    PERSONAL WORKSPACE
                </p>
                {workspaces
                    .filter((workspace) => workspace.type === "personal")
                    .map(row)}
                <div className="my-2 border-t border-hairline" />
                <p className="px-3 pb-2 pt-2 text-[9px] font-semibold tracking-[0.12em] text-muted">
                    COMPANY WORKSPACES
                </p>
                {workspaces
                    .filter((workspace) => workspace.type === "company")
                    .map(row)}
                <div className="my-2 border-t border-hairline" />
                <button
                    onClick={() => {
                        setOpen(false);
                        setName("");
                        setError("");
                        setMode("create");
                        setDialog(true);
                    }}
                    className="w-full rounded-xl px-3 py-3 text-left text-xs font-semibold text-ink transition hover:bg-canvas"
                >
                    ＋ Create or Join Company
                </button>
            </div>

            {/* Modal Tạo/Tham gia Công ty */}
            {dialog &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm"
                        onClick={() => setDialog(false)}
                    >
                        <div
                            ref={dialogRef}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="company-dialog-title"
                            onClick={(event) => event.stopPropagation()}
                            className="w-full max-w-md rounded-2xl border border-hairline bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="mb-5 flex justify-between">
                                <h2
                                    id="company-dialog-title"
                                    className="text-lg font-semibold text-ink dark:text-white"
                                >
                                    Create or join a company
                                </h2>
                                <button
                                    aria-label="Close company dialog"
                                    className="text-muted hover:text-ink dark:hover:text-white"
                                    onClick={() => setDialog(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-5 flex gap-2 rounded-xl bg-canvas p-1 dark:bg-slate-800">
                                {["create", "join"].map((value) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => {
                                            setMode(value);
                                            setError("");
                                            setName("");
                                        }}
                                        aria-pressed={mode === value}
                                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                            mode === value
                                                ? "bg-brand text-slate-950 shadow-sm"
                                                : "text-muted hover:text-ink dark:hover:text-white"
                                        }`}
                                    >
                                        {value === "create"
                                            ? "Create company"
                                            : "Join company"}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label className="block text-xs font-medium text-ink dark:text-slate-200">
                                    {mode === "create"
                                        ? "Company name"
                                        : "Company Join Code"}
                                    <input
                                        value={name}
                                        onChange={(event) => {
                                            setName(event.target.value);
                                            setError("");
                                        }}
                                        required
                                        maxLength={60}
                                        className="mt-2 w-full rounded-xl border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        placeholder={
                                            mode === "create"
                                                ? "e.g. Matrix Domain Co."
                                                : "e.g. MX-8921"
                                        }
                                    />
                                </label>

                                <p className="my-4 text-xs leading-5 text-muted">
                                    {mode === "create"
                                        ? "Create a new company workspace for your team. You will be assigned the Manager role."
                                        : "Enter the join code provided by your Manager to join an existing company workspace."}
                                </p>

                                {error && (
                                    <p
                                        role="alert"
                                        className="mb-3 text-xs text-red-500"
                                    >
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-slate-950 transition hover:brightness-95 disabled:opacity-50"
                                >
                                    {loading
                                        ? "Processing..."
                                        : mode === "create"
                                          ? "Create workspace"
                                          : "Join workspace"}
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body,
                )}

            {/* 🟢 CUSTOM MODAL XÁC NHẬN RỜI WORKSPACE */}
            {leaveTargetWs &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm"
                        onClick={() => setLeaveTargetWs(null)}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            className="w-full max-w-sm rounded-3xl border border-hairline bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                        >
                            <div className="mb-3 flex items-center gap-3 text-red-500">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/40">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line
                                            x1="21"
                                            y1="12"
                                            x2="9"
                                            y2="12"
                                        ></line>
                                    </svg>
                                </div>
                                <h3 className="font-display text-lg font-bold text-ink dark:text-white">
                                    Leave Workspace
                                </h3>
                            </div>

                            <p className="text-xs text-muted">
                                Are you sure you want to leave{" "}
                                <span className="font-bold text-ink dark:text-white">
                                    "{leaveTargetWs.name}"
                                </span>
                                ? You will lose access to all tasks and projects
                                in this workspace.
                            </p>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setLeaveTargetWs(null)}
                                    className="rounded-xl border border-hairline px-4 py-2.5 text-xs font-semibold text-muted transition hover:text-ink dark:border-slate-700 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={leaveLoading}
                                    onClick={confirmLeaveWorkspace}
                                    className="rounded-xl bg-red-500 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                                >
                                    {leaveLoading
                                        ? "Leaving..."
                                        : "Leave Workspace"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
