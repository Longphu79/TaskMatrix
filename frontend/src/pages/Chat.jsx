import { useState, useRef, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../services/apiClient";

export default function Chat() {
    const { currentWorkspace, members = [] } = useWorkspace();

    const [channels, setChannels] = useState([]);
    const [activeTarget, setActiveTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [selectedAttachment, setSelectedAttachment] = useState(null); // { name, url, size, isImage }

    const [showInfo, setShowInfo] = useState(false);
    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelTopic, setNewChannelTopic] = useState("");

    const chatEndRef = useRef(null);
    const hubConnectionRef = useRef(null);
    const fileInputRef = useRef(null);

    // 🟢 Đọc thông tin người dùng từ JWT
    const getCurrentUserInfo = () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return { id: null, email: null };
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const id =
                payload[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                ] ||
                payload.nameid ||
                payload.sub ||
                payload.id ||
                payload.userId;
            const email =
                payload[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                ] || payload.email;
            return { id, email };
        } catch {
            return { id: null, email: null };
        }
    };

    const { id: currentUserId, email: currentUserEmail } = getCurrentUserInfo();

    // 🟢 1. Khởi tạo SignalR WebSocket
    useEffect(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;

        let isCancelled = false;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5260/hubs/chat", {
                accessTokenFactory: () => token || "",
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        // Xử lý khi nhận tin nhắn từ SignalR Hub (Có lọc trùng lặp)
        connection.on("ReceiveMessage", (msg) => {
            if (!isCancelled) {
                setMessages((prev) => {
                    // Nếu tin nhắn đã tồn tại (do ID thực từ server hoặc tin nhắn tạm), tránh hiển thị lặp
                    const isExist = prev.some((m) => m.id === msg.id);
                    if (isExist) return prev;

                    // Lọc bỏ tin nhắn tạm trùng khớp nội dung nếu server gửi lại tin thực
                    const filtered = prev.filter(
                        (m) =>
                            !(
                                String(m.id).startsWith("temp-") &&
                                m.senderId === msg.senderId &&
                                m.text === msg.text
                            ),
                    );
                    return [...filtered, msg];
                });
            }
        });

        hubConnectionRef.current = connection;

        const startPromise = connection
            .start()
            .then(() => {
                if (!isCancelled && currentUserId) {
                    return connection.invoke("RegisterUser", currentUserId);
                }
            })
            .catch((err) => {
                if (!isCancelled)
                    console.error("SignalR Connection Error: ", err);
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

    // 🟢 2. Tải danh sách Channels
    const loadChannels = useCallback(async () => {
        if (!currentWorkspace?.id || currentWorkspace.id === "personal") return;
        try {
            const data = await apiClient.get(
                `/chat/workspaces/${currentWorkspace.id}/channels`,
            );
            if (Array.isArray(data) && data.length > 0) {
                setChannels(data);
                if (!activeTarget) {
                    setActiveTarget({ type: "channel", data: data[0] });
                }
            }
        } catch (err) {
            console.error("Lỗi tải Channels:", err);
        }
    }, [currentWorkspace?.id, activeTarget]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    // 🟢 3. Tham gia phòng SignalR & Tải tin nhắn
    useEffect(() => {
        if (!activeTarget) return;

        const fetchMessages = async () => {
            try {
                if (activeTarget.type === "channel") {
                    const channelId = activeTarget.data.id;
                    if (
                        hubConnectionRef.current?.state ===
                        signalR.HubConnectionState.Connected
                    ) {
                        await hubConnectionRef.current.invoke(
                            "JoinChannel",
                            channelId,
                        );
                    }
                    const data = await apiClient.get(
                        `/chat/channels/${channelId}/messages`,
                    );
                    setMessages(data || []);
                } else if (activeTarget.type === "dm") {
                    const targetUserId =
                        activeTarget.data.userId || activeTarget.data.id;
                    const data = await apiClient.get(
                        `/chat/workspaces/${currentWorkspace.id}/dm/${targetUserId}/messages`,
                    );
                    setMessages(data || []);
                }
            } catch (err) {
                console.error("Lỗi tải tin nhắn:", err);
            }
        };

        fetchMessages();

        return () => {
            if (
                activeTarget.type === "channel" &&
                hubConnectionRef.current?.state ===
                    signalR.HubConnectionState.Connected
            ) {
                hubConnectionRef.current
                    .invoke("LeaveChannel", activeTarget.data.id)
                    .catch(() => {});
            }
        };
    }, [activeTarget, currentWorkspace?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 🟢 4. Xử lý Chọn File / Ảnh
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Url = event.target.result;
            const sizeInKb = (file.size / 1024).toFixed(1) + " KB";
            const isImage = file.type.startsWith("image/");

            setSelectedAttachment({
                name: file.name,
                url: base64Url,
                size: sizeInKb,
                isImage: isImage,
            });
        };
        reader.readAsDataURL(file);
    };

    // 🟢 5. Xử lý Gửi tin nhắn + File (Cập nhật hiển thị ngay lập tức)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !selectedAttachment) || !activeTarget) return;

        const textToSend = inputText.trim();
        const attachmentToSend = selectedAttachment
            ? {
                  name: selectedAttachment.name,
                  url: selectedAttachment.url,
                  size: selectedAttachment.size,
              }
            : null;

        // 1. Tạo tin nhắn tạm để hiển thị NGAY LẬP TỨC trên UI
        const tempMsg = {
            id: `temp-${Date.now()}`,
            senderId: currentUserId,
            senderName: "You",
            text: textToSend,
            time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
            createdAt: new Date().toISOString(),
            attachment: attachmentToSend,
        };

        // Thêm trực tiếp vào danh sách tin nhắn hiện tại
        setMessages((prev) => [...prev, tempMsg]);

        // Reset ô nhập liệu ngay lập tức cho trải nghiệm mượt mà
        setInputText("");
        setSelectedAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

        // 2. Gửi dữ liệu qua SignalR Hub
        const dto = {
            workspaceId: currentWorkspace.id,
            channelId:
                activeTarget.type === "channel" ? activeTarget.data.id : null,
            recipientId:
                activeTarget.type === "dm"
                    ? activeTarget.data.userId || activeTarget.data.id
                    : null,
            text: textToSend,
            attachment: attachmentToSend,
        };

        try {
            if (
                hubConnectionRef.current?.state ===
                signalR.HubConnectionState.Connected
            ) {
                await hubConnectionRef.current.invoke(
                    "SendMessage",
                    currentUserId,
                    dto,
                );
            }
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
        }
    };

    // 🟢 6. Tạo Channel
    const handleCreateChannel = async (e) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;

        try {
            const newChan = await apiClient.post(
                `/chat/workspaces/${currentWorkspace.id}/channels`,
                {
                    name: newChannelName,
                    topic: newChannelTopic,
                },
            );
            setChannels((prev) => [...prev, newChan]);
            setActiveTarget({ type: "channel", data: newChan });
            setShowNewChannelModal(false);
            setNewChannelName("");
            setNewChannelTopic("");
        } catch (err) {
            console.error("Lỗi tạo channel:", err);
        }
    };

    const otherMembers = members.filter((m) => {
        const mId = m.userId || m.id;
        const mEmail = m.email;
        return mId !== currentUserId && mEmail !== currentUserEmail;
    });

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Sidebar Trái */}
            <div className="flex w-64 shrink-0 flex-col border-r border-hairline bg-canvas/50 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex h-16 items-center justify-between border-b border-hairline px-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white dark:bg-brand dark:text-slate-900">
                            {currentWorkspace?.name?.charAt(0).toUpperCase() ||
                                "W"}
                        </div>
                        <span className="font-display text-sm font-bold truncate text-ink dark:text-white">
                            {currentWorkspace?.name || "Workspace"}
                        </span>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-3">
                    {/* Channels */}
                    <div>
                        <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                            <span>Channels</span>
                            <button
                                type="button"
                                onClick={() => setShowNewChannelModal(true)}
                                className="text-base font-bold hover:text-ink dark:hover:text-white"
                            >
                                +
                            </button>
                        </div>
                        <div className="space-y-0.5">
                            {channels.map((ch) => {
                                const isSelected =
                                    activeTarget?.type === "channel" &&
                                    activeTarget.data.id === ch.id;
                                return (
                                    <button
                                        key={ch.id}
                                        type="button"
                                        onClick={() =>
                                            setActiveTarget({
                                                type: "channel",
                                                data: ch,
                                            })
                                        }
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                                            isSelected
                                                ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white"
                                                : "text-muted hover:bg-white/60 hover:text-ink dark:hover:bg-slate-800/50 dark:hover:text-white"
                                        }`}
                                    >
                                        <span className="flex items-center gap-1.5 truncate">
                                            <span className="opacity-60">
                                                #
                                            </span>
                                            {ch.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Direct Messages */}
                    <div>
                        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                            Direct Messages
                        </div>
                        <div className="space-y-0.5">
                            {otherMembers.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-muted">
                                    No other members.
                                </div>
                            ) : (
                                otherMembers.map((u) => {
                                    const uId = u.userId || u.id;
                                    const uName =
                                        u.fullName ||
                                        u.name ||
                                        u.email ||
                                        "Member";
                                    const isSelected =
                                        activeTarget?.type === "dm" &&
                                        (activeTarget.data.userId ||
                                            activeTarget.data.id) === uId;

                                    return (
                                        <button
                                            key={uId}
                                            type="button"
                                            onClick={() =>
                                                setActiveTarget({
                                                    type: "dm",
                                                    data: u,
                                                })
                                            }
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                                                isSelected
                                                    ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white"
                                                    : "text-muted hover:bg-white/60 hover:text-ink dark:hover:bg-slate-800/50 dark:hover:text-white"
                                            }`}
                                        >
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
                                                {uName.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="truncate">
                                                {uName}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Khung Chat Chính */}
            <div className="flex flex-1 flex-col">
                {activeTarget ? (
                    <>
                        <div className="flex h-16 items-center justify-between border-b border-hairline px-6 dark:border-slate-800">
                            <div>
                                <h3 className="font-display text-base font-bold text-ink dark:text-white">
                                    {activeTarget.type === "channel"
                                        ? `#${activeTarget.data.name}`
                                        : activeTarget.data.fullName ||
                                          activeTarget.data.name}
                                </h3>
                                <p className="text-xs text-muted truncate max-w-md">
                                    {activeTarget.type === "channel"
                                        ? activeTarget.data.topic ||
                                          "Channel discussion"
                                        : "Direct Message"}
                                </p>
                            </div>
                        </div>

                        {/* Feed Tin Nhắn */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.senderId === currentUserId;
                                const isImage =
                                    msg.attachment?.url?.startsWith(
                                        "data:image/",
                                    ) ||
                                    msg.attachment?.name?.match(
                                        /\.(jpg|jpeg|png|gif|webp)$/i,
                                    );

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                                    >
                                        {/* Avatar */}
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
                                            {msg.senderName
                                                ?.charAt(0)
                                                .toUpperCase() || "U"}
                                        </span>

                                        {/* Cột thông tin tin nhắn */}
                                        <div
                                            className={`flex max-w-[70%] flex-col ${
                                                isMe
                                                    ? "items-end"
                                                    : "items-start"
                                            }`}
                                        >
                                            {/* Name & Time Header */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-ink dark:text-white">
                                                    {isMe
                                                        ? "You"
                                                        : msg.senderName}
                                                </span>
                                                <span className="text-[10px] text-muted">
                                                    {msg.time}
                                                </span>
                                            </div>

                                            {/* Attachment View (Nếu có) */}
                                            {msg.attachment && (
                                                <div className="mb-2">
                                                    {isImage ? (
                                                        <img
                                                            src={
                                                                msg.attachment
                                                                    .url
                                                            }
                                                            alt={
                                                                msg.attachment
                                                                    .name
                                                            }
                                                            className="max-h-60 max-w-xs rounded-2xl border border-hairline object-cover shadow-sm dark:border-slate-700"
                                                        />
                                                    ) : (
                                                        <a
                                                            href={
                                                                msg.attachment
                                                                    .url
                                                            }
                                                            download={
                                                                msg.attachment
                                                                    .name
                                                            }
                                                            className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas p-3 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                                        >
                                                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/20 text-brand font-bold text-xs">
                                                                📄
                                                            </div>
                                                            <div className="text-left truncate max-w-[180px]">
                                                                <div className="text-xs font-bold truncate text-ink dark:text-white">
                                                                    {
                                                                        msg
                                                                            .attachment
                                                                            .name
                                                                    }
                                                                </div>
                                                                <div className="text-[10px] text-muted">
                                                                    {
                                                                        msg
                                                                            .attachment
                                                                            .size
                                                                    }
                                                                </div>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {/* Text Bubble */}
                                            {msg.text && (
                                                <div
                                                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                                        isMe
                                                            ? "bg-brand text-slate-900 font-medium rounded-tr-xs"
                                                            : "bg-canvas dark:bg-slate-800 text-ink dark:text-slate-100 rounded-tl-xs"
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Khung nhập tin nhắn + Preview File đính kèm */}
                        <form
                            onSubmit={handleSendMessage}
                            className="p-4 border-t border-hairline dark:border-slate-800"
                        >
                            {/* Preview File trước khi gửi */}
                            {selectedAttachment && (
                                <div className="mb-2 flex items-center gap-3 rounded-2xl bg-amber-50 p-2.5 border border-amber-200/60 dark:bg-slate-800 dark:border-slate-700">
                                    {selectedAttachment.isImage ? (
                                        <img
                                            src={selectedAttachment.url}
                                            alt="Preview"
                                            className="h-10 w-10 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-slate-900 font-bold text-xs">
                                            📄
                                        </div>
                                    )}
                                    <div className="flex-1 truncate">
                                        <div className="text-xs font-bold text-ink dark:text-white truncate">
                                            {selectedAttachment.name}
                                        </div>
                                        <div className="text-[10px] text-muted">
                                            {selectedAttachment.size}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAttachment(null);
                                            if (fileInputRef.current)
                                                fileInputRef.current.value = "";
                                        }}
                                        className="h-6 w-6 rounded-full bg-slate-200 text-xs font-bold hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Input Form */}
                            <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-canvas/30 p-2 focus-within:border-brand dark:border-slate-800 dark:bg-slate-800/40">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-white hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                                    title="Attach image or file"
                                >
                                    📎
                                </button>

                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    placeholder={`Message ${
                                        activeTarget.type === "channel"
                                            ? `#${activeTarget.data.name}`
                                            : activeTarget.data.fullName ||
                                              activeTarget.data.name
                                    }...`}
                                    className="flex-1 bg-transparent px-2 text-sm text-ink outline-none dark:text-white placeholder:text-muted"
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        !inputText.trim() && !selectedAttachment
                                    }
                                    className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400 disabled:opacity-40"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-sm text-muted">
                        Select a channel or team member to start chatting.
                    </div>
                )}
            </div>

            {/* Modal tạo Channel mới */}
            {showNewChannelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-lg font-bold text-ink dark:text-white mb-4">
                            Create a Channel
                        </h3>
                        <form
                            onSubmit={handleCreateChannel}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">
                                    Channel Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. dev-sprint"
                                    value={newChannelName}
                                    onChange={(e) =>
                                        setNewChannelName(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted mb-1">
                                    Topic / Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="What is this channel about?"
                                    value={newChannelTopic}
                                    onChange={(e) =>
                                        setNewChannelTopic(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewChannelModal(false)
                                    }
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-ink dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-brand px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
