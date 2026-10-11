import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { ChevronDownIcon, UserIcon, BuildingIcon } from "./icon";

export default function WorkspaceSwitcher({ onSwitch }) {
    const { workspaces, currentWorkspace, switchWorkspace, addCompany } =
        useWorkspace();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [dialog, setDialog] = useState(false);
    const [mode, setMode] = useState("create");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
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
            if (event.key === "Tab") {
                const items =
                    dialogRef.current.querySelectorAll("button, input");
                const first = items[0];
                const last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
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
    const row = (workspace) => {
        const Icon = workspace.type === "personal" ? UserIcon : BuildingIcon;
        const selected = workspace.id === currentWorkspace.id;
        return (
            <button
                key={workspace.id}
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
                <span className="min-w-0 flex-1">
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
                    <span className="text-sm text-amber-600 dark:text-amber-300">
                        ✓
                    </span>
                )}
            </button>
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
                        setDialog(true);
                    }}
                    className="w-full rounded-xl px-3 py-3 text-left text-xs font-semibold text-ink transition hover:bg-canvas"
                >
                    ＋ Create or Join Company
                </button>
            </div>
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
                                    className="text-lg font-semibold text-ink"
                                >
                                    Create or join a company
                                </h2>
                                <button
                                    aria-label="Close company dialog"
                                    className="text-muted"
                                    onClick={() => setDialog(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="mb-5 flex gap-2 rounded-xl bg-canvas p-1">
                                {["create", "join"].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setMode(value)}
                                        aria-pressed={mode === value}
                                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                                            mode === value
                                                ? "bg-brand text-slate-950"
                                                : "text-muted"
                                        }`}
                                    >
                                        {value === "create"
                                            ? "Create company"
                                            : "Join company"}
                                    </button>
                                ))}
                            </div>
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!name.trim())
                                        return setError(
                                            "Please enter a company name.",
                                        );
                                    if (
                                        workspaces.some(
                                            (workspace) =>
                                                workspace.name.toLowerCase() ===
                                                name.trim().toLowerCase(),
                                        )
                                    )
                                        return setError(
                                            "This workspace already exists. Select it from the switcher.",
                                        );
                                    addCompany(name, mode);
                                    setDialog(false);
                                    navigate("/dashboard");
                                    onSwitch?.();
                                }}
                            >
                                <label className="block text-xs font-medium text-ink">
                                    Company name
                                    <input
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        required
                                        maxLength={60}
                                        className="mt-2 w-full rounded-xl border border-hairline bg-canvas px-3 py-3 text-sm text-ink outline-none focus:border-brand"
                                        placeholder="Your company name"
                                    />
                                </label>
                                <p className="my-4 text-xs leading-5 text-muted">
                                    {mode === "create"
                                        ? "Create a local demo workspace with the Manager role."
                                        : "Add a local demo workspace with the Employee role. Real company membership requires a verified invitation and backend connection."}
                                </p>
                                {error && (
                                    <p
                                        role="alert"
                                        className="mb-3 text-xs text-red-500"
                                    >
                                        {error}
                                    </p>
                                )}
                                <button className="w-full rounded-xl bg-brand py-3 text-sm font-semibold text-slate-950">
                                    {mode === "create"
                                        ? "Create workspace"
                                        : "Join demo workspace"}
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    );
}
