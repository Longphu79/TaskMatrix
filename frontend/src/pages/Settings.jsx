import { useEffect, useState } from "react";
import { ChevronDown, Globe2, Info } from "lucide-react";
import api, { getApiErrorMessage } from "../api";
import { useAuth } from "../assets/context/AuthContext";

const emptyProfile = (user) => ({
    fullName: user?.name || "",
    email: user?.email || "",
    occupation: "",
    goals: [],
    freeTime: "",
});

const inputClass =
    "w-full rounded-md border border-transparent bg-transparent px-2 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-200 focus:border-blue-500 focus:bg-white dark:text-slate-100 dark:hover:border-slate-600 dark:focus:bg-[#262c32]";

function initials(name = "") {
    return name.trim().split(/\s+/).filter(Boolean).slice(-2)
        .map((part) => part[0]).join("").toUpperCase() || "U";
}

function Visibility({ label = "Anyone" }) {
    return (
        <div className="flex items-center justify-end gap-2 text-sm text-slate-500 dark:text-slate-300">
            <Globe2 size={16} aria-hidden="true" />
            <span>{label}</span>
            <ChevronDown size={16} aria-hidden="true" />
        </div>
    );
}

function ProfileField({ label, children, visibility = true, id }) {
    return (
        <div className="grid gap-2 border-b border-slate-100 py-4 last:border-b-0 dark:border-slate-700 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center sm:gap-6">
            <div className="min-w-0">
                <label htmlFor={id} className="mb-1 block px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {label}
                </label>
                {children}
            </div>
            {visibility && <Visibility />}
        </div>
    );
}

export default function SettingsPage() {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(() => emptyProfile(user));
    const [savedProfile, setSavedProfile] = useState(() => emptyProfile(user));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let active = true;
        api.get("/profile/me")
            .then(({ data }) => {
                if (!active) return;
                const loadedProfile = {
                    ...emptyProfile(user),
                    ...data,
                    fullName: data.fullName || user?.name || "",
                    email: data.email || user?.email || "",
                    goals: data.goals || [],
                    occupation: data.occupation || "",
                    freeTime: data.freeTime || "",
                };
                setProfile(loadedProfile);
                setSavedProfile(loadedProfile);
            })
            .catch((requestError) => {
                if (active) {
                    setError(getApiErrorMessage(requestError, "Could not load your profile."));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [user?.email, user?.name]);

    const isDirty =
        profile.fullName !== savedProfile.fullName ||
        profile.occupation !== savedProfile.occupation ||
        profile.freeTime !== savedProfile.freeTime;

    const saveProfile = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setNotice("");

        try {
            const { data } = await api.put("/profile/me", {
                fullName: profile.fullName.trim(),
                occupation: profile.occupation.trim(),
                goals: profile.goals,
                freeTime: profile.freeTime.trim(),
            });
            const saved = {
                ...profile,
                ...data,
                email: data.email || profile.email,
                goals: data.goals || profile.goals,
                occupation: data.occupation || "",
                freeTime: data.freeTime || "",
            };
            setProfile(saved);
            setSavedProfile(saved);
            updateUser?.({ name: saved.fullName, role: saved.occupation || user?.role });
            setNotice("Profile updated.");
        } catch (saveError) {
            setError(getApiErrorMessage(saveError, "Could not save your profile."));
        } finally {
            setSaving(false);
        }
    };

    const cancelChanges = () => {
        setProfile(savedProfile);
        setError("");
        setNotice("");
    };

    return (
        <div className="min-h-full px-5 pb-10 pt-2 text-slate-800 dark:text-slate-100 sm:px-8">
            <div className="mx-auto max-w-5xl">
                <header className="mb-7">
                    <h2 className="text-2xl font-semibold tracking-tight">Profile and visibility</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                        Manage your personal information and control which information other people see.
                    </p>
                </header>

                <form onSubmit={saveProfile}>
                    <section className="mb-7">
                        <h3 className="mb-3 text-sm font-semibold">Profile photo and header image</h3>
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-[#1e2328]">
                            <div className="h-24 bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 dark:from-slate-500 dark:via-slate-400 dark:to-slate-300 sm:h-28" />
                            <div className="flex min-h-[76px] flex-wrap items-center justify-between gap-4 px-5 pb-4 pt-3 sm:px-7">
                                <div className="-mt-10 flex items-end gap-4">
                                    <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#20395f] text-2xl font-medium text-white shadow-sm dark:border-[#1e2328]">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={`${profile.fullName || "Profile"} profile photo`} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            initials(profile.fullName)
                                        )}
                                    </div>
                                    <div className="pb-1">
                                        <p className="text-sm font-medium">Profile photo</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Your initials appear until a profile photo is available.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Info size={15} aria-hidden="true" />
                                    Who can see your profile photo?
                                    <Visibility />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="mb-3 text-sm font-semibold">About you</h3>
                        <div className="rounded-lg bg-white px-4 shadow-sm dark:bg-[#1e2328] sm:px-5">
                            <ProfileField id="profile-full-name" label="Full name">
                                <input
                                    id="profile-full-name"
                                    autoComplete="name"
                                    className={inputClass}
                                    disabled={loading}
                                    maxLength={120}
                                    onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))}
                                    required
                                    value={profile.fullName}
                                />
                            </ProfileField>

                            <ProfileField id="profile-email" label="Email address" visibility={false}>
                                <input
                                    autoComplete="email"
                                    className={`${inputClass} cursor-not-allowed text-slate-500`}
                                    id="profile-email"
                                    readOnly
                                    value={profile.email}
                                />
                            </ProfileField>

                            <ProfileField id="profile-job-title" label="Job title">
                                <input
                                    autoComplete="organization-title"
                                    className={inputClass}
                                    disabled={loading}
                                    id="profile-job-title"
                                    maxLength={120}
                                    onChange={(event) => setProfile((current) => ({ ...current, occupation: event.target.value }))}
                                    placeholder="Add your job title"
                                    value={profile.occupation}
                                />
                            </ProfileField>

                            <ProfileField id="profile-working-preferences" label="Working preferences" visibility={false}>
                                <textarea
                                    className={`${inputClass} resize-y`}
                                    disabled={loading}
                                    id="profile-working-preferences"
                                    maxLength={1000}
                                    onChange={(event) => setProfile((current) => ({ ...current, freeTime: event.target.value }))}
                                    placeholder="Share how you prefer to work and when teammates can reach you"
                                    rows={3}
                                    value={profile.freeTime}
                                />
                            </ProfileField>
                        </div>
                    </section>

                    {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
                    {notice && <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400" role="status">{notice}</p>}

                    <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
                        <button
                            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                            disabled={!isDirty || saving}
                            onClick={cancelChanges}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={loading || saving || !isDirty}
                            type="submit"
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
