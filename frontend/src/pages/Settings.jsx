import { useState } from "react";

const AVATAR =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format";

const TABS = [
    { key: "profile", label: "Profile" },
    { key: "security", label: "Account & Security" },
    { key: "notifications", label: "Notifications" },
    { key: "integrations", label: "Integrations" },
    { key: "preferences", label: "Preferences" },
];

const inputCls =
    "w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children, hint, required }) {
    return (
        <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
        </div>
    );
}

function SectionHead({ title, subtitle, badge }) {
    return (
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                    {title}
                </h3>
                {subtitle && (
                    <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
                )}
            </div>
            {badge && (
                <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
                    {badge}
                </span>
            )}
        </div>
    );
}

function Card({ children, className = "" }) {
    return (
        <div
            className={`rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] sm:p-8 ${className}`}
        >
            {children}
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                checked ? "bg-brand" : "bg-slate-200"
            }`}
        >
            <span
                className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

function ToggleRow({ title, desc, checked, onChange }) {
    return (
        <div className="flex items-center justify-between gap-4 border-t border-hairline py-4 first:border-t-0 first:pt-0">
            <div className="pr-2">
                <div className="text-sm font-semibold text-ink">{title}</div>
                <div className="mt-0.5 text-xs text-muted">{desc}</div>
            </div>
            <Toggle checked={checked} onChange={onChange} />
        </div>
    );
}

/* ---------- 1. PROFILE PANEL ---------- */

function ProfilePanel() {
    return (
        <div className="space-y-6">
            {/* Profile Completion Bar */}
            <Card>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h4 className="text-sm font-semibold text-ink">
                            Profile Strength
                        </h4>
                        <p className="text-xs text-muted">
                            Complete your profile to unlock full team features.
                        </p>
                    </div>
                    <span className="font-display text-base font-bold text-brand">
                        85%
                    </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-hairline">
                    <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: "85%" }}
                    />
                </div>
            </Card>

            <Card>
                <SectionHead
                    title="Personal Information"
                    subtitle="Update your photo, personal details, and public links."
                />

                {/* Avatar upload */}
                <div className="mb-8 flex flex-wrap items-center gap-6">
                    <img
                        src={AVATAR}
                        alt="Profile"
                        className="h-20 w-20 rounded-2xl bg-canvas object-cover ring-4 ring-canvas"
                    />
                    <div>
                        <div className="flex flex-wrap gap-3">
                            <button className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-black">
                                Upload Photo
                            </button>
                            <button className="rounded-xl border border-hairline px-4 py-2 text-xs font-semibold text-muted transition hover:border-red-200 hover:text-red-600">
                                Remove
                            </button>
                        </div>
                        <p className="mt-2 text-[11px] text-muted">
                            Recommended format: Square PNG or JPG, max 2MB.
                        </p>
                    </div>
                </div>

                {/* Main fields */}
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="First Name" required>
                        <input defaultValue="Manjay" className={inputCls} />
                    </Field>
                    <Field label="Last Name" required>
                        <input defaultValue="Gupta" className={inputCls} />
                    </Field>
                    <Field
                        label="Email Address"
                        required
                        hint="Used for login and notifications"
                    >
                        <input
                            type="email"
                            defaultValue="manjay.gupta@matrixdomain.com"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Phone Number">
                        <input
                            defaultValue="+84 912 345 678"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Job Title">
                        <input
                            defaultValue="Senior UI/UX Designer"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Department">
                        <select defaultValue="Design Team" className={inputCls}>
                            <option>Design Team</option>
                            <option>Frontend Engineering</option>
                            <option>Backend Engineering</option>
                            <option>Product Management</option>
                        </select>
                    </Field>
                    <div className="sm:col-span-2">
                        <Field
                            label="Bio"
                            hint="Brief summary displayed on team member directory."
                        >
                            <textarea
                                rows={3}
                                defaultValue="Senior UI/UX Designer specialized in design systems, micro-interactions, and web app interfaces."
                                className={`${inputCls} resize-none`}
                            />
                        </Field>
                    </div>
                </div>

                <hr className="my-6 border-hairline" />

                {/* Social Links */}
                <h4 className="mb-4 text-sm font-semibold text-ink">
                    Social Profiles
                </h4>
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Portfolio / Website">
                        <input
                            defaultValue="https://manjay.design"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="GitHub Username">
                        <input
                            defaultValue="manjaygupta"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="LinkedIn URL">
                        <input
                            defaultValue="https://linkedin.com/in/manjaygupta"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Dribbble / Behance">
                        <input
                            defaultValue="https://dribbble.com/manjay"
                            className={inputCls}
                        />
                    </Field>
                </div>
            </Card>
        </div>
    );
}

/* ---------- 2. SECURITY PANEL ---------- */

function SecurityPanel() {
    const [twoFA, setTwoFA] = useState(true);
    const [showChangePassword, setShowChangePassword] = useState(false); // Mặc định ẩn form

    return (
        <div className="space-y-6">
            {/* Password Management Card */}
            <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-display text-lg font-semibold text-ink">
                            Password
                        </h3>
                        <p className="mt-0.5 text-xs text-muted">
                            Ensure your account is using a long, random password
                            to stay secure.
                        </p>
                    </div>

                    {/* Nút bật/tắt form */}
                    <button
                        onClick={() => setShowChangePassword((prev) => !prev)}
                        className="rounded-xl border border-hairline px-4 py-2 text-xs font-semibold text-ink transition hover:border-brand hover:bg-canvas"
                    >
                        {showChangePassword ? "Cancel" : "Change Password"}
                    </button>
                </div>

                {/* Form đổi mật khẩu - Chỉ hiện khi showChangePassword = true */}
                {showChangePassword && (
                    <div className="mt-6 border-t border-hairline pt-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Field label="Current Password" required>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className={inputCls}
                                    />
                                </Field>
                            </div>
                            <Field
                                label="New Password"
                                required
                                hint="Must contain at least 8 characters"
                            >
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className={inputCls}
                                />
                            </Field>
                            <Field label="Confirm New Password" required>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className={inputCls}
                                />
                            </Field>
                        </div>

                        {/* Nút hành động riêng cho mật khẩu */}
                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setShowChangePassword(false)}
                                className="rounded-xl border border-hairline px-4 py-2 text-xs font-semibold text-muted transition hover:text-ink"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    /* Xử lý đổi mật khẩu ở đây */
                                    setShowChangePassword(false);
                                }}
                                className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-black"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
                <SectionHead
                    title="Two-Factor Authentication (2FA)"
                    subtitle="Protect your account with an extra verification layer via Authenticator App."
                />
                <ToggleRow
                    title="Enable 2FA Protection"
                    desc="Require a 6-digit TOTP code from Google Authenticator or 1Password when logging in."
                    checked={twoFA}
                    onChange={setTwoFA}
                />
            </Card>

            {/* Active Sessions */}
            <Card>
                <SectionHead
                    title="Active Login Sessions"
                    subtitle="Devices currently logged into your TaskMatrix account."
                />
                <div className="space-y-4">
                    {[
                        {
                            device: 'MacBook Pro 16" (Chrome)',
                            location: "Da Nang, Vietnam",
                            current: true,
                            ip: "113.161.xx.xx",
                        },
                        {
                            device: "iPhone 15 Pro (TaskMatrix App)",
                            location: "Da Nang, Vietnam",
                            current: false,
                            ip: "113.161.xx.xx",
                        },
                    ].map((s, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between border-t border-hairline pt-4 first:border-0 first:pt-0"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-ink">
                                        {s.device}
                                    </span>
                                    {s.current && (
                                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                                            THIS DEVICE
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-muted">
                                    {s.location} • IP: {s.ip}
                                </p>
                            </div>
                            {!s.current && (
                                <button className="text-xs font-semibold text-red-600 hover:underline">
                                    Revoke
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-red-100 bg-red-50/30">
                <SectionHead
                    title="Danger Zone"
                    subtitle="Irreversible actions regarding your personal account."
                />
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h5 className="text-sm font-semibold text-ink">
                            Delete Account
                        </h5>
                        <p className="text-xs text-muted">
                            Permanently remove your account and all assigned
                            tasks.
                        </p>
                    </div>
                    <button className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-700">
                        Delete My Account
                    </button>
                </div>
            </Card>
        </div>
    );
}
/* ---------- 3. NOTIFICATIONS PANEL ---------- */

function NotificationsPanel() {
    const [prefs, setPrefs] = useState({
        taskAssigned: true,
        comments: true,
        emailDigest: true,
        desktopPush: false,
        slackAlerts: true,
    });

    const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));

    return (
        <Card>
            <SectionHead
                title="Notification Channels & Triggers"
                subtitle="Select how and when you want to receive project alerts."
            />
            <div className="space-y-2">
                <ToggleRow
                    title="New Task Assignment"
                    desc="Notify me instantly when someone assigns a task to me."
                    checked={prefs.taskAssigned}
                    onChange={set("taskAssigned")}
                />
                <ToggleRow
                    title="Comments & Mentions"
                    desc="Send alert when someone @mentions me in a task or project."
                    checked={prefs.comments}
                    onChange={set("comments")}
                />
                <ToggleRow
                    title="Weekly Email Digest"
                    desc="Receive a summary report of completed tasks every Monday morning."
                    checked={prefs.emailDigest}
                    onChange={set("emailDigest")}
                />
                <ToggleRow
                    title="Browser Push Notifications"
                    desc="Show popup notifications on desktop even when tab is in background."
                    checked={prefs.desktopPush}
                    onChange={set("desktopPush")}
                />
                <ToggleRow
                    title="Slack Channel Notifications"
                    desc="Forward high-priority updates to linked Slack workspace."
                    checked={prefs.slackAlerts}
                    onChange={set("slackAlerts")}
                />
            </div>
        </Card>
    );
}

/* ---------- 4. INTEGRATIONS PANEL ---------- */

function IntegrationsPanel() {
    const [connected, setConnected] = useState({
        google: true,
        slack: true,
        github: false,
        figma: true,
    });

    const toggleConn = (key) => setConnected((c) => ({ ...c, [key]: !c[key] }));

    const APPS = [
        {
            key: "google",
            name: "Google Calendar & Workspace",
            desc: "Sync time logs and task deadlines with Google Calendar.",
            icon: "📅",
        },
        {
            key: "slack",
            name: "Slack Integration",
            desc: "Receive real-time task notifications in designated Slack channels.",
            icon: "💬",
        },
        {
            key: "github",
            name: "GitHub Commits",
            desc: "Link git commits and pull requests directly to task cards.",
            icon: "🐙",
        },
        {
            key: "figma",
            name: "Figma Embeds",
            desc: "Preview live Figma design frames inside project detail views.",
            icon: "🎨",
        },
    ];

    return (
        <Card>
            <SectionHead
                title="Connected Applications"
                subtitle="Enhance your workflow by connecting external tools."
            />
            <div className="space-y-4">
                {APPS.map((app) => (
                    <div
                        key={app.key}
                        className="flex flex-col gap-4 rounded-2xl border border-hairline p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-canvas text-2xl">
                                {app.icon}
                            </span>
                            <div>
                                <h4 className="text-sm font-semibold text-ink">
                                    {app.name}
                                </h4>
                                <p className="mt-0.5 text-xs text-muted">
                                    {app.desc}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => toggleConn(app.key)}
                            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                connected[app.key]
                                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    : "bg-ink text-white hover:bg-black"
                            }`}
                        >
                            {connected[app.key] ? "Disconnect" : "Connect App"}
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );
}

/* ---------- 5. PREFERENCES PANEL ---------- */

function PreferencesPanel() {
    const [theme, setTheme] = useState("light");

    return (
        <Card>
            <SectionHead
                title="Display & System Preferences"
                subtitle="Personalize application appearance and regional settings."
            />

            {/* Theme Selector */}
            <div className="mb-8">
                <label className="mb-3 block text-xs font-semibold text-ink">
                    Interface Theme
                </label>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                    {[
                        {
                            id: "light",
                            label: "Light Mode",
                            bg: "bg-white border-2",
                        },
                        {
                            id: "dark",
                            label: "Dark Mode",
                            bg: "bg-slate-900 text-white",
                        },
                        {
                            id: "system",
                            label: "System Default",
                            bg: "bg-slate-100",
                        },
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 text-xs font-semibold transition ${t.bg} ${
                                theme === t.id
                                    ? "border-brand ring-2 ring-brand"
                                    : "border-hairline"
                            }`}
                        >
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Language">
                    <select defaultValue="English" className={inputCls}>
                        <option>English (US)</option>
                        <option>Tiếng Việt</option>
                        <option>Japanese</option>
                    </select>
                </Field>

                <Field label="Time Zone">
                    <select defaultValue="GMT+07:00" className={inputCls}>
                        <option>
                            GMT+07:00 (Indochina Time - Hanoi/Bangkok)
                        </option>
                        <option>GMT+00:00 (UTC / London)</option>
                        <option>GMT-05:00 (Eastern Time - New York)</option>
                    </select>
                </Field>

                <Field label="Date Format">
                    <select defaultValue="DD/MM/YYYY" className={inputCls}>
                        <option>DD/MM/YYYY (07/09/2026)</option>
                        <option>MM/DD/YYYY (09/07/2026)</option>
                        <option>YYYY-MM-DD (2026-09-07)</option>
                    </select>
                </Field>

                <Field label="First Day of Week">
                    <select defaultValue="Monday" className={inputCls}>
                        <option>Monday</option>
                        <option>Sunday</option>
                    </select>
                </Field>
            </div>
        </Card>
    );
}

/* ---------- MAIN PAGE WRAPPER ---------- */

export default function Settings() {
    const [tab, setTab] = useState("profile");
    const [savedNotice, setSavedNotice] = useState(false);

    const handleSave = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 3000);
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto pb-8">
                {/* Header Row */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="font-display text-3xl font-bold text-ink">
                            Settings
                        </h2>
                        <p className="mt-1 text-sm font-medium text-muted">
                            Manage your personal profile, security credentials,
                            and preferences
                        </p>
                    </div>

                    {/* Toast Notification */}
                    {savedNotice && (
                        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg animate-fade-in">
                            <span>✓ Changes saved successfully!</span>
                        </div>
                    )}
                </div>

                {/* Sub-tab Navigation */}
                <div className="mb-6 flex flex-wrap gap-1.5 rounded-2xl bg-white p-1.5 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition ${
                                tab === t.key
                                    ? "bg-ink text-white shadow-md"
                                    : "text-muted hover:bg-canvas hover:text-ink"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab Panels */}
                {tab === "profile" && <ProfilePanel />}
                {tab === "security" && <SecurityPanel />}
                {tab === "notifications" && <NotificationsPanel />}
                {tab === "integrations" && <IntegrationsPanel />}
                {tab === "preferences" && <PreferencesPanel />}
            </div>

            {/* Floating Action Bar */}
            <div className="sticky bottom-0 -mx-5 -mb-8 mt-6 flex items-center justify-end gap-3 border-t border-hairline bg-white/90 px-5 py-4 backdrop-blur-md lg:-mx-8 lg:px-8">
                <button className="rounded-xl border border-hairline px-6 py-2.5 text-xs font-semibold text-muted transition hover:border-brand hover:text-ink">
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    className="rounded-xl bg-brand px-6 py-2.5 text-xs font-bold text-ink shadow-sm transition hover:scale-105 active:scale-95"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}
