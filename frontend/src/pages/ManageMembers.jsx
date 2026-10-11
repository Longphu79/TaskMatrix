import { useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

const SELECT_CLS =
    "rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white";

export default function ManageMembers() {
    const {
        currentWorkspace,
        members = [],
        addMember,
        setMemberRole,
        removeMember,
    } = useWorkspace();
    const [name, setName] = useState("");
    const [role, setRole] = useState("Employee");
    const managers = members.filter((m) => m.role === "Manager").length;

    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addMember?.(name, role);
        setName("");
        setRole("Employee");
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            <h2 className="font-display text-3xl font-bold text-ink dark:text-white">
                Manage Members
            </h2>
            <p className="mt-1 mb-6 text-sm font-medium text-muted">
                {currentWorkspace?.name} · {members.length} members
            </p>

            <form
                onSubmit={submit}
                className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50"
            >
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Member name"
                    aria-label="Member name"
                    className={`${SELECT_CLS} min-w-[200px] flex-1`}
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    aria-label="Role"
                    className={SELECT_CLS}
                >
                    <option>Employee</option>
                    <option>Manager</option>
                </select>
                <button
                    type="submit"
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    Add Member
                </button>
            </form>

            <div className="space-y-3">
                {members.map((m) => {
                    const lastManager = m.role === "Manager" && managers === 1;

                    // Lấy đường dẫn ảnh nếu có dạng http/https hoặc /
                    const isImageUrl =
                        typeof m.avatar === "string" &&
                        (m.avatar.startsWith("http") ||
                            m.avatar.startsWith("/"));

                    // Tạo chữ cái đầu nếu không có ảnh
                    const initials = m.name
                        ? m.name.trim().charAt(0).toUpperCase()
                        : "U";

                    return (
                        <div
                            key={m.id || m.name}
                            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:bg-slate-900 dark:border dark:border-slate-700/50"
                        >
                            {/* Hiển thị Avatar dạng Ảnh hoặc Chữ viết tắt */}
                            {isImageUrl ? (
                                <img
                                    src={m.avatar}
                                    alt={m.name}
                                    className="h-10 w-10 shrink-0 rounded-full object-cover bg-canvas dark:bg-slate-800"
                                    onError={(e) => {
                                        // Fallback về 1 ảnh mặc định nếu URL bị hỏng
                                        e.currentTarget.src =
                                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                                    }}
                                />
                            ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                                    {initials}
                                </span>
                            )}

                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink dark:text-white">
                                {m.name}
                            </span>

                            <select
                                value={m.role}
                                disabled={lastManager}
                                onChange={(e) =>
                                    setMemberRole?.(m.id, e.target.value)
                                }
                                aria-label={`Role for ${m.name}`}
                                className={SELECT_CLS}
                            >
                                <option>Manager</option>
                                <option>Employee</option>
                            </select>

                            <button
                                onClick={() => removeMember?.(m.id)}
                                disabled={lastManager}
                                className="rounded-lg px-3 py-2 text-sm text-[#e05656] transition hover:bg-[#fdecec] dark:hover:bg-rose-950/30 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Remove
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
