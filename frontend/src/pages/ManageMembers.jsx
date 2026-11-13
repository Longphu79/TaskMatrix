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
    const [copied, setCopied] = useState(false);

    const managers = members.filter(
        (m) => (m.role || m.Role) === "Manager",
    ).length;

    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addMember?.(name, role);
        setName("");
        setRole("Employee");
    };

    const copyJoinCode = () => {
        if (!currentWorkspace?.joinCode) return;
        navigator.clipboard.writeText(currentWorkspace.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="px-5 pb-8 lg:px-8">
            {/* Header & Thông tin Workspace */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="font-display text-3xl font-bold text-ink dark:text-white">
                        Manage Members
                    </h2>
                    <p className="mt-1 text-sm font-medium text-muted">
                        {currentWorkspace?.name} · {members.length} members
                    </p>
                </div>

                {/* Khối hiển thị Mã Join Code để Manager dễ gửi cho thành viên */}
                {currentWorkspace?.joinCode && (
                    <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <span className="text-xs font-medium text-muted">
                            Join Code:
                        </span>
                        <code className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                            {currentWorkspace.joinCode}
                        </code>
                        <button
                            type="button"
                            onClick={copyJoinCode}
                            className="rounded-lg bg-canvas px-2.5 py-1 text-xs font-semibold text-ink transition hover:bg-brand hover:text-slate-950 dark:bg-slate-800 dark:text-white"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                )}
            </div>

            {/* Form Thêm Thành Viên */}
            <form
                onSubmit={submit}
                className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-900"
            >
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Member name or email"
                    aria-label="Member name"
                    className={`${SELECT_CLS} min-w-[200px] flex-1`}
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    aria-label="Role"
                    className={SELECT_CLS}
                >
                    <option value="Member">Member</option>
                    <option value="Manager">Manager</option>
                </select>
                <button
                    type="submit"
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    Add Member
                </button>
            </form>

            {/* Danh sách thành viên */}
            <div className="space-y-3">
                {members.map((m, index) => {
                    // 🟢 Chuẩn hóa dữ liệu tương thích giữa cả backend DTO và local state
                    const memberId = m.userId || m.id || `member-${index}`;
                    const memberName =
                        m.fullName || m.name || m.email || "Member";
                    const memberRole = m.role || m.Role || "Employee";

                    const lastManager =
                        memberRole === "Manager" && managers === 1;

                    const isImageUrl =
                        typeof m.avatar === "string" &&
                        (m.avatar.startsWith("http") ||
                            m.avatar.startsWith("/"));

                    const initials = memberName.trim().charAt(0).toUpperCase();

                    return (
                        <div
                            key={memberId} // 🟢 Fix triệt để lỗi key duy nhất ở đây
                            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 dark:bg-slate-900"
                        >
                            {/* Avatar */}
                            {isImageUrl ? (
                                <img
                                    src={m.avatar}
                                    alt={memberName}
                                    className="h-10 w-10 shrink-0 rounded-full bg-canvas object-cover dark:bg-slate-800"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                                    }}
                                />
                            ) : (
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-ink dark:bg-brand/15 dark:text-brand">
                                    {initials}
                                </span>
                            )}

                            {/* Tên & Email */}
                            <div className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-ink dark:text-white">
                                    {memberName}
                                </span>
                                {m.email && (
                                    <span className="block truncate text-xs text-muted">
                                        {m.email}
                                    </span>
                                )}
                            </div>

                            {/* Phân quyền Role */}
                            <select
                                value={memberRole}
                                disabled={lastManager}
                                onChange={(e) =>
                                    setMemberRole?.(memberId, e.target.value)
                                }
                                aria-label={`Role for ${memberName}`}
                                className={SELECT_CLS}
                            >
                                <option value="Manager">Manager</option>
                                <option value="Member">Member</option>
                            </select>

                            {/* Nút Xóa Thành Viên */}
                            <button
                                type="button"
                                onClick={() => removeMember?.(memberId)}
                                disabled={lastManager}
                                className="rounded-lg px-3 py-2 text-sm text-[#e05656] transition hover:bg-[#fdecec] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/30"
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
