import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../api";
import { useAuth } from "../assets/context/AuthContext";

const TABS = ["Overview", "Goals", "Projects", "Kudos"];
const RECENT_WORK = [
    { title: "Untitled whiteboard", type: "Confluence Whiteboard", space: "SEP490", time: "2 hours ago", icon: "✣" },
    { title: "Giao diện cho customer", type: "Jira Issue", space: "SEP490", time: "2 months ago", icon: "▢" },
    { title: "Giao diện cho admin", type: "Jira Issue", space: "SEP490", time: "2 months ago", icon: "▢" },
];

const initials = (name = "") =>
    name.trim().split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "U";

function ProfileIcon({ children, className = "" }) {
    return (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-sky-600 ${className}`}>
            {children}
        </span>
    );
}

function ProfileTabs({ active, onChange }) {
    return (
        <div className="flex gap-7 overflow-x-auto border-b border-hairline px-5 sm:px-8">
            {TABS.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(tab)}
                    className={`-mb-px shrink-0 border-b-2 px-0.5 py-4 text-sm font-medium transition ${
                        active === tab
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-600 hover:text-ink"
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}

function Overview({ profile, onSave, saving, editingRole, setEditingRole }) {
    const [editingAvailability, setEditingAvailability] = useState(false);
    const [occupation, setOccupation] = useState(profile.occupation || "");
    const [freeTime, setFreeTime] = useState(profile.freeTime || "");

    useEffect(() => {
        setOccupation(profile.occupation || "");
        setFreeTime(profile.freeTime || "");
    }, [profile.occupation, profile.freeTime]);

    return (
        <div className="grid min-h-[440px] lg:grid-cols-[minmax(0,1fr)_360px]">
            <main className="space-y-10 px-5 py-8 sm:px-8">
                <section>
                    <h2 className="text-lg font-semibold text-slate-800">Working with me</h2>
                    {editingAvailability ? (
                        <div className="mt-4 max-w-3xl space-y-3">
                            <textarea
                                rows={3}
                                value={freeTime}
                                onChange={(event) => setFreeTime(event.target.value)}
                                placeholder="Share your working preferences and availability."
                                className="w-full resize-y rounded-xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={async () => {
                                        if (await onSave({ freeTime })) setEditingAvailability(false);
                                    }}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    Save
                                </button>
                                <button type="button" onClick={() => setEditingAvailability(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-canvas">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 flex items-start justify-between gap-4">
                            <p className="max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-500">
                                {profile.freeTime || "Add a note about how you prefer to work and when teammates can reach you."}
                            </p>
                            <button type="button" onClick={() => setEditingAvailability(true)} className="shrink-0 text-sm font-medium text-blue-600 hover:underline">Edit</button>
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                        Recent work <span className="text-sm text-slate-400" title="Your latest workspace activity">ⓘ</span>
                    </h2>
                    <div className="mt-5 divide-y divide-slate-100">
                        {RECENT_WORK.map((work) => (
                            <div key={work.title} className="flex items-center gap-3 py-4 first:pt-0">
                                <ProfileIcon>{work.icon}</ProfileIcon>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-slate-800">{work.title}</p>
                                    <p className="mt-0.5 text-xs text-slate-500">{work.type} <span className="px-1">•</span> {work.space}</p>
                                </div>
                                <span className="shrink-0 text-xs text-slate-500">{work.time}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <aside className="space-y-8 border-t border-hairline px-5 py-8 sm:px-8 lg:border-l lg:border-t-0">
                <section>
                    <h2 className="text-lg font-semibold text-slate-800">Details</h2>
                    <dl className="mt-5 grid grid-cols-[90px_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                        <dt className="text-slate-500">Email</dt>
                        <dd className="break-all text-slate-800">{profile.email || "—"}</dd>
                        {profile.occupation && (
                            <>
                                <dt className="text-slate-500">Role</dt>
                                <dd className="text-slate-800">{profile.occupation}</dd>
                            </>
                        )}
                    </dl>
                </section>

                <section>
                    <h2 className="flex items-center gap-3 text-lg font-semibold text-slate-800">Teams <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">1</span></h2>
                    <div className="mt-4 flex items-center gap-3">
                        <ProfileIcon className="bg-lime-100 text-lime-800">♧</ProfileIcon>
                        <div>
                            <p className="text-sm font-medium text-slate-800">All Member <span className="text-blue-500">✦</span></p>
                            <p className="mt-0.5 text-xs text-slate-500">4 members</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-lg font-semibold text-slate-800">Frequent spaces</h2>
                    <div className="mt-4 flex items-center gap-3">
                        <ProfileIcon className="bg-orange-100 text-orange-700">▤</ProfileIcon>
                        <div>
                            <p className="text-sm font-medium text-slate-800">SEP490</p>
                            <p className="mt-0.5 text-xs text-slate-500">Jira space</p>
                        </div>
                        <span className="ml-auto text-blue-600">↗</span>
                    </div>
                </section>
            </aside>

            {editingRole && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setEditingRole(false)}>
                    <form
                        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
                        onMouseDown={(event) => event.stopPropagation()}
                        onSubmit={async (event) => {
                            event.preventDefault();
                            if (await onSave({ occupation })) setEditingRole(false);
                        }}
                    >
                        <h2 className="text-lg font-semibold text-slate-900">Add role details</h2>
                        <label className="block text-sm font-medium text-slate-700">
                            Job title or role
                            <input autoFocus value={occupation} onChange={(event) => setOccupation(event.target.value)} className="mt-2 w-full rounded-xl border border-hairline px-3 py-2.5 outline-none focus:border-blue-500" placeholder="e.g. Product Designer" />
                        </label>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingRole(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-canvas">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Save</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function Goals({ goals, onSave, saving }) {
    const [items, setItems] = useState(goals);
    const [newGoal, setNewGoal] = useState("");

    useEffect(() => setItems(goals), [goals]);

    const addGoal = () => {
        const goal = newGoal.trim();
        if (!goal) return;
        setItems((current) => [...current, goal]);
        setNewGoal("");
    };

    return (
        <section className="max-w-3xl space-y-5 px-5 py-8 sm:px-8">
            <div>
                <h2 className="text-lg font-semibold text-slate-800">Goals</h2>
                <p className="mt-1 text-sm text-slate-500">Share the goals you are working toward with your team.</p>
            </div>
            <div className="flex gap-2">
                <input value={newGoal} onChange={(event) => setNewGoal(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (event.preventDefault(), addGoal())} placeholder="Add a goal" className="min-w-0 flex-1 rounded-xl border border-hairline px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
                <button type="button" onClick={addGoal} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Add</button>
            </div>
            <ul className="divide-y divide-slate-100 rounded-xl border border-hairline">
                {items.length ? items.map((goal, index) => (
                    <li key={`${goal}-${index}`} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
                        <span className="text-emerald-500">✓</span><span className="flex-1">{goal}</span>
                        <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${goal}`} className="text-slate-400 hover:text-red-500">×</button>
                    </li>
                )) : <li className="px-4 py-6 text-center text-sm text-slate-500">No goals added yet.</li>}
            </ul>
            <button type="button" disabled={saving} onClick={() => onSave({ goals: items })} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">Save goals</button>
        </section>
    );
}

function EmptyTab({ title, description, icon }) {
    return (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">{icon}</span>
            <h2 className="mt-4 text-lg font-semibold text-slate-800">{title}</h2>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        </div>
    );
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const coverInput = useRef(null);
    const [tab, setTab] = useState("Overview");
    const [profile, setProfile] = useState({
        fullName: user?.name || "",
        email: user?.email || "",
        occupation: user?.role || "",
        goals: [],
        freeTime: "",
    });
    const [cover, setCover] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingRole, setEditingRole] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/profile/me")
            .then(({ data }) => {
                if (!active) return;
                setProfile({
                    fullName: data.fullName || user?.name || "",
                    email: data.email || user?.email || "",
                    occupation: data.occupation || user?.role || "",
                    goals: data.goals || [],
                    freeTime: data.freeTime || "",
                });
            })
            .catch((requestError) => {
                if (active) setError(getApiErrorMessage(requestError, "Could not load your profile."));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [user?.email, user?.name, user?.role]);

    const saveProfile = async (updates) => {
        setSaving(true);
        setError("");
        setNotice("");
        const nextProfile = { ...profile, ...updates };
        try {
            const { data } = await api.put("/profile/me", {
                fullName: nextProfile.fullName,
                occupation: nextProfile.occupation,
                goals: nextProfile.goals,
                freeTime: nextProfile.freeTime,
            });
            const savedProfile = { ...nextProfile, ...data };
            setProfile(savedProfile);
            updateUser?.({
                name: savedProfile.fullName,
                role: savedProfile.occupation || user?.role,
            });
            setNotice("Profile updated.");
            window.setTimeout(() => setNotice(""), 3000);
            return true;
        } catch (saveError) {
            setError(getApiErrorMessage(saveError, "Could not save your profile."));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const selectCover = (file) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("Choose an image file for your cover.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError("Cover images must be 2 MB or smaller.");
            return;
        }
        setError("");
        setCover(URL.createObjectURL(file));
    };

    return (
        <div className="min-h-full bg-white text-slate-800">
            <section className="relative flex h-36 items-start justify-center overflow-hidden bg-[#77859e] sm:h-40">
                {cover && <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                {!cover && (
                    <div className="absolute inset-0 overflow-hidden opacity-70" aria-hidden="true">
                        <div className="absolute -left-8 top-20 h-28 w-[55%] -rotate-6 rounded-[50%] border-[28px] border-blue-900/35" />
                        <div className="absolute left-[27%] top-12 h-24 w-[40%] rotate-6 rounded-[50%] border-[8px] border-fuchsia-700/40" />
                        <div className="absolute right-[-4%] top-[-60px] h-56 w-[48%] -rotate-12 rounded-[50%] border-[20px] border-slate-500/60" />
                    </div>
                )}
                <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={(event) => selectCover(event.target.files?.[0])} />
                <button type="button" onClick={() => coverInput.current?.click()} className="relative mt-8 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                    ▧ Add cover image
                </button>
            </section>

            <div className="relative flex h-4 justify-between px-5 sm:px-8">
                <div className="absolute -top-[98px] flex h-[100px] w-[100px] items-center justify-center rounded-full border-[3px] border-white bg-[#172b50] text-4xl font-medium text-white shadow-sm">
                    {initials(profile.fullName)}
                </div>
            </div>

            <section className="px-5 pb-2 pt-5 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold tracking-tight text-[#292b31]">{profile.fullName || "Your profile"}</h1>
                        {profile.occupation ? (
                            <p className="mt-1 text-sm text-slate-600">{profile.occupation}</p>
                        ) : (
                            <button type="button" onClick={() => { setTab("Overview"); setEditingRole(true); }} className="mt-2 text-sm text-slate-600 hover:text-blue-600">＋ Add role details</button>
                        )}
                    </div>
                    <button type="button" onClick={() => navigate("/settings")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Account settings
                    </button>
                </div>
                {notice && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{notice}</p>}
                {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            </section>

            <ProfileTabs active={tab} onChange={setTab} />

            {loading ? (
                <p className="px-8 py-16 text-center text-sm text-slate-500">Loading profile...</p>
            ) : tab === "Overview" ? (
                <Overview profile={profile} onSave={saveProfile} saving={saving} editingRole={editingRole} setEditingRole={setEditingRole} />
            ) : tab === "Goals" ? (
                <Goals goals={profile.goals} onSave={saveProfile} saving={saving} />
            ) : tab === "Projects" ? (
                <EmptyTab title="Projects" description="Projects you join will appear here so teammates can see what you are working on." icon="▦" />
            ) : (
                <EmptyTab title="Kudos" description="Recognition from your teammates will show up here." icon="✦" />
            )}
        </div>
    );
}
