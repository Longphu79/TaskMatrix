import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { BellIcon, SparkleIcon } from "../../../components/icon";
import { notificationApi } from "../api/notificationApi";

function getAuthToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function getCurrentUserId() {
    try {
        const token = getAuthToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (
            payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ] ||
            payload.nameid ||
            payload.sub ||
            payload.id ||
            payload.userId ||
            null
        );
    } catch {
        return null;
    }
}

function renderFormattedText(text) {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong
                    key={idx}
                    className="font-semibold text-ink dark:text-white"
                >
                    {part.slice(2, -2)}
                </strong>
            );
        }
        return <span key={idx}>{part}</span>;
    });
}

export default function NotificationBell({ className = "" }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshingAi, setRefreshingAi] = useState(false);
    const dropdownRef = useRef(null);

    const currentUserId = getCurrentUserId();

    useEffect(() => {
        if (getAuthToken()) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getAll();
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        } catch (err) {
            console.error("Lỗi tải thông báo:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = getAuthToken();
        if (!token || !currentUserId) return;

        let isCancelled = false;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5260/hubs/notification", {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.on("ReceiveNotification", (newNotif) => {
            if (!isCancelled && newNotif && newNotif.userId === currentUserId) {
                setNotifications((prev) => {
                    if (prev.some((n) => n.id === newNotif.id)) return prev;
                    return [newNotif, ...prev];
                });
            }
        });

        const startPromise = connection.start().catch((err) => {
            if (!isCancelled) {
                console.warn("SignalR Notification chưa kết nối:", err.message);
            }
        });

        return () => {
            isCancelled = true;
            startPromise
                .then(() => {
                    if (
                        connection.state ===
                        signalR.HubConnectionState.Connected
                    ) {
                        connection.stop().catch(() => {});
                    }
                })
                .catch(() => {});
        };
    }, [currentUserId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleRefreshAi = async () => {
        if (refreshingAi) return;
        setRefreshingAi(true);
        try {
            const newBriefing = await notificationApi.refreshAiBriefing();
            setNotifications((prev) => {
                const filtered = prev.filter(
                    (n) =>
                        !(
                            n.type === "AI_BRIEFING" &&
                            n.dateKey === newBriefing.dateKey
                        ),
                );
                return [newBriefing, ...filtered];
            });
        } catch (err) {
            console.error("Lỗi làm mới báo cáo AI:", err);
        } finally {
            setRefreshingAi(false);
        }
    };

    const handleMarkRead = async (notif) => {
        if (notif.isRead) return;
        setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        try {
            await notificationApi.markAsRead(notif.id);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            await notificationApi.markAllAsRead();
        } catch (err) {
            console.error(err);
        }
    };

    // 🟢 Xóa 1 thông báo
    const handleDeleteOne = async (e, id) => {
        e.stopPropagation();
        const backup = notifications;
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await notificationApi.deleteNotification(id);
        } catch (err) {
            console.error("Lỗi xóa thông báo:", err);
            setNotifications(backup);
        }
    };

    // 🟢 Xóa toàn bộ thông báo hoạt động
    const handleClearAll = async () => {
        const backup = notifications;
        setNotifications((prev) =>
            prev.filter((n) => n.type === "AI_BRIEFING"),
        );
        try {
            await notificationApi.clearAll();
        } catch (err) {
            console.error("Lỗi xóa tất cả thông báo:", err);
            setNotifications(backup);
        }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const aiBriefing = notifications.find((n) => n.type === "AI_BRIEFING");
    const activityNotifs = notifications.filter(
        (n) => n.type !== "AI_BRIEFING",
    );

    const getBadgeStyle = (type) => {
        switch (type) {
            case "TASK_ASSIGNED":
                return {
                    label: "Giao việc",
                    dot: "bg-blue-500",
                    bg: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
                };
            case "TASK_COMPLETED":
                return {
                    label: "Hoàn thành",
                    dot: "bg-emerald-500",
                    bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
                };
            default:
                return {
                    label: "Cập nhật",
                    dot: "bg-amber-500",
                    bg: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
                };
        }
    };

    const formatTime = (isoDate) => {
        if (!isoDate) return "";
        const diffMins = Math.floor((Date.now() - new Date(isoDate)) / 60000);
        if (diffMins < 1) return "Vừa xong";
        if (diffMins < 60) return `${diffMins} phút trước`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} giờ trước`;
        return new Date(isoDate).toLocaleDateString("vi-VN");
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Nút Chuông đồng bộ style Topbar */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Thông báo"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink transition hover:text-brand dark:bg-slate-800 dark:text-white"
            >
                <BellIcon width={20} height={20} />

                {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-ink ring-2 ring-white dark:ring-slate-800">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Danh sách thông báo */}
            {open && (
                <div className="absolute right-0 z-50 mt-2.5 w-90 max-w-[92vw] overflow-hidden rounded-3xl border border-hairline bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-hairline px-4 py-3 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-ink dark:text-white">
                                Thông báo
                            </h3>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-ink dark:bg-brand/20 dark:text-brand">
                                    {unreadCount} mới
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    className="text-xs font-medium text-muted transition hover:text-ink dark:hover:text-white"
                                >
                                    Đã đọc hết
                                </button>
                            )}
                            {activityNotifs.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-xs font-medium text-red-500 transition hover:text-red-600"
                                >
                                    Xóa tất cả
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-110 space-y-3 overflow-y-auto p-3">
                        {loading ? (
                            <div className="py-8 text-center text-xs text-muted">
                                Đang tải thông báo...
                            </div>
                        ) : (
                            <>
                                {/* Thẻ Báo cáo AI */}
                                {aiBriefing && (
                                    <div
                                        onClick={() =>
                                            handleMarkRead(aiBriefing)
                                        }
                                        className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                                            aiBriefing.isRead
                                                ? "border-hairline bg-canvas/60 dark:border-slate-700 dark:bg-slate-700/30"
                                                : "border-brand/40 bg-brand-soft/45 dark:border-brand/30 dark:bg-brand/10"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand/20 text-ink dark:text-brand">
                                                    <SparkleIcon
                                                        width={14}
                                                        height={14}
                                                    />
                                                </span>
                                                <span className="text-xs font-bold text-ink dark:text-brand">
                                                    {aiBriefing.title.replace(
                                                        "✨ ",
                                                        "",
                                                    )}
                                                </span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRefreshAi();
                                                }}
                                                disabled={refreshingAi}
                                                className="rounded-lg border border-hairline bg-white px-2 py-1 text-[11px] font-semibold text-ink transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                                            >
                                                {refreshingAi
                                                    ? "Đang quét..."
                                                    : "Làm mới"}
                                            </button>
                                        </div>

                                        <div className="mt-2.5 max-h-36 overflow-y-auto whitespace-pre-line text-xs leading-5 text-ink/85 dark:text-slate-200">
                                            {renderFormattedText(
                                                aiBriefing.message,
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Danh sách hoạt động Workspace */}
                                {activityNotifs.length === 0 ? (
                                    <div className="py-5 text-center text-xs text-muted">
                                        Chưa có thông báo hoạt động mới trong
                                        Workspace.
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {activityNotifs.map((item) => {
                                            const badge = getBadgeStyle(
                                                item.type,
                                            );
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() =>
                                                        handleMarkRead(item)
                                                    }
                                                    className={`group flex cursor-pointer items-start gap-2.5 rounded-2xl p-2.5 transition ${
                                                        item.isRead
                                                            ? "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                                                            : "bg-slate-100/80 hover:bg-slate-100 dark:bg-slate-700/60"
                                                    }`}
                                                >
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${badge.dot}`}
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="truncate text-xs font-bold text-ink dark:text-white">
                                                                {item.title}
                                                            </p>
                                                            <div className="flex shrink-0 items-center gap-1.5">
                                                                <span
                                                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${badge.bg}`}
                                                                >
                                                                    {
                                                                        badge.label
                                                                    }
                                                                </span>
                                                                {/* 🟢 Nút xóa từng thông báo */}
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        handleDeleteOne(
                                                                            e,
                                                                            item.id,
                                                                        )
                                                                    }
                                                                    title="Xóa thông báo"
                                                                    aria-label="Xóa thông báo"
                                                                    className="flex h-5 w-5 items-center justify-center rounded-md text-muted opacity-70 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-500/15"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="h-3.5 w-3.5"
                                                                    >
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="mt-0.5 text-xs leading-relaxed text-muted dark:text-slate-300">
                                                            {item.message}
                                                        </p>
                                                        <span className="mt-1 block text-[10px] text-muted">
                                                            {formatTime(
                                                                item.createdAt,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
