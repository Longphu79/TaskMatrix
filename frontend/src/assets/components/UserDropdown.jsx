import { useEffect, useRef, useState } from "react";
import {
    UserIcon,
    CogIcon,
    BellIcon,
    ThemeIcon,
    KeyboardIcon,
    HelpIcon,
    LogoutIcon,
    ChevronDown,
} from "./icon";
import { useTheme } from "./ThemeContext";

const AVATAR =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format";

const STATUSES = [
    { key: "online", label: "Online", color: "#3fb27f" },
    { key: "away", label: "Away", color: "#f6c62e" },
    { key: "dnd", label: "Do Not Disturb", color: "#e05656" },
];

function ThemeToggle({ dark, onChange }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange(!dark);
            }}
            role="switch"
            aria-checked={dark}
            className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                dark ? "bg-ink" : "bg-hairline"
            }`}
        >
            <span
                className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    dark ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

/* ---------- menu item ---------- */

function MenuItem({ Icon, label, onClick, trailing }) {
    return (
        <button
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
        >
            <span className="text-muted">
                <Icon />
            </span>
            <span className="flex-1 text-left">{label}</span>
            {trailing}
        </button>
    );
}

/* ---------- component ---------- */

export default function UserDropdown({ onNavigate }) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState("online");
    const [statusOpen, setStatusOpen] = useState(false);
    const [dark, setDark] = useState(false);
    const ref = useRef(null);
    const { isDark, toggleTheme } = useTheme();

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setStatusOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const current = STATUSES.find((s) => s.key === status);

    const go = (key) => {
        onNavigate?.(key);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            {/* trigger */}
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex shrink-0 items-center gap-3 rounded-full bg-white py-1.5 pl-4 pr-1.5 transition hover:shadow-sm"
            >
                <div className="hidden whitespace-nowrap text-right leading-tight sm:block">
                    <div className="text-sm font-semibold text-ink">
                        Manjay Gupta
                    </div>
                    <div className="text-xs text-muted">UI/UX Designer</div>
                </div>
                <div className="relative">
                    <img
                        src={AVATAR}
                        alt="Manjay Gupta"
                        className="h-10 w-10 shrink-0 rounded-full bg-canvas object-cover"
                    />
                    <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white"
                        style={{ background: current.color }}
                    />
                </div>
            </button>

            {/* dropdown */}
            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-hairline bg-white shadow-[0_20px_50px_rgba(17,17,26,0.15)]">
                    {/* header */}
                    <div className="p-4">
                        <div className="flex items-center gap-3">
                            <img
                                src={AVATAR}
                                alt="Manjay Gupta"
                                className="h-12 w-12 rounded-full bg-canvas object-cover"
                            />
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-ink">
                                    Manjay Gupta
                                </div>
                                <div className="truncate text-xs text-muted">
                                    UI/UX Designer
                                </div>
                                <div className="truncate text-xs text-muted">
                                    manjay.gupta@matrixdomain.com
                                </div>
                            </div>
                        </div>

                        {/* status selector */}
                        <div className="relative mt-3">
                            <button
                                onClick={() => setStatusOpen((o) => !o)}
                                className="flex w-full items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm font-medium text-ink transition hover:bg-hairline"
                            >
                                <span className="flex items-center gap-2">
                                    <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ background: current.color }}
                                    />
                                    {current.label}
                                </span>
                                <ChevronDown
                                    width={16}
                                    height={16}
                                    className="text-muted"
                                />
                            </button>
                            {statusOpen && (
                                <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-lg">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s.key}
                                            onClick={() => {
                                                setStatus(s.key);
                                                setStatusOpen(false);
                                            }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink transition hover:bg-canvas"
                                        >
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ background: s.color }}
                                            />
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-hairline" />

                    {/* quick shortcuts */}
                    <div className="p-2">
                        <MenuItem
                            Icon={UserIcon}
                            label="My Profile"
                            onClick={() => go("settings")}
                        />
                        <MenuItem
                            Icon={CogIcon}
                            label="Account Settings"
                            onClick={() => go("settings")}
                        />
                        <MenuItem
                            Icon={BellIcon}
                            label="Notification Preferences"
                            onClick={() => go("settings")}
                        />
                    </div>

                    <div className="h-px bg-hairline" />

                    {/* preferences & support */}
                    <div className="p-2">
                        <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink">
                            <span className="text-muted">
                                <ThemeIcon />
                            </span>
                            <span className="flex-1 text-left">Theme Mode</span>

                            {/* Truyền isDark và toggleTheme vào đây */}
                            <ThemeToggle dark={isDark} onChange={toggleTheme} />
                        </div>
                        <MenuItem
                            Icon={KeyboardIcon}
                            label="Keyboard Shortcuts"
                            onClick={() => setOpen(false)}
                            trailing={
                                <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                                    ⌘K
                                </span>
                            }
                        />
                        <MenuItem
                            Icon={HelpIcon}
                            label="Help & Support"
                            onClick={() => setOpen(false)}
                        />
                    </div>

                    <div className="h-px bg-hairline" />

                    {/* log out */}
                    <div className="p-2">
                        <button
                            onClick={() => setOpen(false)}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#e05656] transition hover:bg-[#fdecec]"
                        >
                            <LogoutIcon />
                            Log Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
