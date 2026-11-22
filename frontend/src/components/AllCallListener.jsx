import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";

export default function AllCallListener() {
    const [incomingCall, setIncomingCall] = useState(null);
    const [hubConn, setHubConn] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Nếu đang ở trang Chat thì nhường cho Chat.jsx xử lý
    const isOnChatPage = location.pathname.toLowerCase().includes("/chat");

    const getCurrentUserId = () => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return (
                payload[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
                ] ||
                payload.nameid ||
                payload.sub ||
                payload.id ||
                payload.userId
            );
        } catch {
            return null;
        }
    };

    // Phát tiếng chuông khi có cuộc gọi đến ở trang khác
    useEffect(() => {
        if (!incomingCall || isOnChatPage) return;

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
    }, [incomingCall, isOnChatPage]);

    useEffect(() => {
        const token =
            localStorage.getItem("token") || sessionStorage.getItem("token");
        const userId = getCurrentUserId();
        if (!token || !userId) return;

        let isCancelled = false;
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5260/hubs/chat", {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Warning)
            .build();

        connection.onreconnected(() => {
            if (!isCancelled) {
                connection
                    .invoke("RegisterUser", String(userId))
                    .catch(() => {});
            }
        });

        connection.on("IncomingCall", (callData) => {
            if (isCancelled) return;
            if (String(callData.callerId) === String(userId)) return;
            setIncomingCall(callData);
        });

        connection.on("CallCanceled", (roomId) => {
            if (!isCancelled) {
                setIncomingCall((prev) =>
                    prev?.roomId === roomId ? null : prev,
                );
            }
        });

        connection.on("CallEnded", (roomId) => {
            if (!isCancelled) {
                setIncomingCall((prev) =>
                    prev?.roomId === roomId ? null : prev,
                );
            }
        });

        const startPromise = connection
            .start()
            .then(() => {
                if (!isCancelled) {
                    return connection.invoke("RegisterUser", String(userId));
                }
            })
            .catch(() => {});

        setHubConn(connection);

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
    }, []);

    if (!incomingCall || isOnChatPage) return null;

    const handleDecline = () => {
        hubConn?.invoke("DeclineCall", incomingCall.roomId).catch(() => {});
        setIncomingCall(null);
    };

    const handleAccept = () => {
        const callToJoin = incomingCall;
        setIncomingCall(null);
        // Điều hướng đúng route của trang Team Chat (kiểm tra lại nếu route của bạn khác /chat)
        navigate("/chat", { state: { autoAcceptCall: callToJoin } });
    };

    return (
        <div className="fixed right-6 bottom-6 'z-[9999]' flex items-center gap-4 rounded-3xl border border-brand/50 bg-[#14171f] p-4 text-white shadow-2xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-base font-bold text-slate-900">
                {incomingCall.callerName?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="pr-2">
                <p className="text-sm font-bold text-white">
                    {incomingCall.callerName}
                </p>
                <p className="text-xs text-slate-300">
                    {incomingCall.channelName
                        ? `Calling in #${incomingCall.channelName}...`
                        : incomingCall.videoEnabled
                          ? "Incoming video call..."
                          : "Incoming voice call..."}
                </p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={handleDecline}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/20"
                >
                    Decline
                </button>
                <button
                    type="button"
                    onClick={handleAccept}
                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-400"
                >
                    Join
                </button>
            </div>
        </div>
    );
}
