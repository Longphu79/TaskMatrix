import { useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ],
};

function MicIcon({ className = "h-4 w-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    );
}

function MicOffIcon({ className = "h-4 w-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <line x1="2" y1="2" x2="22" y2="22" />
            <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
            <path d="M5 10v2a7 7 0 0 0 12 5" />
            <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
            <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
    );
}

function VideoIcon({ className = "h-4 w-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
            <rect x="2" y="6" width="14" height="12" rx="2" />
        </svg>
    );
}

function VideoOffIcon({ className = "h-4 w-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196" />
            <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    );
}

function PhoneOffIcon({ className = "h-4 w-4" }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
            <line x1="22" y1="2" x2="22" y2="22" />
        </svg>
    );
}

function RemoteVideoTile({ peer }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && peer.stream) {
            videoRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-800">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`h-full w-full object-cover ${!peer.videoEnabled ? "hidden" : ""}`}
            />
            {!peer.videoEnabled &&
                (peer.avatarUrl ? (
                    <img
                        src={peer.avatarUrl}
                        alt={peer.userName || "Member"}
                        className="h-16 w-16 rounded-full border-2 border-brand object-cover shadow-md"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-slate-900">
                        {peer.userName?.charAt(0).toUpperCase() || "U"}
                    </div>
                ))}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-xl bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
                <span>{peer.userName || "Member"}</span>
                {!peer.micEnabled && (
                    <MicOffIcon className="h-3.5 w-3.5 text-red-400" />
                )}
            </div>
        </div>
    );
}

export default function CallRoom({
    hubConnection,
    roomId,
    roomTitle,
    currentUser,
    initialVideo = true,
    onClose,
}) {
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(initialVideo);
    const [peers, setPeers] = useState([]);
    const [callError, setCallError] = useState("");
    const [elapsedSec, setElapsedSec] = useState(0);

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcsRef = useRef({});
    const camOnRef = useRef(initialVideo);
    const hasJoinedHubRef = useRef(false);
    camOnRef.current = camOn;

    // Đếm thời gian gọi khi có người tham gia
    useEffect(() => {
        if (peers.length === 0) return;
        const timer = setInterval(() => {
            setElapsedSec((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [peers.length]);

    const formatTimer = (sec) => {
        const mins = String(Math.floor(sec / 60)).padStart(2, "0");
        const secs = String(sec % 60).padStart(2, "0");
        return `${mins}:${secs}`;
    };

    useEffect(() => {
        if (!hubConnection) return;
        let isMounted = true;
        hasJoinedHubRef.current = false;

        const createPeerConnection = (
            targetConnectionId,
            targetUserName,
            videoEnabled = true,
        ) => {
            if (pcsRef.current[targetConnectionId]) {
                return pcsRef.current[targetConnectionId];
            }

            const pc = new RTCPeerConnection(ICE_SERVERS);
            pcsRef.current[targetConnectionId] = pc;

            const tracks = localStreamRef.current?.getTracks() || [];
            if (tracks.length > 0) {
                tracks.forEach((track) =>
                    pc.addTrack(track, localStreamRef.current),
                );
            } else {
                pc.addTransceiver("audio", { direction: "recvonly" });
                pc.addTransceiver("video", { direction: "recvonly" });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    hubConnection
                        .invoke("SendCallSignal", targetConnectionId, {
                            type: "candidate",
                            candidate: event.candidate,
                        })
                        .catch(() => {});
                }
            };

            pc.ontrack = (event) => {
                const [remoteStream] = event.streams;
                if (!isMounted) return;
                setPeers((prev) => {
                    const exists = prev.some(
                        (p) => p.connectionId === targetConnectionId,
                    );
                    if (exists) {
                        return prev.map((p) =>
                            p.connectionId === targetConnectionId
                                ? { ...p, stream: remoteStream }
                                : p,
                        );
                    }
                    return [
                        ...prev,
                        {
                            connectionId: targetConnectionId,
                            userName: targetUserName,
                            stream: remoteStream,
                            micEnabled: true,
                            videoEnabled,
                        },
                    ];
                });
            };

            return pc;
        };

        const handleUserJoined = async ({
            connectionId,
            userName,
            videoEnabled,
            avatarUrl,
        }) => {
            setPeers((prev) => [
                ...prev.filter((p) => p.connectionId !== connectionId),
                {
                    connectionId,
                    userName,
                    avatarUrl: avatarUrl || null,
                    stream: null,
                    micEnabled: true,
                    videoEnabled,
                },
            ]);

            const pc = createPeerConnection(
                connectionId,
                userName,
                videoEnabled,
            );
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await hubConnection.invoke("SendCallSignal", connectionId, {
                type: "offer",
                sdp: offer,
                senderName: currentUser.name,
                senderAvatar: currentUser.avatarUrl || null,
                videoEnabled: camOnRef.current,
            });
        };

        const handleReceiveSignal = async ({
            senderConnectionId,
            signalData,
        }) => {
            if (signalData.type === "offer") {
                setPeers((prev) => {
                    if (prev.some((p) => p.connectionId === senderConnectionId))
                        return prev;
                    return [
                        ...prev,
                        {
                            connectionId: senderConnectionId,
                            userName: signalData.senderName || "Member",
                            avatarUrl: signalData.senderAvatar || null,
                            stream: null,
                            micEnabled: true,
                            videoEnabled: signalData.videoEnabled ?? true,
                        },
                    ];
                });

                const pc = createPeerConnection(
                    senderConnectionId,
                    signalData.senderName,
                    signalData.videoEnabled,
                );
                await pc.setRemoteDescription(
                    new RTCSessionDescription(signalData.sdp),
                );
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);

                await hubConnection.invoke(
                    "SendCallSignal",
                    senderConnectionId,
                    {
                        type: "answer",
                        sdp: answer,
                    },
                );
            } else if (signalData.type === "answer") {
                const pc = pcsRef.current[senderConnectionId];
                if (pc) {
                    await pc.setRemoteDescription(
                        new RTCSessionDescription(signalData.sdp),
                    );
                }
            } else if (signalData.type === "candidate") {
                const pc = pcsRef.current[senderConnectionId];
                if (pc && signalData.candidate) {
                    await pc
                        .addIceCandidate(
                            new RTCIceCandidate(signalData.candidate),
                        )
                        .catch(() => {});
                }
            }
        };

        const handleMediaToggled = ({
            connectionId,
            micEnabled,
            videoEnabled,
        }) => {
            setPeers((prev) =>
                prev.map((p) =>
                    p.connectionId === connectionId
                        ? { ...p, micEnabled, videoEnabled }
                        : p,
                ),
            );
        };

        const handleUserLeft = (connectionId) => {
            if (pcsRef.current[connectionId]) {
                pcsRef.current[connectionId].close();
                delete pcsRef.current[connectionId];
            }
            setPeers((prev) =>
                prev.filter((p) => p.connectionId !== connectionId),
            );
        };

        hubConnection.on("UserJoinedCall", handleUserJoined);
        hubConnection.on("ReceiveCallSignal", handleReceiveSignal);
        hubConnection.on("PeerMediaToggled", handleMediaToggled);
        hubConnection.on("UserLeftCall", handleUserLeft);

        const initCall = async () => {
            let stream = null;
            let actualCamOn = initialVideo;
            let actualMicOn = true;

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: false,
                    },
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        frameRate: { max: 24 },
                    },
                });
                stream.getVideoTracks().forEach((track) => {
                    track.enabled = initialVideo;
                });
            } catch {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false,
                    });
                    actualCamOn = false;
                } catch {
                    stream = new MediaStream();
                    actualCamOn = false;
                    actualMicOn = false;
                }
            }

            if (!isMounted) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }

            setCamOn(actualCamOn);
            setMicOn(actualMicOn);
            localStreamRef.current = stream;

            if (localVideoRef.current && stream.getVideoTracks().length > 0) {
                localVideoRef.current.srcObject = stream;
            }

            try {
                await hubConnection.invoke(
                    "JoinCall",
                    roomId,
                    String(currentUser.id),
                    currentUser.name,
                    actualCamOn,
                    currentUser.avatarUrl || null,
                );
                if (isMounted) {
                    hasJoinedHubRef.current = true;
                } else {
                    hubConnection.invoke("LeaveCall", roomId).catch(() => {});
                }
            } catch (hubErr) {
                console.error("SignalR JoinCall error:", hubErr);
                if (isMounted) {
                    setCallError("Chưa kết nối được phòng gọi trên server.");
                }
            }
        };

        initCall();

        return () => {
            isMounted = false;
            hubConnection.off("UserJoinedCall", handleUserJoined);
            hubConnection.off("ReceiveCallSignal", handleReceiveSignal);
            hubConnection.off("PeerMediaToggled", handleMediaToggled);
            hubConnection.off("UserLeftCall", handleUserLeft);

            if (hasJoinedHubRef.current) {
                hasJoinedHubRef.current = false;
                hubConnection.invoke("LeaveCall", roomId).catch(() => {});
            }

            Object.values(pcsRef.current).forEach((pc) => pc.close());
            pcsRef.current = {};

            localStreamRef.current
                ?.getTracks()
                .forEach((track) => track.stop());
        };
    }, [hubConnection, roomId]);

    const toggleMic = () => {
        const audioTracks = localStreamRef.current?.getAudioTracks() || [];
        if (audioTracks.length === 0) return;
        const nextMic = !micOn;
        audioTracks.forEach((t) => (t.enabled = nextMic));
        setMicOn(nextMic);
        hubConnection
            ?.invoke("ToggleCallMedia", roomId, nextMic, camOn)
            .catch(() => {});
    };

    const toggleCam = () => {
        const videoTracks = localStreamRef.current?.getVideoTracks() || [];
        if (videoTracks.length === 0) return;
        const nextCam = !camOn;
        videoTracks.forEach((t) => (t.enabled = nextCam));
        setCamOn(nextCam);
        hubConnection
            ?.invoke("ToggleCallMedia", roomId, micOn, nextCam)
            .catch(() => {});
    };

    const handleLeaveClick = () => {
        if (hasJoinedHubRef.current) {
            hasJoinedHubRef.current = false;
            hubConnection?.invoke("LeaveCall", roomId).catch(() => {});
        }
        onClose();
    };

    return (
        <div className="border-b border-hairline bg-[#14171f] px-6 py-4 text-white dark:border-slate-800">
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-300">
                        Live Call · {roomTitle} ({peers.length + 1} in room)
                    </span>
                </div>
                <span className="rounded-lg bg-white/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-200">
                    {peers.length > 0 ? formatTimer(elapsedSec) : "Ringing..."}
                </span>
            </div>

            {callError ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/15 px-4 py-3 text-xs font-medium text-red-200">
                    {callError}
                </div>
            ) : (
                <div
                    className={`grid max-h-75 gap-3 overflow-y-auto ${
                        peers.length === 0
                            ? "mx-auto max-w-sm grid-cols-1"
                            : peers.length === 1
                              ? "grid-cols-2"
                              : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    }`}
                >
                    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl border-2 border-brand bg-slate-800">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`h-full w-full -scale-x-100 object-cover ${!camOn ? "hidden" : ""}`}
                        />
                        {!camOn &&
                            (currentUser.avatarUrl ? (
                                <img
                                    src={currentUser.avatarUrl}
                                    alt={currentUser.name || "You"}
                                    className="h-16 w-16 rounded-full border-2 border-brand object-cover shadow-md"
                                />
                            ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-slate-900">
                                    {currentUser.name
                                        ?.charAt(0)
                                        .toUpperCase() || "Y"}
                                </div>
                            ))}
                        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-xl bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
                            <span>You</span>
                            {!micOn && (
                                <MicOffIcon className="h-3.5 w-3.5 text-red-400" />
                            )}
                        </div>
                    </div>

                    {peers.map((peer) => (
                        <RemoteVideoTile key={peer.connectionId} peer={peer} />
                    ))}
                </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2.5">
                <button
                    type="button"
                    onClick={toggleMic}
                    className={`flex h-10 items-center gap-2 rounded-2xl px-4 text-xs font-bold transition ${
                        micOn
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "border border-red-500/40 bg-red-500/20 text-red-300"
                    }`}
                >
                    {micOn ? <MicIcon /> : <MicOffIcon />}
                    <span>{micOn ? "Mic On" : "Muted"}</span>
                </button>

                <button
                    type="button"
                    onClick={toggleCam}
                    className={`flex h-10 items-center gap-2 rounded-2xl px-4 text-xs font-bold transition ${
                        camOn
                            ? "bg-white/10 text-white hover:bg-white/15"
                            : "border border-red-500/40 bg-red-500/20 text-red-300"
                    }`}
                >
                    {camOn ? <VideoIcon /> : <VideoOffIcon />}
                    <span>{camOn ? "Cam On" : "Cam Off"}</span>
                </button>

                <button
                    type="button"
                    onClick={handleLeaveClick}
                    className="flex h-10 items-center gap-2 rounded-2xl bg-red-600 px-5 text-xs font-bold text-white transition hover:bg-red-500"
                >
                    <PhoneOffIcon />
                    <span>Leave Call</span>
                </button>
            </div>
        </div>
    );
}
