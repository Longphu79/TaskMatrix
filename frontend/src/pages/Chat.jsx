import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as signalR from "@microsoft/signalr";
import { useWorkspace } from "../context/WorkspaceContext";
import apiClient from "../services/apiClient";
import CallRoom from "../components/CallRoom";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolveUserAvatar } from "../components/UserDropdown";
import { Ic, EMOJI_GROUPS } from "../components/IconChat";

const getMemberUserId = (m) =>
    String(m?.userId || m?.user?.id || m?.user?._id || m?.id || "");

const isImageAttachment = (attachment) => {
    if (!attachment) return false;
    return (
        attachment.url?.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachment.name || "")
    );
};

export default function Chat() {
    const { currentWorkspace, members = [] } = useWorkspace();

    const [channels, setChannels] = useState([]);
    const [activeTarget, setActiveTarget] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [selectedAttachment, setSelectedAttachment] = useState(null);

    const [showNewChannelModal, setShowNewChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelTopic, setNewChannelTopic] = useState("");

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const [showMediaDrawer, setShowMediaDrawer] = useState(false);
    const [mediaTab, setMediaTab] = useState("images");
    const [previewImage, setPreviewImage] = useState(null);
    const [showClearChatModal, setShowClearChatModal] = useState(false);
    const [isClearingChat, setIsClearingChat] = useState(false);

    const [signalRConnected, setSignalRConnected] = useState(false);
    const [inCall, setInCall] = useState(false);
    const [callWithVideo, setCallWithVideo] = useState(true);
    const [activeCallRoomId, setActiveCallRoomId] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);

    const chatEndRef = useRef(null);
    const hubConnectionRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const activeTargetRef = useRef(null);
    const inCallRef = useRef(false);
    const activeCallRoomIdRef = useRef(null);
    const location = useLocation();
    const { user: authUser } = useAuth();

    useEffect(() => {
        const callData = location.state?.autoAcceptCall;
        if (!callData || !signalRConnected) return;

        if (callData.channelId) {
            const targetChan = channels.find(
                (c) => c.id === callData.channelId,
            );
            if (targetChan)
                setActiveTarget({ type: "channel", data: targetChan });
        } else if (callData.callerId) {
            const callerMember = members.find(
                (m) => getMemberUserId(m) === String(callData.callerId),
            );
            if (callerMember)
                setActiveTarget({ type: "dm", data: callerMember });
        }

        setCallWithVideo(callData.videoEnabled ?? true);
        setActiveCallRoomId(callData.roomId);
        setInCall(true);

        window.history.replaceState({}, document.title);
    }, [location.state, signalRConnected, channels, members]);

    useEffect(() => {
        activeTargetRef.current = activeTarget;
    }, [activeTarget]);

    useEffect(() => {
        inCallRef.current = inCall;
    }, [inCall]);

    useEffect(() => {
        activeCallRoomIdRef.current = activeCallRoomId;
    }, [activeCallRoomId]);

    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (e) => {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(e.target)
            ) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showEmojiPicker]);

    useEffect(() => {
        if (!incomingCall || inCall) return;

        const playRing = () => {
            try {
                const AudioCtx =
                    window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(
                    0.001,
                    ctx.currentTime + 0.45,
                );
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.45);
            } catch {
                // Bỏ qua nếu trình duyệt chặn autoplay
            }
        };

        playRing();
        const interval = setInterval(playRing, 2500);
        return () => clearInterval(interval);
    }, [incomingCall, inCall]);

    const getCurrentUserInfo = () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return { id: null, email: null, name: null };
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
            const name =
                payload[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
                ] ||
                payload.unique_name ||
                payload.name ||
                email?.split("@")[0];
            return { id, email, name };
        } catch {
            return { id: null, email: null, name: null };
        }
    };

    const {
        id: currentUserId,
        email: currentUserEmail,
        name: currentUserName,
    } = getCurrentUserInfo();

    const currentMember = members.find(
        (m) =>
            getMemberUserId(m) === String(currentUserId || "") ||
            (currentUserEmail &&
                (m.email || m.user?.email || "").toLowerCase() ===
                    currentUserEmail.toLowerCase()),
    );

    const currentUserAvatar =
        resolveUserAvatar(authUser) || resolveUserAvatar(currentMember);

    // 1. Khởi tạo SignalR WebSocket
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

        connection.onreconnected(() => {
            if (!isCancelled) {
                setSignalRConnected(true);
                if (currentUserId) {
                    connection
                        .invoke("RegisterUser", String(currentUserId))
                        .catch(() => {});
                }
                const target = activeTargetRef.current;
                if (target?.type === "channel") {
                    connection
                        .invoke("JoinChannel", target.data.id)
                        .catch(() => {});
                }
            }
        });

        connection.onclose(() => {
            if (!isCancelled) setSignalRConnected(false);
        });

        connection.on("IncomingCall", (callData) => {
            if (isCancelled) return;
            if (String(callData.callerId) === String(currentUserId)) return;
            if (inCallRef.current) return;
            setIncomingCall((prev) =>
                prev?.roomId === callData.roomId ? prev : callData,
            );
        });

        connection.on("CallCanceled", (roomId) => {
            if (isCancelled) return;
            setIncomingCall((prev) => (prev?.roomId === roomId ? null : prev));
        });

        connection.on("CallDeclined", (roomId) => {
            if (isCancelled) return;
            if (activeCallRoomIdRef.current === roomId) {
                setInCall(false);
                setActiveCallRoomId(null);
            }
        });

        connection.on("CallEnded", (roomId) => {
            if (isCancelled) return;
            if (activeCallRoomIdRef.current === roomId) {
                setInCall(false);
                setActiveCallRoomId(null);
            }
        });

        connection.on("ReceiveMessage", (msg) => {
            if (isCancelled) return;

            const target = activeTargetRef.current;
            if (!target) return;

            if (msg.channelId) {
                if (
                    target.type !== "channel" ||
                    target.data.id !== msg.channelId
                ) {
                    return;
                }
            } else {
                if (target.type !== "dm") return;
                const peerId = getMemberUserId(target.data);
                const meId = String(currentUserId);
                const senderId = String(msg.senderId || "");
                if (senderId !== peerId && senderId !== meId) return;
            }

            setMessages((prev) => {
                const isExist = prev.some((m) => m.id === msg.id);
                if (isExist) return prev;

                const filtered = prev.filter(
                    (m) =>
                        !(
                            String(m.id).startsWith("temp-") &&
                            String(m.senderId) === String(msg.senderId) &&
                            m.text === msg.text
                        ),
                );
                return [...filtered, msg];
            });
        });

        connection.on("MessageDeleted", (deletedMsgId) => {
            if (isCancelled) return;
            setMessages((prev) =>
                prev.filter((m) => String(m.id) !== String(deletedMsgId)),
            );
        });

        connection.on("ChatCleared", (payload) => {
            if (isCancelled) return;
            const target = activeTargetRef.current;
            if (!target) return;

            if (payload?.channelId) {
                if (
                    target.type === "channel" &&
                    String(target.data.id) === String(payload.channelId)
                ) {
                    setMessages([]);
                }
            } else if (
                payload?.userA &&
                payload?.userB &&
                target.type === "dm"
            ) {
                const peerId = getMemberUserId(target.data);
                const meId = String(currentUserId);
                const pair = [String(payload.userA), String(payload.userB)];
                if (pair.includes(peerId) && pair.includes(meId)) {
                    setMessages([]);
                }
            }
        });

        hubConnectionRef.current = connection;

        const startPromise = connection
            .start()
            .then(async () => {
                if (!isCancelled) {
                    if (currentUserId) {
                        await connection.invoke(
                            "RegisterUser",
                            String(currentUserId),
                        );
                    }
                    setSignalRConnected(true);
                }
            })
            .catch((err) => {
                if (!isCancelled)
                    console.error("SignalR Connection Error: ", err);
            });

        return () => {
            isCancelled = true;
            setSignalRConnected(false);
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

    // 2. Tải danh sách Channels
    const loadChannels = useCallback(async () => {
        if (!currentWorkspace?.id || currentWorkspace.id === "personal") return;
        try {
            const data = await apiClient.get(
                `/chat/workspaces/${currentWorkspace.id}/channels`,
            );
            if (Array.isArray(data) && data.length > 0) {
                setChannels(data);
                setActiveTarget({ type: "channel", data: data[0] });
            } else {
                setChannels([]);
                setActiveTarget(null);
            }
        } catch (err) {
            console.error("Lỗi tải Channels:", err);
        }
    }, [currentWorkspace?.id]);

    useEffect(() => {
        setInCall(false);
        setActiveCallRoomId(null);
        loadChannels();
    }, [loadChannels]);

    // 3. Tham gia phòng SignalR & Tải lịch sử tin nhắn
    useEffect(() => {
        if (!activeTarget) return;
        setShowEmojiPicker(false);
        setShowHeaderMenu(false);

        const fetchMessages = async () => {
            try {
                if (activeTarget.type === "channel") {
                    const channelId = activeTarget.data.id;
                    if (
                        signalRConnected &&
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
                    const targetUserId = getMemberUserId(activeTarget.data);
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
    }, [activeTarget, currentWorkspace?.id, signalRConnected]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Lọc danh sách Ảnh & File đã gửi trong cuộc trò chuyện hiện tại
    const { sharedImages, sharedFiles } = useMemo(() => {
        const imgs = [];
        const docs = [];

        messages.forEach((msg) => {
            if (!msg.attachment?.url) return;
            const item = {
                id: msg.id,
                name: msg.attachment.name || "Attachment",
                url: msg.attachment.url,
                size: msg.attachment.size || "",
                senderName:
                    String(msg.senderId) === String(currentUserId)
                        ? "You"
                        : msg.senderName || "Member",
            };
            if (isImageAttachment(msg.attachment)) {
                imgs.push(item);
            } else {
                docs.push(item);
            }
        });

        return {
            sharedImages: imgs.reverse(),
            sharedFiles: docs.reverse(),
        };
    }, [messages, currentUserId]);

    // 4. Xử lý Chọn File / Ảnh
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
                isImage,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleInsertEmoji = (emoji) => {
        setInputText((prev) => `${prev}${emoji}`);
        inputRef.current?.focus();
    };

    // 5. Xử lý Gửi tin nhắn + File
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

        setMessages((prev) => [...prev, tempMsg]);
        setInputText("");
        setSelectedAttachment(null);
        setShowEmojiPicker(false);
        if (fileInputRef.current) fileInputRef.current.value = "";

        const dto = {
            workspaceId: currentWorkspace.id,
            channelId:
                activeTarget.type === "channel" ? activeTarget.data.id : null,
            recipientId:
                activeTarget.type === "dm"
                    ? getMemberUserId(activeTarget.data)
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

    // Xóa 1 tin nhắn
    const handleDeleteMessage = async (messageId) => {
        if (!messageId) return;
        setMessages((prev) =>
            prev.filter((m) => String(m.id) !== String(messageId)),
        );

        if (String(messageId).startsWith("temp-")) return;

        try {
            await apiClient.delete(`/chat/messages/${messageId}`);
            if (
                hubConnectionRef.current?.state ===
                signalR.HubConnectionState.Connected
            ) {
                const channelId =
                    activeTarget?.type === "channel"
                        ? activeTarget.data.id
                        : null;
                const recipientId =
                    activeTarget?.type === "dm"
                        ? getMemberUserId(activeTarget.data)
                        : null;
                await hubConnectionRef.current
                    .invoke(
                        "NotifyMessageDeleted",
                        String(messageId),
                        channelId,
                        recipientId,
                    )
                    .catch(() => {});
            }
        } catch (err) {
            console.error("Lỗi xóa tin nhắn:", err);
        }
    };

    // Xóa toàn bộ đoạn chat
    const handleClearConversation = async () => {
        if (!activeTarget || !currentWorkspace?.id) return;
        setIsClearingChat(true);

        try {
            if (activeTarget.type === "channel") {
                const channelId = activeTarget.data.id;
                await apiClient.delete(`/chat/channels/${channelId}/messages`);
                if (
                    hubConnectionRef.current?.state ===
                    signalR.HubConnectionState.Connected
                ) {
                    await hubConnectionRef.current
                        .invoke("NotifyChatCleared", channelId, null, null)
                        .catch(() => {});
                }
            } else {
                const targetUserId = getMemberUserId(activeTarget.data);
                await apiClient.delete(
                    `/chat/workspaces/${currentWorkspace.id}/dm/${targetUserId}/messages`,
                );
                if (
                    hubConnectionRef.current?.state ===
                    signalR.HubConnectionState.Connected
                ) {
                    await hubConnectionRef.current
                        .invoke(
                            "NotifyChatCleared",
                            null,
                            String(currentUserId),
                            String(targetUserId),
                        )
                        .catch(() => {});
                }
            }
            setMessages([]);
            setShowClearChatModal(false);
        } catch (err) {
            console.error("Lỗi xóa đoạn chat:", err);
        } finally {
            setIsClearingChat(false);
        }
    };

    // 6. Tạo Channel
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
        const mId = getMemberUserId(m);
        const mEmail = (m.email || m.user?.email || "").toLowerCase();
        return (
            mId !== String(currentUserId || "") &&
            (!currentUserEmail || mEmail !== currentUserEmail.toLowerCase())
        );
    });

    const defaultCallRoomId = activeTarget
        ? activeTarget.type === "channel"
            ? `channel_${activeTarget.data.id}`
            : `dm_${[String(currentUserId), getMemberUserId(activeTarget.data)]
                  .sort()
                  .join("_")}`
        : null;

    const handleStartCall = (withVideo) => {
        if (!defaultCallRoomId || !activeTarget || !currentWorkspace?.id)
            return;
        setCallWithVideo(withVideo);
        setActiveCallRoomId(defaultCallRoomId);
        setInCall(true);

        const channelId =
            activeTarget.type === "channel" ? activeTarget.data.id : null;
        const channelName =
            activeTarget.type === "channel" ? activeTarget.data.name : null;
        const recipientId =
            activeTarget.type === "dm"
                ? getMemberUserId(activeTarget.data)
                : null;
        const allMemberIds = members
            .map((m) => getMemberUserId(m))
            .filter(Boolean);

        hubConnectionRef.current
            ?.invoke("NotifyCall", {
                roomId: defaultCallRoomId,
                workspaceId: String(currentWorkspace.id),
                callerId: String(currentUserId),
                callerName:
                    authUser?.fullName ||
                    authUser?.name ||
                    currentUserName ||
                    "Member",
                channelId,
                channelName,
                recipientId,
                videoEnabled: withVideo,
                memberIds: allMemberIds,
            })
            .catch((err) => console.error("NotifyCall error:", err));
    };

    const handleDeclineIncomingCall = () => {
        if (!incomingCall) return;
        hubConnectionRef.current
            ?.invoke("DeclineCall", incomingCall.roomId)
            .catch(() => {});
        setIncomingCall(null);
    };

    const handleAcceptIncomingCall = () => {
        if (!incomingCall) return;

        if (incomingCall.channelId) {
            const targetChan = channels.find(
                (c) => c.id === incomingCall.channelId,
            );
            if (targetChan) {
                setActiveTarget({ type: "channel", data: targetChan });
            }
        } else if (incomingCall.callerId) {
            const callerMember = otherMembers.find(
                (m) => getMemberUserId(m) === String(incomingCall.callerId),
            );
            if (callerMember) {
                setActiveTarget({ type: "dm", data: callerMember });
            }
        }

        setCallWithVideo(incomingCall.videoEnabled ?? true);
        setActiveCallRoomId(incomingCall.roomId);
        setInCall(true);
        setIncomingCall(null);
    };

    const incomingCallerMember = incomingCall
        ? members.find(
              (m) => getMemberUserId(m) === String(incomingCall.callerId),
          )
        : null;
    const incomingCallerAvatar = resolveUserAvatar(incomingCallerMember);
    const totalMediaCount = sharedImages.length + sharedFiles.length;

    const activeTargetTitle = activeTarget
        ? activeTarget.type === "channel"
            ? `#${activeTarget.data.name}`
            : activeTarget.data.fullName ||
              activeTarget.data.name ||
              activeTarget.data.user?.fullName ||
              "User"
        : "";

    return (
        <div className="relative flex h-[calc(100vh-80px)] overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Banner Thông báo cuộc gọi đến */}
            {incomingCall && !inCall && (
                <div className="fixed right-6 bottom-6 z-50 flex items-center gap-4 rounded-3xl border border-brand/50 bg-[#14171f] p-4 text-white shadow-2xl">
                    {incomingCallerAvatar ? (
                        <img
                            src={incomingCallerAvatar}
                            alt={incomingCall.callerName || "Caller"}
                            className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                        />
                    ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-base font-bold text-slate-900">
                            {incomingCall.callerName?.charAt(0).toUpperCase() ||
                                "U"}
                        </div>
                    )}
                    <div className="pr-2">
                        <p className="text-sm font-bold text-white">
                            {incomingCall.callerName}
                        </p>
                        <p className="text-xs text-slate-300">
                            {incomingCall.channelName
                                ? `Started a call in #${incomingCall.channelName}`
                                : incomingCall.videoEnabled
                                  ? "Incoming video call..."
                                  : "Incoming voice call..."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDeclineIncomingCall}
                            className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
                        >
                            Decline
                        </button>
                        <button
                            type="button"
                            onClick={handleAcceptIncomingCall}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-400"
                        >
                            Join
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar Trái */}
            <div className="flex w-64 shrink-0 flex-col border-r border-hairline bg-canvas/50 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex h-16 items-center justify-between border-b border-hairline px-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white dark:bg-brand dark:text-slate-900">
                            {currentWorkspace?.name?.charAt(0).toUpperCase() ||
                                "W"}
                        </div>
                        <span className="font-display truncate text-sm font-bold text-ink dark:text-white">
                            {currentWorkspace?.name || "Workspace"}
                        </span>
                    </div>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto p-3">
                    {/* Channels */}
                    <div>
                        <div className="mb-2 flex items-center justify-between px-2 text-[11px] font-bold tracking-wider text-muted uppercase">
                            <span>Channels</span>
                            <button
                                type="button"
                                onClick={() => setShowNewChannelModal(true)}
                                className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-white hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <Ic n="plus" size={14} />
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
                                        onClick={() => {
                                            setInCall(false);
                                            setActiveCallRoomId(null);
                                            setActiveTarget({
                                                type: "channel",
                                                data: ch,
                                            });
                                        }}
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
                        <div className="mb-2 px-2 text-[11px] font-bold tracking-wider text-muted uppercase">
                            Direct Messages
                        </div>
                        <div className="space-y-0.5">
                            {otherMembers.length === 0 ? (
                                <div className="px-3 py-2 text-xs text-muted">
                                    No other members.
                                </div>
                            ) : (
                                otherMembers.map((u) => {
                                    const uId = getMemberUserId(u);
                                    const uName =
                                        u.fullName ||
                                        u.name ||
                                        u.user?.fullName ||
                                        u.email ||
                                        "Member";
                                    const uAvatar = resolveUserAvatar(u);
                                    const isSelected =
                                        activeTarget?.type === "dm" &&
                                        getMemberUserId(activeTarget.data) ===
                                            uId;

                                    return (
                                        <button
                                            key={uId}
                                            type="button"
                                            onClick={() => {
                                                setInCall(false);
                                                setActiveCallRoomId(null);
                                                setActiveTarget({
                                                    type: "dm",
                                                    data: u,
                                                });
                                            }}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                                                isSelected
                                                    ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white"
                                                    : "text-muted hover:bg-white/60 hover:text-ink dark:hover:bg-slate-800/50 dark:hover:text-white"
                                            }`}
                                        >
                                            {uAvatar ? (
                                                <img
                                                    src={uAvatar}
                                                    alt={uName}
                                                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 text-[10px] font-bold text-brand">
                                                    {uName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            )}
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
            <div className="flex min-w-0 flex-1 flex-col">
                {activeTarget ? (
                    <>
                        {/* Header + Voice / Video Call + Menu "..." */}
                        <div className="flex h-16 items-center justify-between border-b border-hairline px-6 dark:border-slate-800">
                            <div className="min-w-0">
                                <h3 className="font-display truncate text-base font-bold text-ink dark:text-white">
                                    {activeTargetTitle}
                                </h3>
                                <p className="max-w-md truncate text-xs text-muted">
                                    {activeTarget.type === "channel"
                                        ? activeTarget.data.topic ||
                                          "Channel discussion"
                                        : "Direct Message"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {!inCall && (
                                    <>
                                        <button
                                            type="button"
                                            disabled={!signalRConnected}
                                            onClick={() =>
                                                handleStartCall(false)
                                            }
                                            className="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-canvas px-3.5 text-xs font-bold text-ink transition hover:border-brand hover:bg-brand-soft/40 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                            title="Voice Call"
                                        >
                                            <Ic n="phone" size={16} />
                                            <span className="hidden sm:inline">
                                                Voice
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={!signalRConnected}
                                            onClick={() =>
                                                handleStartCall(true)
                                            }
                                            className="flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-xs font-bold text-slate-900 shadow-xs transition hover:bg-amber-400 disabled:opacity-40"
                                            title="Video Call"
                                        >
                                            <svg
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.9"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="h-4 w-4"
                                            >
                                                <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                                <rect
                                                    x="2"
                                                    y="6"
                                                    width="14"
                                                    height="12"
                                                    rx="2"
                                                />
                                            </svg>
                                            <span className="hidden sm:inline">
                                                Video Call
                                            </span>
                                        </button>
                                    </>
                                )}

                                {/* Nút "..." gộp Ảnh/File đã gửi và Xóa đoạn chat */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowHeaderMenu((prev) => !prev)
                                        }
                                        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                                            showHeaderMenu || showMediaDrawer
                                                ? "border-brand bg-brand/15 text-ink dark:text-white"
                                                : "border-hairline bg-canvas text-muted hover:border-brand hover:text-ink dark:border-slate-700 dark:bg-slate-800 dark:hover:text-white"
                                        }`}
                                        title="Tùy chọn đoạn chat"
                                    >
                                        <Ic n="dots" size={18} />
                                        {totalMediaCount > 0 && (
                                            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-brand ring-2 ring-white dark:ring-slate-900" />
                                        )}
                                    </button>

                                    {showHeaderMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-20"
                                                onClick={() =>
                                                    setShowHeaderMenu(false)
                                                }
                                            />
                                            <div className="absolute top-11 right-0 z-30 w-56 overflow-hidden rounded-2xl border border-hairline bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowHeaderMenu(
                                                            false,
                                                        );
                                                        setShowMediaDrawer(
                                                            (prev) => !prev,
                                                        );
                                                    }}
                                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-ink transition hover:bg-canvas dark:text-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <span className="flex items-center gap-2.5">
                                                        <Ic
                                                            n="image"
                                                            size={16}
                                                            className="text-muted"
                                                        />
                                                        Ảnh & File đã gửi
                                                    </span>
                                                    {totalMediaCount > 0 && (
                                                        <span className="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                                                            {totalMediaCount}
                                                        </span>
                                                    )}
                                                </button>

                                                <div className="my-1 h-px bg-hairline dark:bg-slate-700" />

                                                <button
                                                    type="button"
                                                    disabled={
                                                        messages.length === 0
                                                    }
                                                    onClick={() => {
                                                        setShowHeaderMenu(
                                                            false,
                                                        );
                                                        setShowClearChatModal(
                                                            true,
                                                        );
                                                    }}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-500/10"
                                                >
                                                    <Ic n="trash" size={16} />
                                                    Xóa đoạn chat
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Phòng gọi Mic & Cam */}
                        {inCall && activeCallRoomId && (
                            <CallRoom
                                roomId={activeCallRoomId}
                                roomTitle={activeTargetTitle}
                                initialVideo={callWithVideo}
                                hubConnection={hubConnectionRef.current}
                                currentUser={{
                                    id: currentUserId,
                                    name:
                                        authUser?.fullName ||
                                        authUser?.name ||
                                        currentUserName ||
                                        "User",
                                    avatarUrl: currentUserAvatar,
                                }}
                                onClose={() => {
                                    setInCall(false);
                                    setActiveCallRoomId(null);
                                }}
                            />
                        )}

                        {/* Vùng Nội Dung: Feed Tin Nhắn + Drawer Ảnh/File */}
                        <div className="flex min-h-0 flex-1 overflow-hidden">
                            {/* Feed Tin Nhắn */}
                            <div className="flex-1 space-y-4 overflow-y-auto p-6">
                                {messages.length === 0 && (
                                    <div className="flex h-full flex-col items-center justify-center text-center text-muted">
                                        <p className="text-sm font-medium">
                                            Chưa có tin nhắn nào
                                        </p>
                                        <p className="mt-1 text-xs">
                                            Hãy gửi lời chào hoặc đính kèm file
                                            để bắt đầu cuộc trò chuyện.
                                        </p>
                                    </div>
                                )}

                                {messages.map((msg) => {
                                    const isMe =
                                        String(msg.senderId) ===
                                        String(currentUserId);
                                    const senderMember = members.find(
                                        (m) =>
                                            getMemberUserId(m) ===
                                            String(msg.senderId || ""),
                                    );
                                    const senderAvatar = isMe
                                        ? currentUserAvatar
                                        : resolveUserAvatar(msg) ||
                                          resolveUserAvatar(senderMember);
                                    const senderDisplayName = isMe
                                        ? "You"
                                        : msg.senderName ||
                                          senderMember?.fullName ||
                                          senderMember?.name ||
                                          senderMember?.user?.fullName ||
                                          "Member";

                                    const displayTime =
                                        msg.time ||
                                        (msg.createdAt
                                            ? new Date(
                                                  msg.createdAt,
                                              ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "");

                                    // Thẻ Lịch sử cuộc gọi / Cuộc gọi nhỡ
                                    if (msg.text?.startsWith("[[CALL_LOG]]")) {
                                        const [status, videoFlag, duration] =
                                            msg.text
                                                .replace("[[CALL_LOG]]", "")
                                                .split("|");
                                        const isVideoCall =
                                            videoFlag === "true";
                                        const isMissed = status === "missed";

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`group flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                                            >
                                                {senderAvatar ? (
                                                    <img
                                                        src={senderAvatar}
                                                        alt={senderDisplayName}
                                                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
                                                        {senderDisplayName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                )}

                                                <div
                                                    className={`flex flex-col ${
                                                        isMe
                                                            ? "items-end"
                                                            : "items-start"
                                                    }`}
                                                >
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <span className="text-xs font-bold text-ink dark:text-white">
                                                            {senderDisplayName}
                                                        </span>
                                                        <span className="text-[10px] text-muted">
                                                            {displayTime}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isMe && (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDeleteMessage(
                                                                        msg.id,
                                                                    )
                                                                }
                                                                className="rounded-lg p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                                                title="Xóa mục này"
                                                            >
                                                                <Ic
                                                                    n="trash"
                                                                    size={14}
                                                                />
                                                            </button>
                                                        )}

                                                        <div className="flex items-center gap-3.5 rounded-2xl border border-hairline bg-canvas/80 px-4 py-3 shadow-2xs dark:border-slate-800 dark:bg-slate-800/80">
                                                            <span
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                                    isMissed
                                                                        ? "bg-red-500/15 text-red-500"
                                                                        : "bg-emerald-500/15 text-emerald-500"
                                                                }`}
                                                            >
                                                                {isVideoCall ? (
                                                                    <svg
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        className="h-5 w-5"
                                                                    >
                                                                        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                                                                        <rect
                                                                            x="2"
                                                                            y="6"
                                                                            width="14"
                                                                            height="12"
                                                                            rx="2"
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <Ic
                                                                        n="phone"
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                )}
                                                            </span>

                                                            <div>
                                                                <p
                                                                    className={`text-xs font-bold ${
                                                                        isMissed
                                                                            ? "text-red-500"
                                                                            : "text-ink dark:text-white"
                                                                    }`}
                                                                >
                                                                    {isMissed
                                                                        ? isVideoCall
                                                                            ? "Missed video call"
                                                                            : "Missed voice call"
                                                                        : isVideoCall
                                                                          ? "Video call"
                                                                          : "Voice call"}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] font-medium text-muted">
                                                                    {isMissed
                                                                        ? `No answer · ${displayTime}`
                                                                        : `Duration ${duration} · ${displayTime}`}
                                                                </p>
                                                            </div>

                                                            {!inCall && (
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        !signalRConnected
                                                                    }
                                                                    onClick={() =>
                                                                        handleStartCall(
                                                                            isVideoCall,
                                                                        )
                                                                    }
                                                                    className="ml-2 rounded-xl bg-white px-3 py-1.5 text-[11px] font-bold text-ink shadow-2xs transition hover:bg-brand hover:text-slate-900 disabled:opacity-40 dark:bg-slate-700 dark:text-white"
                                                                >
                                                                    Call again
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isImage = isImageAttachment(
                                        msg.attachment,
                                    );

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`group flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                                        >
                                            {senderAvatar ? (
                                                <img
                                                    src={senderAvatar}
                                                    alt={senderDisplayName}
                                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-white">
                                                    {senderDisplayName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            )}

                                            <div
                                                className={`flex max-w-[70%] flex-col ${
                                                    isMe
                                                        ? "items-end"
                                                        : "items-start"
                                                }`}
                                            >
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="text-xs font-bold text-ink dark:text-white">
                                                        {senderDisplayName}
                                                    </span>
                                                    <span className="text-[10px] text-muted">
                                                        {displayTime}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`flex items-center gap-2 ${isMe ? "flex-row" : "flex-row-reverse"}`}
                                                >
                                                    {isMe && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDeleteMessage(
                                                                    msg.id,
                                                                )
                                                            }
                                                            className="rounded-lg p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                                                            title="Xóa tin nhắn"
                                                        >
                                                            <Ic
                                                                n="trash"
                                                                size={14}
                                                            />
                                                        </button>
                                                    )}

                                                    <div
                                                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                                    >
                                                        {msg.attachment && (
                                                            <div className="mb-1.5">
                                                                {isImage ? (
                                                                    <img
                                                                        src={
                                                                            msg
                                                                                .attachment
                                                                                .url
                                                                        }
                                                                        alt={
                                                                            msg
                                                                                .attachment
                                                                                .name
                                                                        }
                                                                        onClick={() =>
                                                                            setPreviewImage(
                                                                                {
                                                                                    url: msg
                                                                                        .attachment
                                                                                        .url,
                                                                                    name: msg
                                                                                        .attachment
                                                                                        .name,
                                                                                },
                                                                            )
                                                                        }
                                                                        className="max-h-60 max-w-xs cursor-zoom-in rounded-2xl border border-hairline object-cover shadow-sm transition hover:opacity-95 dark:border-slate-700"
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        href={
                                                                            msg
                                                                                .attachment
                                                                                .url
                                                                        }
                                                                        download={
                                                                            msg
                                                                                .attachment
                                                                                .name
                                                                        }
                                                                        className="flex items-center gap-3 rounded-2xl border border-hairline bg-canvas p-3 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                                                    >
                                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand">
                                                                            <Ic
                                                                                n="file"
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        </div>
                                                                        <div className="max-w-45 truncate text-left">
                                                                            <div className="truncate text-xs font-bold text-ink dark:text-white">
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

                                                        {msg.text && (
                                                            <div
                                                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                                                    isMe
                                                                        ? "rounded-tr-xs bg-brand font-medium text-slate-900"
                                                                        : "rounded-tl-xs bg-canvas text-ink dark:bg-slate-800 dark:text-slate-100"
                                                                }`}
                                                            >
                                                                {msg.text}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Drawer Bên Phải: Xem Ảnh & File đã gửi */}
                            {showMediaDrawer && (
                                <div className="flex w-80 shrink-0 flex-col border-l border-hairline bg-canvas/40 dark:border-slate-800 dark:bg-slate-900/80">
                                    <div className="flex items-center justify-between border-b border-hairline px-4 py-3 dark:border-slate-800">
                                        <span className="text-xs font-bold tracking-wider text-ink uppercase dark:text-white">
                                            Kho lưu trữ chat
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowMediaDrawer(false)
                                            }
                                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-white hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                                        >
                                            <Ic n="close" size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1 border-b border-hairline p-2 dark:border-slate-800">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setMediaTab("images")
                                            }
                                            className={`rounded-xl py-1.5 text-xs font-bold transition ${
                                                mediaTab === "images"
                                                    ? "bg-white text-ink shadow-2xs dark:bg-slate-800 dark:text-white"
                                                    : "text-muted hover:text-ink dark:hover:text-white"
                                            }`}
                                        >
                                            Ảnh ({sharedImages.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMediaTab("files")}
                                            className={`rounded-xl py-1.5 text-xs font-bold transition ${
                                                mediaTab === "files"
                                                    ? "bg-white text-ink shadow-2xs dark:bg-slate-800 dark:text-white"
                                                    : "text-muted hover:text-ink dark:hover:text-white"
                                            }`}
                                        >
                                            File ({sharedFiles.length})
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3">
                                        {mediaTab === "images" ? (
                                            sharedImages.length === 0 ? (
                                                <div className="py-10 text-center text-xs text-muted">
                                                    Chưa có ảnh nào được gửi.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2">
                                                    {sharedImages.map((img) => (
                                                        <button
                                                            key={img.id}
                                                            type="button"
                                                            onClick={() =>
                                                                setPreviewImage(
                                                                    {
                                                                        url: img.url,
                                                                        name: img.name,
                                                                    },
                                                                )
                                                            }
                                                            className="group relative aspect-square overflow-hidden rounded-xl border border-hairline bg-white dark:border-slate-700"
                                                        >
                                                            <img
                                                                src={img.url}
                                                                alt={img.name}
                                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )
                                        ) : sharedFiles.length === 0 ? (
                                            <div className="py-10 text-center text-xs text-muted">
                                                Chưa có file nào được gửi.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {sharedFiles.map((file) => (
                                                    <a
                                                        key={file.id}
                                                        href={file.url}
                                                        download={file.name}
                                                        className="flex items-center gap-3 rounded-xl border border-hairline bg-white p-2.5 transition hover:border-brand dark:border-slate-800 dark:bg-slate-800/80"
                                                    >
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
                                                            <Ic
                                                                n="file"
                                                                size={16}
                                                            />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-bold text-ink dark:text-white">
                                                                {file.name}
                                                            </p>
                                                            <p className="text-[10px] text-muted">
                                                                {file.size} ·{" "}
                                                                {
                                                                    file.senderName
                                                                }
                                                            </p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Khung nhập tin nhắn + Preview File + Bảng chọn Emoji */}
                        <form
                            onSubmit={handleSendMessage}
                            className="relative border-t border-hairline p-4 dark:border-slate-800"
                        >
                            {showEmojiPicker && (
                                <div
                                    ref={emojiPickerRef}
                                    className="absolute bottom-20 left-4 z-30 w-72 rounded-2xl border border-hairline bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                                        {EMOJI_GROUPS.map((group) => (
                                            <div key={group.label}>
                                                <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted uppercase">
                                                    {group.label}
                                                </p>
                                                <div className="grid grid-cols-8 gap-1">
                                                    {group.emojis.map(
                                                        (emoji) => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() =>
                                                                    handleInsertEmoji(
                                                                        emoji,
                                                                    )
                                                                }
                                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-base transition hover:bg-canvas dark:hover:bg-slate-700"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedAttachment && (
                                <div className="mb-2 flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-amber-50 p-2.5 dark:border-slate-700 dark:bg-slate-800">
                                    {selectedAttachment.isImage ? (
                                        <img
                                            src={selectedAttachment.url}
                                            alt="Preview"
                                            className="h-10 w-10 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-slate-900">
                                            <Ic n="file" size={18} />
                                        </div>
                                    )}
                                    <div className="flex-1 truncate">
                                        <div className="truncate text-xs font-bold text-ink dark:text-white">
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
                                        className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-white"
                                    >
                                        <Ic n="close" size={13} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-1.5 rounded-2xl border border-hairline bg-canvas/30 p-2 focus-within:border-brand dark:border-slate-800 dark:bg-slate-800/40">
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
                                    title="Đính kèm ảnh hoặc file"
                                >
                                    <Ic n="clip" size={16} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowEmojiPicker((prev) => !prev)
                                    }
                                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                                        showEmojiPicker
                                            ? "bg-brand/20 text-ink dark:text-white"
                                            : "text-muted hover:bg-white hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
                                    }`}
                                    title="Chèn biểu tượng cảm xúc"
                                >
                                    <Ic n="smile" size={16} />
                                </button>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputText}
                                    onChange={(e) =>
                                        setInputText(e.target.value)
                                    }
                                    placeholder={`Message ${activeTargetTitle}...`}
                                    className="flex-1 bg-transparent px-2 text-sm text-ink outline-none placeholder:text-muted dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={
                                        !inputText.trim() && !selectedAttachment
                                    }
                                    className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-400 disabled:opacity-40"
                                >
                                    <span>Send</span>
                                    <Ic n="send" size={14} />
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

            {/* Modal xác nhận Xóa toàn bộ đoạn chat */}
            {showClearChatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="text-base font-bold text-ink dark:text-white">
                            Xóa toàn bộ đoạn chat?
                        </h3>
                        <p className="mt-2 text-xs leading-relaxed text-muted">
                            Tất cả tin nhắn, hình ảnh và file trong cuộc trò
                            chuyện này sẽ bị xóa vĩnh viễn và không thể khôi
                            phục.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                disabled={isClearingChat}
                                onClick={() => setShowClearChatModal(false)}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-muted hover:text-ink dark:hover:text-white"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={isClearingChat}
                                onClick={handleClearConversation}
                                className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
                            >
                                {isClearingChat ? "Đang xóa..." : "Xóa tất cả"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal phóng to Ảnh */}
            {previewImage && (
                <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-xs"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="relative flex max-h-[90vh] max-w-4xl flex-col items-center"
                    >
                        <img
                            src={previewImage.url}
                            alt={previewImage.name}
                            className="max-h-[80vh] rounded-2xl object-contain shadow-2xl"
                        />
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-xs font-medium text-white/80">
                                {previewImage.name}
                            </span>
                            <a
                                href={previewImage.url}
                                download={previewImage.name}
                                className="rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-slate-900 hover:bg-amber-400"
                            >
                                Tải ảnh xuống
                            </a>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="rounded-xl bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal tạo Channel mới */}
            {showNewChannelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h3 className="mb-4 text-lg font-bold text-ink dark:text-white">
                            Create a Channel
                        </h3>
                        <form
                            onSubmit={handleCreateChannel}
                            className="space-y-4"
                        >
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted">
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
                                    className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted">
                                    Topic / Description
                                </label>
                                <input
                                    type="text"
                                    placeholder="What is this channel about?"
                                    value={newChannelTopic}
                                    onChange={(e) =>
                                        setNewChannelTopic(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-hairline bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
