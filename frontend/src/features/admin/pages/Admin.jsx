import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import {
    GridIcon,
    UserIcon,
    FolderIcon,
    CogIcon,
    FileIcon,
    SettingsIcon,
    SearchIcon,
    BellIcon,
    ThemeIcon,
    MenuIcon,
    LogoutIcon,
    ChartIcon,
    ChevronDownIcon,
} from "../../../components/icon";

const modules = [
    { slug: "", name: "Executive Overview", Icon: GridIcon, short: "Overview" },
    { slug: "users", name: "User Management", Icon: UserIcon, short: "Users" },
    {
        slug: "projects",
        name: "Projects & Tasks",
        Icon: FolderIcon,
        short: "Projects",
    },
    {
        slug: "roles",
        name: "Roles & Permissions",
        Icon: CogIcon,
        short: "Permissions",
    },
    {
        slug: "security",
        name: "Audit Logs & Security",
        Icon: FileIcon,
        short: "Security",
    },
    {
        slug: "settings",
        name: "Global Settings",
        Icon: SettingsIcon,
        short: "Settings",
    },
];
const names = [
    "Olivia Rhye",
    "Phoenix Baker",
    "Lana Steiner",
    "Demi Wilkinson",
    "Drew Cano",
    "Natali Craig",
    "Orlando Diggs",
    "Andi Lane",
    "Kate Morrison",
    "Alex Morgan",
    "Sam Taylor",
    "Jamie Chen",
    "Jordan Lee",
    "Robin Parker",
];
const initialUsers = names.map((name, index) => ({
    id: index + 1,
    name,
    email: `${name.toLowerCase().replaceAll(" ", ".")}@tasky.co`,
    role: index === 0 ? "Admin" : index % 3 === 0 ? "Manager" : "User",
    status: index === 5 ? "Suspended" : index === 8 ? "Pending" : "Active",
    joined: `Oct ${String(14 - index).padStart(2, "0")}, 2026`,
    projects: 3 + (index % 7),
}));
const initialLogs = [
    {
        id: 1,
        actor: "Olivia Rhye",
        action: "Updated workspace permissions",
        type: "Permissions",
        severity: "Info",
        ip: "192.168.1.24",
        time: "2026-10-06T14:42:00",
    },
    {
        id: 2,
        actor: "Phoenix Baker",
        action: "Created project: Website redesign",
        type: "Project",
        severity: "Info",
        ip: "192.168.1.18",
        time: "2026-10-06T14:38:00",
    },
    {
        id: 3,
        actor: "System",
        action: "Multiple unsuccessful login attempts",
        type: "Security",
        severity: "Warning",
        ip: "103.21.244.8",
        time: "2026-10-06T14:32:00",
    },
    {
        id: 4,
        actor: "Olivia Rhye",
        action: "Invited 3 new workspace members",
        type: "User",
        severity: "Info",
        ip: "192.168.1.24",
        time: "2026-10-06T14:28:00",
    },
    {
        id: 5,
        actor: "System",
        action: "Daily automated backup completed",
        type: "System",
        severity: "Success",
        ip: "10.0.0.1",
        time: "2026-10-06T14:00:00",
    },
];
const initialProjects = [
    {
        name: "Website redesign",
        team: "Design",
        owner: "Olivia Rhye",
        tasks: 48,
        done: 36,
        status: "On track",
        color: "bg-violet-100 text-violet-600",
    },
    {
        name: "Mobile app v2.0",
        team: "Engineering",
        owner: "Phoenix Baker",
        tasks: 72,
        done: 43,
        status: "At risk",
        color: "bg-blue-100 text-blue-600",
    },
    {
        name: "Q4 marketing campaign",
        team: "Marketing",
        owner: "Lana Steiner",
        tasks: 32,
        done: 27,
        status: "On track",
        color: "bg-orange-100 text-orange-600",
    },
    {
        name: "Customer onboarding",
        team: "Product",
        owner: "Demi Wilkinson",
        tasks: 25,
        done: 25,
        status: "Completed",
        color: "bg-emerald-100 text-emerald-600",
    },
];
const panel =
    "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";
const input =
    "min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/40 dark:border-slate-700 dark:bg-slate-900";
function useStored(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(key)) ?? initial;
        } catch {
            return initial;
        }
    });
    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
}
function Button({ children, primary, danger, className = "", ...props }) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                primary
                    ? "bg-brand text-slate-950 hover:bg-amber-300"
                    : danger
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            } ${className}`}
        >
            {children}
        </button>
    );
}
function Badge({ children }) {
    const good = [
        "Active",
        "On track",
        "Success",
        "Completed",
        "Operational",
    ].includes(children);
    const bad = ["Suspended", "Critical"].includes(children);
    return (
        <span
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${
                good
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : bad
                      ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                      : ["Pending", "Warning", "At risk"].includes(children)
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
        >
            <span className="h-1 w-1 rounded-full bg-current" />
            {children}
        </span>
    );
}
function Toggle({ checked, onChange, label, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-label={label}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition disabled:opacity-40 ${
                checked ? "bg-amber-400" : "bg-slate-200 dark:bg-slate-700"
            }`}
        >
            <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                    checked ? "left-[18px]" : "left-0.5"
                }`}
            />
        </button>
    );
}
function Avatar({ name, small }) {
    return (
        <span
            className={`flex shrink-0 items-center justify-center rounded-full bg-[#eee9de] font-semibold text-[#746347] dark:bg-slate-700 dark:text-amber-200 ${
                small ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-xs"
            }`}
        >
            {name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
        </span>
    );
}
function SectionTitle({ title, subtitle, children }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                {subtitle && (
                    <p className="mt-1 text-[11px] text-slate-400">
                        {subtitle}
                    </p>
                )}
            </div>
            {children}
        </div>
    );
}
function Modal({ title, children, close }) {
    const ref = useRef(null);
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(() => {
        const previous = document.activeElement;
        const firstInput = ref.current?.querySelector("input");
        (firstInput || ref.current)?.focus();
        const handler = (event) => {
            if (event.key === "Escape") closeRef.current();
            if (event.key === "Tab") {
                const nodes = ref.current.querySelectorAll(
                    'button, input, select, [tabindex="0"]',
                );
                const first = nodes[0];
                const last = nodes[nodes.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };
        document.addEventListener("keydown", handler);
        return () => {
            document.removeEventListener("keydown", handler);
            previous?.focus();
        };
    }, []);
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
            onClick={close}
        >
            <div
                ref={ref}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
                className={`${panel} max-h-[85vh] w-full max-w-lg overflow-auto p-6 shadow-2xl outline-none`}
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        aria-label="Close dialog"
                        onClick={close}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
function GrowthChart({ period }) {
    const [hover, setHover] = useState(null);
    const values =
        period === "30 days"
            ? [22, 30, 26, 39, 34, 48, 42, 57, 51, 65, 63, 78]
            : [14, 20, 33, 29, 42, 38, 54, 49, 60, 68, 64, 85];
    const points = values
        .map((value, index) => `${index * 48 + 15},${160 - value * 1.5}`)
        .join(" ");
    return (
        <div className="relative px-5 pb-4 pt-6">
            <div className="absolute left-5 top-5 space-y-8 text-[10px] text-slate-400">
                <div>12,000</div>
                <div>9,000</div>
                <div>6,000</div>
                <div>3,000</div>
            </div>
            <div className="ml-10">
                <svg
                    viewBox="0 0 560 180"
                    className="h-44 w-full overflow-visible"
                    role="img"
                    aria-label="User growth chart"
                >
                    <defs>
                        <linearGradient
                            id="growth-fill"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#f6c62e"
                                stopOpacity=".25"
                            />
                            <stop
                                offset="100%"
                                stopColor="#f6c62e"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    {[20, 65, 110, 155].map((height) => (
                        <line
                            key={height}
                            x1="0"
                            y1={height}
                            x2="560"
                            y2={height}
                            className="stroke-slate-100 dark:stroke-slate-800"
                            strokeDasharray="4 4"
                        />
                    ))}
                    <polygon
                        points={`15,175 ${points} 543,175`}
                        fill="url(#growth-fill)"
                    />
                    <polyline
                        points={points}
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="3"
                        strokeLinejoin="round"
                    />
                    <polyline
                        points="15,155 63,144 111,149 159,127 207,135 255,111 303,117 351,95 399,104 447,79 495,88 543,63"
                        fill="none"
                        stroke="#a5b4fc"
                        strokeWidth="2"
                        strokeDasharray="5 4"
                    />
                    {values.map((value, index) => (
                        <circle
                            key={index}
                            cx={index * 48 + 15}
                            cy={160 - value * 1.5}
                            r={hover === index ? 6 : 10}
                            fill={hover === index ? "#eab308" : "transparent"}
                            tabIndex="0"
                            aria-label={`Period ${index + 1}: ${value * 140} users`}
                            onMouseEnter={() => setHover(index)}
                            onFocus={() => setHover(index)}
                            onBlur={() => setHover(null)}
                            onMouseLeave={() => setHover(null)}
                        />
                    ))}
                </svg>
                <div className="flex justify-between text-[10px] text-slate-400">
                    {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month) => (
                        <span key={month}>{month}</span>
                    ))}
                </div>
            </div>
            {hover !== null && (
                <div className="absolute right-6 top-4 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
                    {(values[hover] * 140).toLocaleString()} users
                </div>
            )}
        </div>
    );
}

export default function AdminPage() {
    const { user, logout } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const active =
        modules.find((item) => item.slug === location.pathname.split("/")[2]) ||
        modules[0];
    const [users, setUsers] = useStored("tasky-admin-users", initialUsers);
    const [logs, setLogs] = useStored("tasky-admin-logs", initialLogs);
    const [projects, setProjects] = useStored(
        "tasky-admin-projects",
        initialProjects,
    );
    const [permissions, setPermissions] = useStored(
        "tasky-admin-permissions",
        {},
    );
    const [settings, setSettings] = useStored("tasky-admin-settings", {
        maintenance: false,
        registrations: true,
        twoFactor: true,
        ai: false,
        timeTracking: true,
        beta: false,
        name: "TASKY Workspace",
        email: "support@tasky.co",
    });
    const [toast, setToast] = useState("");
    const [mobile, setMobile] = useState(false);
    const [dropdown, setDropdown] = useState("");
    const [command, setCommand] = useState(false);
    const [commandQuery, setCommandQuery] = useState("");
    const [unread, setUnread] = useState(true);
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("All roles");
    const [status, setStatus] = useState("All statuses");
    const [sort, setSort] = useState({ key: "name", asc: true });
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "User",
        status: "Pending",
    });
    const [formError, setFormError] = useState("");
    const [period, setPeriod] = useState("30 days");
    const [chart, setChart] = useState("growth");
    const [severity, setSeverity] = useState("All severities");
    const [auditQuery, setAuditQuery] = useState("");
    const [projectQuery, setProjectQuery] = useState("");
    const [projectStatus, setProjectStatus] = useState("All projects");
    const notify = (message) => setToast(message);
    const record = (action, type = "User", severity = "Info") =>
        setLogs((previous) => [
            {
                id: Date.now(),
                actor: user?.name || "Admin",
                action,
                type,
                severity,
                ip: "Local demo",
                time: new Date().toISOString(),
            },
            ...previous,
        ]);
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(""), 4500);
        return () => clearTimeout(timer);
    }, [toast]);
    useEffect(() => {
        const handler = (event) => {
            if (
                (event.metaKey || event.ctrlKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                setCommand((previous) => !previous);
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);
    useEffect(() => {
        setPage(1);
        setSelected([]);
    }, [query, role, status]);
    const filteredUsers = useMemo(
        () =>
            users
                .filter(
                    (member) =>
                        `${member.name} ${member.email}`
                            .toLowerCase()
                            .includes(query.toLowerCase()) &&
                        (role === "All roles" || role === member.role) &&
                        (status === "All statuses" || status === member.status),
                )
                .sort(
                    (first, second) =>
                        (sort.key === "projects"
                            ? first.projects - second.projects
                            : String(first[sort.key]).localeCompare(
                                  String(second[sort.key]),
                              )) * (sort.asc ? 1 : -1),
                ),
        [users, query, role, status, sort],
    );
    const pages = Math.max(1, Math.ceil(filteredUsers.length / 7));
    const currentPage = Math.min(page, pages);
    const rows = filteredUsers.slice((currentPage - 1) * 7, currentPage * 7);
    const changeSetting = (key, value) => {
        setSettings((previous) => ({ ...previous, [key]: value }));
        record(
            `${key} ${
                typeof value === "boolean"
                    ? value
                        ? "enabled"
                        : "disabled"
                    : "updated"
            }`,
            "System",
        );
        notify("Workspace setting saved locally");
    };
    const exportData = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        notify(`${filename} downloaded`);
    };
    const editUser = (member) => {
        setForm(
            member || { name: "", email: "", role: "User", status: "Pending" },
        );
        setFormError("");
        setModal({
            type: "user",
            title: member ? "Edit user" : "Add new user",
        });
    };
    const confirm = (title, description, run) =>
        setModal({ type: "confirm", title, description, run });
    const suspend = (ids) => {
        setUsers((previous) =>
            previous.map((member) =>
                ids.includes(member.id)
                    ? { ...member, status: "Suspended" }
                    : member,
            ),
        );
        record(`Suspended ${ids.length} user(s)`, "User", "Warning");
        setSelected([]);
        notify("Selected users suspended");
    };
    const deleteUsers = (ids) => {
        setUsers((previous) =>
            previous.filter((member) => !ids.includes(member.id)),
        );
        record(`Deleted ${ids.length} user(s)`, "User", "Warning");
        setSelected([]);
        notify("Users deleted");
    };
    const saveUser = (event) => {
        event.preventDefault();
        if (!form.name.trim()) return setFormError("Please enter a name.");
        if (
            users.some(
                (member) =>
                    member.email.toLowerCase() === form.email.toLowerCase() &&
                    member.id !== form.id,
            )
        )
            return setFormError("This email is already in use.");
        const member = {
            ...form,
            name: form.name.trim(),
            id: form.id || Date.now(),
            joined: form.joined || new Date().toLocaleDateString("en-US"),
            projects: form.projects || 0,
        };
        setUsers((previous) =>
            form.id
                ? previous.map((item) => (item.id === form.id ? member : item))
                : [member, ...previous],
        );
        record(`${form.id ? "Updated" : "Added"} user ${member.name}`);
        setModal(null);
        notify(form.id ? "User updated" : "User added to workspace");
    };
    const auditRows = logs.filter(
        (log) =>
            (severity === "All severities" || log.severity === severity) &&
            `${log.action} ${log.actor} ${log.ip}`
                .toLowerCase()
                .includes(auditQuery.toLowerCase()),
    );
    const projectRows = projects.filter(
        (project) =>
            project.name.toLowerCase().includes(projectQuery.toLowerCase()) &&
            (projectStatus === "All projects" ||
                project.status === projectStatus),
    );
    const commandItems = [
        ...modules.map((item) => ({
            label: item.name,
            action: () => navigate(`/admin${item.slug ? `/${item.slug}` : ""}`),
        })),
        ...users
            .filter(
                (member) =>
                    commandQuery &&
                    member.name
                        .toLowerCase()
                        .includes(commandQuery.toLowerCase()),
            )
            .slice(0, 4)
            .map((member) => ({
                label: `Edit ${member.name}`,
                action: () => {
                    navigate("/admin/users");
                    editUser(member);
                },
            })),
    ].filter((item) =>
        item.label.toLowerCase().includes(commandQuery.toLowerCase()),
    );
    return (
        <div className="min-h-screen bg-[#f7f8fa] text-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {mobile && (
                <button
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-30 bg-black/30 lg:hidden"
                    onClick={() => setMobile(false)}
                />
            )}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
                    mobile ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <Link
                    to="/admin"
                    className="flex h-[76px] items-center gap-2.5 px-6"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-lg font-black text-slate-950">
                        ✓
                    </span>
                    <span className="font-display text-xl font-bold tracking-[0.02em]">
                        MATRIX<span className="text-amber-400">.</span>
                    </span>
                    <span className="ml-auto rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-slate-400 dark:border-slate-700">
                        ADMIN
                    </span>
                </Link>
                <div className="mx-4 mb-7 flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                        <FolderIcon width={16} height={16} />
                    </span>
                    <div className="flex-1">
                        <p className="text-xs font-semibold">TASKY Workspace</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            Enterprise plan
                        </p>
                    </div>
                    <ChevronDownIcon width={14} />
                </div>
                <p className="px-6 text-[9px] font-semibold tracking-[0.14em] text-slate-400">
                    WORKSPACE MANAGEMENT
                </p>
                <nav className="mt-3 space-y-1 px-3">
                    {modules.map(({ slug, name, Icon }) => (
                        <NavLink
                            key={name}
                            end={!slug}
                            to={`/admin${slug ? `/${slug}` : ""}`}
                            onClick={() => setMobile(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-3 text-xs transition ${
                                    isActive
                                        ? "bg-[#fff5d5] font-semibold text-slate-900 dark:bg-amber-400/15 dark:text-amber-200"
                                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                                }`
                            }
                        >
                            <Icon width={17} height={17} />
                            {name}
                            {slug === "users" && (
                                <span className="ml-auto text-[9px] text-slate-400">
                                    {users.length}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto p-4">
                    <div className="mb-4 rounded-xl bg-[#f8f7f2] p-4 dark:bg-slate-800">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    settings.maintenance
                                        ? "bg-amber-400"
                                        : "bg-emerald-500"
                                }`}
                            />
                            {settings.maintenance
                                ? "Maintenance enabled"
                                : "All systems operational"}
                        </div>
                        <p className="mt-2 text-[10px] leading-5 text-slate-400">
                            Last checked just now
                            <br />
                            Uptime: 99.98% this month
                        </p>
                        <Link
                            to="/admin/security"
                            className="mt-2 inline-block text-[10px] font-medium"
                        >
                            View system status ↗
                        </Link>
                    </div>
                    <Link
                        to="/dashboard"
                        className="flex items-center gap-3 px-2 py-2 text-xs text-slate-500"
                    >
                        <span>↗</span>Back to main app
                    </Link>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <Avatar name={user?.name || "Admin"} />
                        <div>
                            <p className="text-xs font-semibold">
                                {user?.name || "Admin"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                Admin preview
                            </p>
                        </div>
                        <button
                            aria-label="Toggle dark mode"
                            onClick={toggleTheme}
                            className="ml-auto p-2"
                        >
                            <ThemeIcon width={17} />
                        </button>
                    </div>
                </div>
            </aside>
            <div className="lg:ml-[232px]">
                <header className="relative z-20 flex h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Open sidebar"
                            onClick={() => setMobile(true)}
                            className="lg:hidden"
                        >
                            <MenuIcon />
                        </button>
                        <span className="hidden text-xs text-slate-400 sm:inline">
                            Workspace
                        </span>
                        <span className="hidden text-xs text-slate-300 sm:inline">
                            /
                        </span>
                        <span className="text-xs font-medium">
                            {active.short}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCommand(true)}
                            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-400 dark:border-slate-700"
                        >
                            <SearchIcon width={14} height={14} />
                            <span className="hidden md:inline">
                                Search anything...
                            </span>
                            <kbd className="ml-8 hidden rounded border border-slate-200 px-1 text-[10px] dark:border-slate-700 md:inline">
                                ⌘ K
                            </kbd>
                        </button>
                        <button
                            onClick={() =>
                                confirm(
                                    "Change maintenance mode?",
                                    "This updates the local admin preview only; a connected server is required to restrict app traffic.",
                                    () =>
                                        changeSetting(
                                            "maintenance",
                                            !settings.maintenance,
                                        ),
                                )
                            }
                            className="hidden items-center gap-1.5 text-[10px] text-slate-500 xl:flex"
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                    settings.maintenance
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                }`}
                            />
                            {settings.maintenance ? "Maintenance" : "Live"}
                        </button>
                        <button
                            aria-label="Notifications"
                            onClick={() => {
                                setDropdown(
                                    dropdown === "notifications"
                                        ? ""
                                        : "notifications",
                                );
                                setUnread(false);
                            }}
                            className="relative p-2 text-slate-500"
                        >
                            <BellIcon width={18} />
                            {unread && (
                                <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-2 ring-white dark:ring-slate-900" />
                            )}
                        </button>
                        <button
                            aria-label="Admin profile menu"
                            onClick={() =>
                                setDropdown(
                                    dropdown === "profile" ? "" : "profile",
                                )
                            }
                        >
                            <Avatar name={user?.name || "Admin"} small />
                        </button>
                    </div>
                    {dropdown && (
                        <>
                            <button
                                className="fixed inset-0 z-10 cursor-default"
                                aria-label="Close menu"
                                onClick={() => setDropdown("")}
                            />
                            <div
                                className={`${panel} absolute right-5 top-16 z-20 w-72 p-3 shadow-xl`}
                            >
                                {dropdown === "profile" ? (
                                    <div className="space-y-1">
                                        <p className="border-b border-slate-100 p-2 text-xs dark:border-slate-700">
                                            {user?.email}
                                        </p>
                                        <Link
                                            to="/dashboard"
                                            className="block rounded p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            ↗ Switch to main app
                                        </Link>
                                        <button
                                            onClick={toggleTheme}
                                            className="w-full rounded p-2 text-left text-xs"
                                        >
                                            {dark ? "Light" : "Dark"} appearance
                                        </button>
                                        <button
                                            onClick={() => {
                                                logout();
                                                navigate("/login");
                                            }}
                                            className="flex w-full items-center gap-2 p-2 text-xs text-red-500"
                                        >
                                            <LogoutIcon width={14} />
                                            Log out
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <p className="mb-3 text-sm font-semibold">
                                            Notifications
                                        </p>
                                        {logs.slice(0, 3).map((log) => (
                                            <p
                                                key={log.id}
                                                className="border-t border-slate-100 py-3 text-xs dark:border-slate-800"
                                            >
                                                {log.action}
                                                <span className="mt-1 block text-[10px] text-slate-400">
                                                    {log.actor}
                                                </span>
                                            </p>
                                        ))}
                                        <Link
                                            to="/admin/security"
                                            onClick={() => setDropdown("")}
                                            className="text-xs font-semibold"
                                        >
                                            View all activity →
                                        </Link>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </header>
                <main className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{" "}
                                ADMIN CONTROL CENTER
                            </div>
                            <h1 className="text-[27px] font-semibold tracking-[-0.02em]">
                                {active.name}
                            </h1>
                            <p className="mt-1.5 text-xs text-slate-500">
                                {active.slug === ""
                                    ? "A clear picture of your workspace. Every metric, every team, in one place."
                                    : active.slug === "users"
                                      ? "Manage your people, their access, and their workspace experience."
                                      : "Keep your workspace organized, secure, and running smoothly."}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {active.slug === "users" ? (
                                <Button primary onClick={() => editUser(null)}>
                                    ＋ Add new user
                                </Button>
                            ) : (
                                <>
                                    <select
                                        aria-label="Analytics period"
                                        value={period}
                                        onChange={(event) =>
                                            setPeriod(event.target.value)
                                        }
                                        className={`${input} text-xs`}
                                    >
                                        <option>30 days</option>
                                        <option>90 days</option>
                                    </select>
                                    <Button
                                        onClick={() =>
                                            exportData(
                                                { users, projects, logs },
                                                "tasky-report.json",
                                            )
                                        }
                                    >
                                        ↓ Export report
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {!active.slug && (
                        <>
                            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200/70 bg-[#fffcf2] px-4 py-2.5 dark:border-amber-900 dark:bg-amber-950/20">
                                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                    <span className="mr-2 text-amber-600">
                                        ✧
                                    </span>
                                    <strong>Your workspace at a glance.</strong>{" "}
                                    All analytics below are demo data;
                                    management controls save locally.
                                </p>
                                <Badge>Operational</Badge>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {[
                                    {
                                        label: "Total users",
                                        value: "12,486",
                                        change: "+12.8%",
                                        detail: "vs. previous month",
                                        Icon: UserIcon,
                                        bars: [3, 5, 4, 7, 6, 8, 10, 9, 12],
                                    },
                                    {
                                        label: "Active projects",
                                        value: "248",
                                        change: "+8.2%",
                                        detail: "vs. previous month",
                                        Icon: FolderIcon,
                                        bars: [4, 3, 6, 5, 7, 8, 6, 10, 12],
                                    },
                                    {
                                        label: "System uptime",
                                        value: "99.98",
                                        unit: "%",
                                        change: "+0.02%",
                                        detail: "All services healthy",
                                        Icon: ChartIcon,
                                        bars: [
                                            9, 10, 9, 10, 10, 11, 10, 11, 12,
                                        ],
                                    },
                                    {
                                        label: "Monthly revenue",
                                        value: "$48,290",
                                        change: "+18.4%",
                                        detail: "vs. previous month",
                                        Icon: GridIcon,
                                        bars: [2, 4, 3, 5, 7, 6, 8, 11, 12],
                                    },
                                ].map((metric) => (
                                    <div
                                        key={metric.label}
                                        className={`${panel} p-5`}
                                    >
                                        <div className="flex items-center justify-between text-xs text-slate-500">
                                            <span>{metric.label}</span>
                                            <metric.Icon
                                                width={16}
                                                height={16}
                                            />
                                        </div>
                                        <div className="my-4 flex items-end justify-between">
                                            <p className="text-[29px] font-semibold tracking-[-0.025em]">
                                                {metric.value}
                                                <span className="text-lg">
                                                    {metric.unit}
                                                </span>
                                            </p>
                                            <div
                                                className="flex h-9 items-end gap-1"
                                                aria-hidden="true"
                                            >
                                                {metric.bars.map(
                                                    (bar, index) => (
                                                        <span
                                                            key={index}
                                                            className={`w-1.5 rounded-t-sm bg-amber-300/70 ${["h-1", "h-2", "h-3", "h-4", "h-5", "h-6"][Math.min(5, Math.floor(bar / 2))]}`}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-medium text-emerald-600">
                                                ↗ {metric.change}
                                            </span>
                                            <span className="text-[9px] text-slate-400">
                                                {metric.detail}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
                                <section className={panel}>
                                    <SectionTitle
                                        title={
                                            chart === "growth"
                                                ? "User growth"
                                                : "Daily task activity"
                                        }
                                        subtitle={
                                            chart === "growth"
                                                ? "Your community is growing. Here’s the bigger picture."
                                                : "Completed tasks across your workspace."
                                        }
                                    >
                                        <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                                            {["growth", "activity"].map(
                                                (tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() =>
                                                            setChart(tab)
                                                        }
                                                        className={`rounded-md px-2 py-1 text-[10px] ${
                                                            chart === tab
                                                                ? "bg-white shadow-sm dark:bg-slate-700"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        {tab === "growth"
                                                            ? "Users"
                                                            : "Tasks"}
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    </SectionTitle>
                                    <div className="flex items-center justify-between px-5 pt-4">
                                        <p className="text-xl font-semibold">
                                            {chart === "growth"
                                                ? "12,486"
                                                : "8,642"}
                                            <span className="ml-2 text-[10px] font-medium text-emerald-600">
                                                ↗ 12.8%
                                            </span>
                                        </p>
                                        <div className="flex gap-3 text-[9px] text-slate-400">
                                            <span>
                                                ●{" "}
                                                <span className="text-amber-600">
                                                    This period
                                                </span>
                                            </span>
                                            <span>● Previous period</span>
                                        </div>
                                    </div>
                                    {chart === "growth" ? (
                                        <GrowthChart period={period} />
                                    ) : (
                                        <div className="px-5 pb-5">
                                            <div className="mt-6 flex h-44 items-end justify-around gap-2">
                                                {[
                                                    "h-20",
                                                    "h-28",
                                                    "h-24",
                                                    "h-36",
                                                    "h-32",
                                                    "h-40",
                                                    "h-28",
                                                ].map((height, index) => (
                                                    <button
                                                        key={index}
                                                        title={`${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}: ${[920, 1340, 1080, 1680, 1420, 1820, 1382][index]} tasks`}
                                                        onClick={() =>
                                                            notify(
                                                                `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}: ${[920, 1340, 1080, 1680, 1420, 1820, 1382][index]} completed tasks (demo)`,
                                                            )
                                                        }
                                                        className={`${height} w-full max-w-10 rounded-t bg-amber-300 transition hover:bg-amber-500`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-around text-[10px] text-slate-400">
                                                {[
                                                    "Mon",
                                                    "Tue",
                                                    "Wed",
                                                    "Thu",
                                                    "Fri",
                                                    "Sat",
                                                    "Sun",
                                                ].map((day) => (
                                                    <span key={day}>{day}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                                <section className={panel}>
                                    <SectionTitle
                                        title="System health"
                                        subtitle="Infrastructure performance, at a glance."
                                    >
                                        <span className="flex items-center gap-1.5 text-[9px] text-emerald-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Live preview
                                        </span>
                                    </SectionTitle>
                                    <div className="space-y-5 p-5">
                                        {[
                                            {
                                                title: "Application server",
                                                detail: "Response time · 124 ms",
                                                value: "Operational",
                                                Icon: GridIcon,
                                            },
                                            {
                                                title: "Database",
                                                detail: "Latency · 18 ms",
                                                value: "Operational",
                                                Icon: FileIcon,
                                            },
                                        ].map((service) => (
                                            <div
                                                key={service.title}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="rounded-lg bg-slate-50 p-2 text-slate-500 dark:bg-slate-800">
                                                    <service.Icon width={17} />
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium">
                                                        {service.title}
                                                    </p>
                                                    <p className="mt-1 text-[10px] text-slate-400">
                                                        {service.detail}
                                                    </p>
                                                </div>
                                                <Badge>{service.value}</Badge>
                                            </div>
                                        ))}
                                        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                            <div className="mb-2 flex justify-between text-xs">
                                                <span>Storage usage</span>
                                                <strong>
                                                    64
                                                    <span className="font-normal text-slate-400">
                                                        {" "}
                                                        / 100 GB
                                                    </span>
                                                </strong>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div className="h-full w-[64%] rounded-full bg-amber-400" />
                                            </div>
                                            <p className="mt-2 text-[10px] text-slate-400">
                                                36 GB available on your current
                                                plan
                                            </p>
                                        </div>
                                        <Link
                                            to="/admin/security"
                                            className="flex justify-between border-t border-slate-100 pt-3 text-[11px] font-medium dark:border-slate-800"
                                        >
                                            View health & security<span>→</span>
                                        </Link>
                                    </div>
                                </section>
                            </div>
                            <div className="mt-5 grid gap-5 xl:grid-cols-[1.7fr_1fr]">
                                <section className={panel}>
                                    <SectionTitle
                                        title="Recent users"
                                        subtitle="The newest faces in your workspace."
                                    >
                                        <Link
                                            to="/admin/users"
                                            className="text-[10px] font-medium"
                                        >
                                            View all users →
                                        </Link>
                                    </SectionTitle>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 text-[10px] text-slate-400 dark:bg-slate-800/50">
                                                <tr>
                                                    <th className="px-5 py-3 font-medium">
                                                        User
                                                    </th>
                                                    <th className="py-3 font-medium">
                                                        Role
                                                    </th>
                                                    <th className="px-4 py-3 font-medium">
                                                        Status
                                                    </th>
                                                    <th className="py-3 pr-5 font-medium">
                                                        Joined
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users
                                                    .slice(0, 4)
                                                    .map((member) => (
                                                        <tr
                                                            key={member.id}
                                                            className="border-t border-slate-100 dark:border-slate-800"
                                                        >
                                                            <td className="flex items-center gap-2.5 px-5 py-3">
                                                                <Avatar
                                                                    name={
                                                                        member.name
                                                                    }
                                                                    small
                                                                />
                                                                <div>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigate(
                                                                                "/admin/users",
                                                                            );
                                                                            editUser(
                                                                                member,
                                                                            );
                                                                        }}
                                                                        className="font-medium hover:underline"
                                                                    >
                                                                        {
                                                                            member.name
                                                                        }
                                                                    </button>
                                                                    <p className="mt-0.5 text-[9px] text-slate-400">
                                                                        {
                                                                            member.email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="text-[10px] text-slate-500">
                                                                {member.role}
                                                            </td>
                                                            <td className="px-4">
                                                                <Badge>
                                                                    {
                                                                        member.status
                                                                    }
                                                                </Badge>
                                                            </td>
                                                            <td className="whitespace-nowrap pr-5 text-[10px] text-slate-400">
                                                                {member.joined}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                                <section className={panel}>
                                    <SectionTitle title="Recent activity">
                                        <Link
                                            to="/admin/security"
                                            className="text-[10px] font-medium"
                                        >
                                            View all →
                                        </Link>
                                    </SectionTitle>
                                    <div className="space-y-4 p-5">
                                        {logs.slice(0, 4).map((log, index) => (
                                            <div
                                                className="flex gap-3"
                                                key={log.id}
                                            >
                                                <span
                                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                                                        index === 2
                                                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950"
                                                            : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                                    }`}
                                                >
                                                    {index === 2 ? "!" : "↗"}
                                                </span>
                                                <div>
                                                    <p className="text-[11px] leading-4">
                                                        {log.action}
                                                    </p>
                                                    <p className="mt-1 text-[9px] text-slate-400">
                                                        {log.actor} ·{" "}
                                                        {new Date(
                                                            log.time,
                                                        ).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </>
                    )}
                    {active.slug === "users" && (
                        <section className={panel}>
                            <SectionTitle
                                title={`Workspace users (${users.length})`}
                                subtitle="All your members, with access controls in one place."
                            >
                                <Button
                                    onClick={() =>
                                        exportData(
                                            filteredUsers,
                                            "tasky-users.json",
                                        )
                                    }
                                >
                                    ↓ Export users
                                </Button>
                            </SectionTitle>
                            <div className="flex flex-wrap gap-2 p-4">
                                <div className="relative flex-1">
                                    <SearchIcon
                                        className="absolute left-3 top-2.5 text-slate-400"
                                        width={16}
                                    />
                                    <input
                                        aria-label="Search users"
                                        placeholder="Search name or email..."
                                        className={`${input} w-full pl-9`}
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                    />
                                </div>
                                <select
                                    aria-label="Filter by role"
                                    className={input}
                                    value={role}
                                    onChange={(event) =>
                                        setRole(event.target.value)
                                    }
                                >
                                    {[
                                        "All roles",
                                        "Admin",
                                        "Manager",
                                        "User",
                                    ].map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Filter by status"
                                    className={input}
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value)
                                    }
                                >
                                    {[
                                        "All statuses",
                                        "Active",
                                        "Suspended",
                                        "Pending",
                                    ].map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                            </div>
                            {selected.length > 0 && (
                                <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950">
                                    <span className="mr-auto text-xs">
                                        {selected.length} selected
                                    </span>
                                    <Button
                                        onClick={() =>
                                            confirm(
                                                "Suspend selected users?",
                                                "Selected members will be marked suspended in this local workspace.",
                                                () => suspend(selected),
                                            )
                                        }
                                    >
                                        Suspend
                                    </Button>
                                    <Button
                                        danger
                                        onClick={() =>
                                            confirm(
                                                "Delete selected users?",
                                                "This permanently removes selected local user records.",
                                                () => deleteUsers(selected),
                                            )
                                        }
                                    >
                                        Delete
                                    </Button>
                                    <button
                                        onClick={() => setSelected([])}
                                        className="px-2 text-xs"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px] text-left text-xs">
                                    <thead className="bg-slate-50 text-[10px] text-slate-500 dark:bg-slate-800">
                                        <tr>
                                            <th className="w-10 px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select current page"
                                                    checked={
                                                        rows.length > 0 &&
                                                        rows.every((member) =>
                                                            selected.includes(
                                                                member.id,
                                                            ),
                                                        )
                                                    }
                                                    onChange={(event) =>
                                                        setSelected(
                                                            event.target.checked
                                                                ? [
                                                                      ...new Set(
                                                                          [
                                                                              ...selected,
                                                                              ...rows.map(
                                                                                  (
                                                                                      member,
                                                                                  ) =>
                                                                                      member.id,
                                                                              ),
                                                                          ],
                                                                      ),
                                                                  ]
                                                                : selected.filter(
                                                                      (id) =>
                                                                          !rows.some(
                                                                              (
                                                                                  member,
                                                                              ) =>
                                                                                  member.id ===
                                                                                  id,
                                                                          ),
                                                                  ),
                                                        )
                                                    }
                                                    className="accent-amber-400"
                                                />
                                            </th>
                                            {[
                                                ["name", "User"],
                                                ["role", "Role"],
                                                ["status", "Status"],
                                                ["projects", "Projects"],
                                            ].map(([key, label]) => (
                                                <th
                                                    key={key}
                                                    aria-sort={
                                                        sort.key === key
                                                            ? sort.asc
                                                                ? "ascending"
                                                                : "descending"
                                                            : "none"
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            setSort({
                                                                key,
                                                                asc:
                                                                    sort.key ===
                                                                    key
                                                                        ? !sort.asc
                                                                        : true,
                                                            })
                                                        }
                                                    >
                                                        {label}{" "}
                                                        {sort.key === key
                                                            ? sort.asc
                                                                ? "↑"
                                                                : "↓"
                                                            : "↕"}
                                                    </button>
                                                </th>
                                            ))}
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="border-t border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                            >
                                                <td className="px-4">
                                                    <input
                                                        aria-label={`Select ${member.name}`}
                                                        type="checkbox"
                                                        checked={selected.includes(
                                                            member.id,
                                                        )}
                                                        onChange={(event) =>
                                                            setSelected(
                                                                event.target
                                                                    .checked
                                                                    ? [
                                                                          ...selected,
                                                                          member.id,
                                                                      ]
                                                                    : selected.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              member.id,
                                                                      ),
                                                            )
                                                        }
                                                        className="accent-amber-400"
                                                    />
                                                </td>
                                                <td className="flex items-center gap-3 py-4">
                                                    <Avatar
                                                        name={member.name}
                                                    />
                                                    <div className="pr-4">
                                                        <p className="font-medium">
                                                            {member.name}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td>{member.role}</td>
                                                <td>
                                                    <Badge>
                                                        {member.status}
                                                    </Badge>
                                                </td>
                                                <td>{member.projects}</td>
                                                <td className="pr-4">
                                                    <select
                                                        aria-label={`Actions for ${member.name}`}
                                                        className={`${input} max-w-36 text-[10px]`}
                                                        value=""
                                                        onChange={(event) => {
                                                            const action =
                                                                event.target
                                                                    .value;
                                                            if (
                                                                action ===
                                                                "edit"
                                                            )
                                                                editUser(
                                                                    member,
                                                                );
                                                            if (
                                                                action ===
                                                                "suspend"
                                                            )
                                                                confirm(
                                                                    "Suspend user?",
                                                                    `Suspend ${member.name}?`,
                                                                    () =>
                                                                        suspend(
                                                                            [
                                                                                member.id,
                                                                            ],
                                                                        ),
                                                                );
                                                            if (
                                                                action ===
                                                                "restore"
                                                            ) {
                                                                setUsers(
                                                                    (
                                                                        previous,
                                                                    ) =>
                                                                        previous.map(
                                                                            (
                                                                                item,
                                                                            ) =>
                                                                                item.id ===
                                                                                member.id
                                                                                    ? {
                                                                                          ...item,
                                                                                          status: "Active",
                                                                                      }
                                                                                    : item,
                                                                        ),
                                                                );
                                                                record(
                                                                    `Restored ${member.name}`,
                                                                );
                                                                notify(
                                                                    "User reactivated",
                                                                );
                                                            }
                                                            if (
                                                                action ===
                                                                "delete"
                                                            )
                                                                confirm(
                                                                    "Delete user?",
                                                                    `Permanently remove ${member.name} from the local workspace?`,
                                                                    () =>
                                                                        deleteUsers(
                                                                            [
                                                                                member.id,
                                                                            ],
                                                                        ),
                                                                );
                                                            if (
                                                                action ===
                                                                "reset"
                                                            )
                                                                confirm(
                                                                    "Simulate password reset?",
                                                                    `No email will be sent. This records a demo reset request for ${member.email}.`,
                                                                    () => {
                                                                        record(
                                                                            `Password reset requested for ${member.name}`,
                                                                        );
                                                                        notify(
                                                                            "Demo reset request recorded — no email sent",
                                                                        );
                                                                    },
                                                                );
                                                        }}
                                                    >
                                                        <option value="">
                                                            Manage user
                                                        </option>
                                                        <option value="edit">
                                                            Edit info / role
                                                        </option>
                                                        <option value="reset">
                                                            Reset password
                                                        </option>
                                                        <option
                                                            value={
                                                                member.status ===
                                                                "Suspended"
                                                                    ? "restore"
                                                                    : "suspend"
                                                            }
                                                        >
                                                            {member.status ===
                                                            "Suspended"
                                                                ? "Reactivate"
                                                                : "Suspend user"}
                                                        </option>
                                                        <option value="delete">
                                                            Delete user
                                                        </option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {rows.length === 0 && (
                                    <p className="p-12 text-center text-sm text-slate-400">
                                        No users match your filters.
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-[11px] dark:border-slate-800">
                                <span className="text-slate-400">
                                    {filteredUsers.length
                                        ? (currentPage - 1) * 7 + 1
                                        : 0}
                                    –
                                    {Math.min(
                                        currentPage * 7,
                                        filteredUsers.length,
                                    )}{" "}
                                    of {filteredUsers.length} users
                                </span>
                                <div className="flex items-center gap-3">
                                    <Button
                                        disabled={currentPage === 1}
                                        onClick={() => setPage(currentPage - 1)}
                                    >
                                        ← Previous
                                    </Button>
                                    <span>
                                        {currentPage} / {pages}
                                    </span>
                                    <Button
                                        disabled={currentPage === pages}
                                        onClick={() => setPage(currentPage + 1)}
                                    >
                                        Next →
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}
                    {active.slug === "projects" && (
                        <>
                            <div className="mb-5 grid gap-4 sm:grid-cols-3">
                                {[
                                    ["Projects monitored", projects.length],
                                    [
                                        "Total tasks",
                                        projects.reduce(
                                            (sum, project) =>
                                                sum + project.tasks,
                                            0,
                                        ),
                                    ],
                                    [
                                        "Completed tasks",
                                        projects.reduce(
                                            (sum, project) =>
                                                sum + project.done,
                                            0,
                                        ),
                                    ],
                                ].map(([label, value]) => (
                                    <div className={`${panel} p-5`} key={label}>
                                        <p className="text-xs text-slate-400">
                                            {label}
                                        </p>
                                        <p className="mt-3 text-3xl font-semibold">
                                            {value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <section className={panel}>
                                <SectionTitle
                                    title="Global project monitor"
                                    subtitle="Monitor delivery across every team."
                                />
                                <div className="flex gap-3 p-4">
                                    <input
                                        aria-label="Search projects"
                                        className={`${input} flex-1`}
                                        placeholder="Search projects..."
                                        value={projectQuery}
                                        onChange={(event) =>
                                            setProjectQuery(event.target.value)
                                        }
                                    />
                                    <select
                                        aria-label="Filter projects"
                                        className={input}
                                        value={projectStatus}
                                        onChange={(event) =>
                                            setProjectStatus(event.target.value)
                                        }
                                    >
                                        {[
                                            "All projects",
                                            "On track",
                                            "At risk",
                                            "Completed",
                                            "Archived",
                                        ].map((value) => (
                                            <option key={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] text-left text-xs">
                                        <thead className="bg-slate-50 text-[10px] text-slate-400 dark:bg-slate-800">
                                            <tr>
                                                {[
                                                    "Project",
                                                    "Owner",
                                                    "Task completion",
                                                    "Status",
                                                    "Action",
                                                ].map((label) => (
                                                    <th
                                                        className="px-5 py-3 font-medium"
                                                        key={label}
                                                    >
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectRows.map((project) => (
                                                <tr
                                                    className="border-t border-slate-100 dark:border-slate-800"
                                                    key={project.name}
                                                >
                                                    <td className="px-5 py-5">
                                                        <p className="font-medium">
                                                            {project.name}
                                                        </p>
                                                        <p className="mt-1 text-[10px] text-slate-400">
                                                            {project.team}
                                                        </p>
                                                    </td>
                                                    <td className="px-5">
                                                        {project.owner}
                                                    </td>
                                                    <td className="px-5">
                                                        <div className="mb-2 text-[10px] text-slate-400">
                                                            {project.done} /{" "}
                                                            {project.tasks}{" "}
                                                            tasks
                                                        </div>
                                                        <progress
                                                            aria-label={`${project.name} completion`}
                                                            max={project.tasks}
                                                            value={project.done}
                                                            className="h-1.5 w-28 accent-amber-400"
                                                        />
                                                    </td>
                                                    <td className="px-5">
                                                        <Badge>
                                                            {project.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-5">
                                                        <Button
                                                            disabled={
                                                                project.status ===
                                                                "Archived"
                                                            }
                                                            onClick={() =>
                                                                confirm(
                                                                    "Archive project?",
                                                                    `${project.name} will be archived in this local preview.`,
                                                                    () => {
                                                                        setProjects(
                                                                            (
                                                                                previous,
                                                                            ) =>
                                                                                previous.map(
                                                                                    (
                                                                                        item,
                                                                                    ) =>
                                                                                        item.name ===
                                                                                        project.name
                                                                                            ? {
                                                                                                  ...item,
                                                                                                  status: "Archived",
                                                                                              }
                                                                                            : item,
                                                                                ),
                                                                        );
                                                                        record(
                                                                            `Archived project ${project.name}`,
                                                                            "Project",
                                                                        );
                                                                        notify(
                                                                            "Project archived",
                                                                        );
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            Archive
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {!projectRows.length && (
                                        <p className="p-10 text-center text-sm text-slate-400">
                                            No matching projects.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                    {active.slug === "roles" && (
                        <section className={panel}>
                            <SectionTitle
                                title="Role permission matrix"
                                subtitle="Changes save automatically in this local workspace. Super Admin access is locked."
                            />
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr>
                                            <th className="px-6 py-5 text-xs">
                                                Granular permissions
                                            </th>
                                            {[
                                                "Super Admin",
                                                "Manager",
                                                "Developer",
                                                "Client",
                                            ].map((name) => (
                                                <th
                                                    key={name}
                                                    className="px-6 text-center text-xs"
                                                >
                                                    {name}
                                                    <span className="mt-1 block text-[9px] font-normal text-slate-400">
                                                        {name === "Super Admin"
                                                            ? "Full access"
                                                            : "Custom access"}
                                                    </span>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            "Create Project",
                                            "Delete Task",
                                            "Manage Billing",
                                            "Access Logs",
                                            "API Keys",
                                        ].map((permission, index) => (
                                            <tr
                                                key={permission}
                                                className="border-t border-slate-100 dark:border-slate-800"
                                            >
                                                <td className="px-6 py-6 text-xs font-medium">
                                                    {permission}
                                                </td>
                                                {[
                                                    "Super Admin",
                                                    "Manager",
                                                    "Developer",
                                                    "Client",
                                                ].map((name, roleIndex) => (
                                                    <td
                                                        className="px-6 text-center"
                                                        key={name}
                                                    >
                                                        <Toggle
                                                            label={`${name}: ${permission}`}
                                                            disabled={
                                                                !roleIndex
                                                            }
                                                            checked={
                                                                roleIndex ===
                                                                    0 ||
                                                                (permissions[
                                                                    `${name}-${permission}`
                                                                ] ??
                                                                    (roleIndex ===
                                                                    1
                                                                        ? index <
                                                                          3
                                                                        : roleIndex ===
                                                                            2
                                                                          ? [
                                                                                0,
                                                                                1,
                                                                                4,
                                                                            ].includes(
                                                                                index,
                                                                            )
                                                                          : false))
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) => {
                                                                setPermissions(
                                                                    (
                                                                        previous,
                                                                    ) => ({
                                                                        ...previous,
                                                                        [`${name}-${permission}`]:
                                                                            value,
                                                                    }),
                                                                );
                                                                record(
                                                                    `${name}: ${permission} ${
                                                                        value
                                                                            ? "granted"
                                                                            : "revoked"
                                                                    }`,
                                                                    "Permissions",
                                                                );
                                                                notify(
                                                                    "Permission updated",
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="border-t border-slate-100 p-5 text-[11px] text-slate-400 dark:border-slate-800">
                                ⓘ Permissions are a UI demo. Production
                                enforcement requires a trusted backend.
                            </p>
                        </section>
                    )}
                    {active.slug === "security" && (
                        <>
                            <div className="mb-5 grid gap-5 md:grid-cols-2">
                                <section
                                    className={`${panel} flex items-center justify-between gap-4 p-5`}
                                >
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            Maintenance mode
                                        </h2>
                                        <p className="mt-2 text-xs text-slate-400">
                                            Local preview toggle; does not
                                            restrict real traffic.
                                        </p>
                                    </div>
                                    <Toggle
                                        label="Maintenance mode"
                                        checked={settings.maintenance}
                                        onChange={(value) =>
                                            confirm(
                                                "Change maintenance mode?",
                                                "This is a local preview setting, not a live server control.",
                                                () =>
                                                    changeSetting(
                                                        "maintenance",
                                                        value,
                                                    ),
                                            )
                                        }
                                    />
                                </section>
                                <section
                                    className={`${panel} flex items-center justify-between gap-4 p-5`}
                                >
                                    <div>
                                        <h2 className="text-sm font-semibold">
                                            Workspace backup
                                        </h2>
                                        <p className="mt-2 text-xs text-slate-400">
                                            Download a snapshot of local
                                            administration data.
                                        </p>
                                    </div>
                                    <Button
                                        primary
                                        onClick={() => {
                                            exportData(
                                                {
                                                    users,
                                                    projects,
                                                    permissions,
                                                    settings,
                                                    logs,
                                                    createdAt:
                                                        new Date().toISOString(),
                                                },
                                                "tasky-backup.json",
                                            );
                                            record(
                                                "Local workspace backup exported",
                                                "System",
                                                "Success",
                                            );
                                        }}
                                    >
                                        ↓ Create backup
                                    </Button>
                                </section>
                            </div>
                            <section className={panel}>
                                <SectionTitle
                                    title="System audit trail"
                                    subtitle="Chronological workspace and security events."
                                >
                                    <Button
                                        onClick={() =>
                                            exportData(
                                                auditRows,
                                                "tasky-audit.json",
                                            )
                                        }
                                    >
                                        Export logs
                                    </Button>
                                </SectionTitle>
                                <div className="flex gap-3 p-4">
                                    <input
                                        aria-label="Search audit logs"
                                        placeholder="Search action, actor, or IP address..."
                                        className={`${input} flex-1`}
                                        value={auditQuery}
                                        onChange={(event) =>
                                            setAuditQuery(event.target.value)
                                        }
                                    />
                                    <select
                                        aria-label="Filter severity"
                                        className={input}
                                        value={severity}
                                        onChange={(event) =>
                                            setSeverity(event.target.value)
                                        }
                                    >
                                        {[
                                            "All severities",
                                            "Info",
                                            "Success",
                                            "Warning",
                                            "Critical",
                                        ].map((value) => (
                                            <option key={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="max-h-[560px] overflow-auto">
                                    <table className="w-full min-w-[760px] text-left text-xs">
                                        <thead className="sticky top-0 bg-slate-50 text-[10px] text-slate-400 dark:bg-slate-800">
                                            <tr>
                                                {[
                                                    "Timestamp",
                                                    "Actor",
                                                    "Action",
                                                    "IP address",
                                                    "Severity",
                                                ].map((label) => (
                                                    <th
                                                        key={label}
                                                        className="px-5 py-3 font-medium"
                                                    >
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditRows.map((log) => (
                                                <tr
                                                    key={log.id}
                                                    className="border-t border-slate-100 dark:border-slate-800"
                                                >
                                                    <td className="whitespace-nowrap px-5 py-4 text-[10px] text-slate-400">
                                                        {new Date(
                                                            log.time,
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="px-5">
                                                        {log.actor}
                                                    </td>
                                                    <td className="px-5">
                                                        <p>{log.action}</p>
                                                        <p className="mt-1 text-[9px] text-slate-400">
                                                            {log.type}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 font-mono text-[10px] text-slate-400">
                                                        {log.ip}
                                                    </td>
                                                    <td className="px-5">
                                                        <Badge>
                                                            {log.severity}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {!auditRows.length && (
                                        <p className="p-10 text-center text-sm text-slate-400">
                                            No matching audit events.
                                        </p>
                                    )}
                                </div>
                            </section>
                        </>
                    )}
                    {active.slug === "settings" && (
                        <div className="grid gap-5 xl:grid-cols-2">
                            <section className={panel}>
                                <SectionTitle
                                    title="Workspace configuration"
                                    subtitle="The defaults that shape your workspace."
                                />
                                <form
                                    className="space-y-5 p-5"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        const data = new FormData(
                                            event.currentTarget,
                                        );
                                        setSettings((previous) => ({
                                            ...previous,
                                            name: data.get("name"),
                                            email: data.get("email"),
                                        }));
                                        record(
                                            "Updated workspace configuration",
                                            "System",
                                        );
                                        notify("Configuration saved");
                                    }}
                                >
                                    <label className="block text-xs font-medium">
                                        Workspace name
                                        <input
                                            required
                                            name="name"
                                            defaultValue={settings.name}
                                            className={`${input} mt-2 block w-full`}
                                        />
                                    </label>
                                    <label className="block text-xs font-medium">
                                        Support email
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            defaultValue={settings.email}
                                            className={`${input} mt-2 block w-full`}
                                        />
                                    </label>
                                    <Button primary type="submit">
                                        Save configuration
                                    </Button>
                                </form>
                            </section>
                            <section className={panel}>
                                <SectionTitle
                                    title="Feature flags & access"
                                    subtitle="Roll out features with confidence. Local demo controls."
                                />
                                <div className="divide-y divide-slate-100 px-5 dark:divide-slate-800">
                                    {[
                                        [
                                            "registrations",
                                            "Allow new registrations",
                                            "Enable self-service account creation.",
                                        ],
                                        [
                                            "twoFactor",
                                            "Require two-factor authentication",
                                            "Additional protection for admin accounts.",
                                        ],
                                        [
                                            "ai",
                                            "AI task assistant",
                                            "Early access to intelligent task suggestions.",
                                        ],
                                        [
                                            "timeTracking",
                                            "Time tracking",
                                            "Let teams track time directly on tasks.",
                                        ],
                                        [
                                            "beta",
                                            "Beta features",
                                            "Make experimental workspace tools available.",
                                        ],
                                    ].map(([key, title, description]) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between gap-4 py-5"
                                        >
                                            <div>
                                                <p className="text-xs font-medium">
                                                    {title}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-400">
                                                    {description}
                                                </p>
                                            </div>
                                            <Toggle
                                                label={title}
                                                checked={settings[key]}
                                                onChange={(value) =>
                                                    changeSetting(key, value)
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                    <footer className="mt-7 flex items-center justify-between text-[9px] text-slate-400">
                        <span>TASKY Admin · Workspace intelligence</span>
                        <span>Demo workspace · v2.4.0</span>
                    </footer>
                </main>
            </div>
            {toast && (
                <div
                    role="status"
                    className="fixed bottom-6 right-6 z-[60] flex max-w-[calc(100vw-48px)] items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-xs text-white shadow-xl"
                >
                    <span className="text-amber-300">✓</span>
                    {toast}
                    <button
                        aria-label="Dismiss notification"
                        onClick={() => setToast("")}
                    >
                        ✕
                    </button>
                </div>
            )}
            {command && (
                <Modal
                    title="Search your workspace"
                    close={() => setCommand(false)}
                >
                    <input
                        autoFocus
                        aria-label="Command search"
                        className={`${input} mb-4 w-full`}
                        placeholder="Search modules or people..."
                        value={commandQuery}
                        onChange={(event) =>
                            setCommandQuery(event.target.value)
                        }
                    />
                    {commandItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => {
                                setCommand(false);
                                item.action();
                            }}
                            className="flex w-full justify-between rounded-lg p-3 text-left text-sm hover:bg-amber-50 dark:hover:bg-slate-800"
                        >
                            {item.label}
                            <span className="text-slate-400">↗</span>
                        </button>
                    ))}
                    {!commandItems.length && (
                        <p className="p-5 text-sm text-slate-400">
                            No results found.
                        </p>
                    )}
                </Modal>
            )}
            {modal && (
                <Modal title={modal.title} close={() => setModal(null)}>
                    {modal.type === "confirm" ? (
                        <>
                            <p className="mb-6 text-sm leading-6 text-slate-500">
                                {modal.description}
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button onClick={() => setModal(null)}>
                                    Cancel
                                </Button>
                                <Button
                                    danger
                                    onClick={() => {
                                        modal.run();
                                        setModal(null);
                                    }}
                                >
                                    Confirm
                                </Button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={saveUser} className="space-y-4">
                            <label className="block text-xs font-medium">
                                Full name
                                <input
                                    autoFocus
                                    required
                                    className={`${input} mt-2 block w-full`}
                                    value={form.name}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            name: event.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label className="block text-xs font-medium">
                                Email address
                                <input
                                    type="email"
                                    required
                                    className={`${input} mt-2 block w-full`}
                                    value={form.email}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            email: event.target.value,
                                        })
                                    }
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="text-xs font-medium">
                                    Role
                                    <select
                                        className={`${input} mt-2 block w-full`}
                                        value={form.role}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                role: event.target.value,
                                            })
                                        }
                                    >
                                        {["Admin", "Manager", "User"].map(
                                            (value) => (
                                                <option key={value}>
                                                    {value}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                                <label className="text-xs font-medium">
                                    Status
                                    <select
                                        className={`${input} mt-2 block w-full`}
                                        value={form.status}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                status: event.target.value,
                                            })
                                        }
                                    >
                                        {["Active", "Suspended", "Pending"].map(
                                            (value) => (
                                                <option key={value}>
                                                    {value}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>
                            </div>
                            {formError && (
                                <p
                                    role="alert"
                                    className="text-xs text-red-500"
                                >
                                    {formError}
                                </p>
                            )}
                            <p className="text-[10px] leading-5 text-slate-400">
                                This manages local workspace records only. No
                                invitation or authentication credentials are
                                created.
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    onClick={() => setModal(null)}
                                >
                                    Cancel
                                </Button>
                                <Button primary type="submit">
                                    {form.id ? "Save changes" : "Add user"}
                                </Button>
                            </div>
                        </form>
                    )}
                </Modal>
            )}
        </div>
    );
}
