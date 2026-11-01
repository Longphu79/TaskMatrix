import { useState, useRef, useEffect } from "react";

// Dữ liệu mẫu Channels & Team Members
const CHANNELS = [
    {
        id: "c1",
        name: "general",
        topic: "Company-wide announcements & watercooler",
        unread: 0,
    },
    {
        id: "c2",
        name: "project-matrix",
        topic: "Food Dashboard UI & API integration",
        unread: 3,
    },
    {
        id: "c3",
        name: "design-system",
        topic: "UI components, icons & tokens",
        unread: 0,
    },
    {
        id: "c4",
        name: "dev-sprint",
        topic: "Sprint planning & blocker updates",
        unread: 1,
    },
];

const DIRECT_MESSAGES = [
    {
        id: "u1",
        name: "Manjay Gupta",
        role: "UI/UX Designer",
        status: "online",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    },
    {
        id: "u2",
        name: "Jenny",
        role: "Frontend Lead",
        status: "online",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    {
        id: "u3",
        name: "Jack Mark",
        role: "React Developer",
        status: "away",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    },
];

const INITIAL_MESSAGES = [
    {
        id: 1,
        sender: "Jenny",
        role: "Frontend Lead",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        time: "10:15 AM",
        text: "Hi everyone! Has anyone reviewed the new wireframes for the Timesheets page?",
        attachment: null,
    },
    {
        id: 2,
        sender: "Jack Mark",
        role: "React Developer",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        time: "10:18 AM",
        text: "I just checked them! We extended the Y-axis time slots from 6 AM to 11 PM and added auto-scrolling.",
        attachment: { name: "Timesheets_v2_Preview.png", size: "2.4 MB" },
    },
    {
        id: 3,
        sender: "Manjay Gupta",
        role: "UI/UX Designer",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        time: "10:22 AM",
        text: "Awesome work! Looks super clean and smooth now. Let's push this to the main branch.",
        attachment: null,
    },
];

export default function Chat() {
    const [activeChannel, setActiveChannel] = useState(CHANNELS[1]); // Mặc định #project-matrix
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const chatEndRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Xử lý gửi tin nhắn
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMsg = {
            id: Date.now(),
            sender: "You",
            role: "UI/UX Designer",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            text: inputText,
            attachment: null,
        };

        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Sidebar Trái - Channels & DMs */}
            <div className="flex w-64 shrink-0 flex-col border-r border-hairline bg-canvas/50 dark:border-slate-800 dark:bg-slate-900/60">
                {/* Header Công ty / Workspace */}
                <div className="flex h-16 items-center justify-between border-b border-hairline px-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white dark:bg-brand dark:text-slate-900">
                            M
                        </div>
                        <span className="font-display text-sm font-bold text-ink dark:text-white">
                            Matrix Work
                        </span>
                    </div>
                </div>

                {/* Danh sách Channel & DM */}
                <div className="flex-1 space-y-6 overflow-y-auto p-3">
                    {/* Projects / Channels */}
                    <div>
                        <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                            <span>Channels</span>
                            <button className="hover:text-ink dark:hover:text-white">
                                +
                            </button>
                        </div>
                        <div className="space-y-0.5">
                            {CHANNELS.map((ch) => (
                                <button
                                    key={ch.id}
                                    onClick={() => setActiveChannel(ch)}
                                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                        activeChannel.id === ch.id
                                            ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white"
                                            : "text-muted hover:bg-white/60 hover:text-ink dark:hover:bg-slate-800/50 dark:hover:text-white"
                                    }`}
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        <span className="opacity-60">#</span>
                                        {ch.name}
                                    </span>
                                    {ch.unread > 0 && (
                                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                                            {ch.unread}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direct Messages */}
                    <div>
                        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                            Direct Messages
                        </div>
                        <div className="space-y-0.5">
                            {DIRECT_MESSAGES.map((user) => (
                                <button
                                    key={user.id}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted hover:bg-white/60 hover:text-ink dark:hover:bg-slate-800/50 dark:hover:text-white"
                                >
                                    <div className="relative">
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="h-6 w-6 rounded-full object-cover"
                                        />
                                        <span
                                            className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                                user.status === "online"
                                                    ? "bg-emerald-500"
                                                    : "bg-amber-400"
                                            }`}
                                        />
                                    </div>
                                    <span className="truncate">
                                        {user.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Khung Chat Chính */}
            <div className="flex flex-1 flex-col">
                {/* Header của Channel */}
                <div className="flex h-16 items-center justify-between border-b border-hairline px-6 dark:border-slate-800">
                    <div>
                        <h3 className="font-display text-base font-bold text-ink dark:text-white">
                            #{activeChannel.name}
                        </h3>
                        <p className="text-xs text-muted truncate max-w-md">
                            {activeChannel.topic}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="rounded-xl border border-hairline px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink dark:border-slate-800 dark:hover:text-white"
                        >
                            {showInfo ? "Hide Details" : "Channel Info"}
                        </button>
                    </div>
                </div>

                {/* Danh sách Tin nhắn (Feed) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className="group flex items-start gap-3.5"
                        >
                            <img
                                src={msg.avatar}
                                alt={msg.sender}
                                className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-ink dark:text-white">
                                        {msg.sender}
                                    </span>
                                    <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[10px] font-semibold text-muted dark:bg-slate-800">
                                        {msg.role}
                                    </span>
                                    <span className="text-[11px] text-muted">
                                        {msg.time}
                                    </span>
                                </div>

                                {/* Nội dung chữ */}
                                <p className="mt-1 text-sm text-ink/90 leading-relaxed dark:text-slate-200">
                                    {msg.text}
                                </p>

                                {/* File đính kèm (nếu có) */}
                                {msg.attachment && (
                                    <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-hairline bg-canvas/40 p-3 w-fit dark:border-slate-800 dark:bg-slate-800/50">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20 text-brand font-bold text-xs">
                                            PNG
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-ink dark:text-white">
                                                {msg.attachment.name}
                                            </div>
                                            <div className="text-[10px] text-muted">
                                                {msg.attachment.size}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Khung Nhập Tin Nhắn (Composer) */}
                <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-hairline dark:border-slate-800"
                >
                    <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-canvas/30 p-2 focus-within:border-brand dark:border-slate-800 dark:bg-slate-800/40">
                        <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-hairline dark:hover:bg-slate-700"
                        >
                            📎
                        </button>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={`Message #${activeChannel.name}...`}
                            className="flex-1 bg-transparent px-2 text-sm text-ink outline-none dark:text-white placeholder:text-muted"
                        />
                        <button
                            type="submit"
                            className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>

            {/* Sidebar Phải - Thông tin Channel (Ẩn/Hiện) */}
            {showInfo && (
                <div className="w-64 shrink-0 border-l border-hairline p-4 dark:border-slate-800 bg-canvas/20">
                    <h4 className="font-display text-sm font-bold text-ink dark:text-white">
                        About #{activeChannel.name}
                    </h4>
                    <p className="mt-2 text-xs text-muted leading-relaxed">
                        {activeChannel.topic}
                    </p>

                    <div className="mt-6">
                        <div className="text-xs font-bold text-ink dark:text-white mb-3">
                            Members (3)
                        </div>
                        <div className="space-y-2">
                            {DIRECT_MESSAGES.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <img
                                        src={u.avatar}
                                        className="h-6 w-6 rounded-full object-cover"
                                    />
                                    <span className="font-medium text-ink dark:text-slate-200">
                                        {u.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
