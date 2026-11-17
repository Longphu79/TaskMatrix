import { useEffect, useRef, useState } from "react";
import { SparkleIcon } from "../../../components/icon";
import { useTasks } from "../../../context/TaskContext";
import { aiApi } from "../api/aiApi";

export default function AiAgentChat() {
    const { fetchTasks } = useTasks();

    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(true);

    // 🟢 State & Ref cho ảnh đính kèm
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [resetting, setResetting] = useState(false);

    const end = useRef(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            setFetchingHistory(true);
            const res = await aiApi.getHistory();
            if (Array.isArray(res) && res.length > 0) {
                const historyMsgs = res.map((msg, index) => ({
                    id: msg.id || index,
                    from: msg.role === "user" ? "user" : "ai",
                    text: msg.content,
                }));
                setMessages(historyMsgs);
            } else {
                setMessages([
                    {
                        id: 0,
                        from: "ai",
                        text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu hoặc gửi ảnh để tôi hỗ trợ nhé.",
                    },
                ]);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử chat:", error);
            setMessages([
                {
                    id: 0,
                    from: "ai",
                    text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu hoặc gửi ảnh để tôi hỗ trợ nhé.",
                },
            ]);
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleConfirmReset = async () => {
        setResetting(true);
        try {
            await aiApi.clearHistory();
            setMessages([
                {
                    id: 0,
                    from: "ai",
                    text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu hoặc gửi ảnh để tôi hỗ trợ nhé.",
                },
            ]);
            clearSelectedImage();
            setShowConfirmModal(false);
        } catch (error) {
            console.error("Lỗi khi xóa lịch sử:", error);
        } finally {
            setResetting(false);
        }
    };

    useEffect(() => {
        end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading]);

    // 🟢 Xử lý chọn ảnh từ thiết bị
    const handleImageSelect = (file) => {
        if (!file) return;
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            alert("Vui lòng chỉ chọn ảnh định dạng JPG, PNG hoặc WEBP.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Dung lượng ảnh tối đa là 5MB.");
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const clearSelectedImage = () => {
        setSelectedImage(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // 🟢 Hỗ trợ dán nhanh ảnh chụp màn hình (Ctrl + V)
    const handlePaste = (e) => {
        const imageItem = Array.from(e.clipboardData?.items || []).find(
            (item) => item.type.startsWith("image/"),
        );
        if (imageItem) {
            const file = imageItem.getAsFile();
            if (file) handleImageSelect(file);
        }
    };

    const send = async (text) => {
        const userText = text.trim();
        if ((!userText && !selectedImage) || loading) return;

        const imageToSend = selectedImage;
        const localPreviewForBubble = previewUrl;

        // Hiển thị ngay tin nhắn + ảnh lên khung chat
        setMessages((m) => [
            ...m,
            {
                id: crypto.randomUUID(),
                from: "user",
                text: userText,
                imageUrl: localPreviewForBubble,
            },
        ]);

        setDraft("");
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLoading(true);

        try {
            const res = await aiApi.parseAndCreate({
                prompt: userText,
                userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                image: imageToSend,
            });

            const isTaskAction = [
                "CREATE_TASK",
                "UPDATE_TASK",
                "ADD_SUBTASKS",
                "DELETE_TASK",
            ].includes(res.intent);

            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    from: "ai",
                    text: isTaskAction ? `✅ ${res.message}` : res.message,
                },
            ]);

            if (isTaskAction && fetchTasks) {
                await fetchTasks();
            }
        } catch (error) {
            const errorMsg =
                typeof error === "string"
                    ? error
                    : error?.response?.data || "Không thể xử lý yêu cầu này.";
            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    from: "ai",
                    text: `❌ ${errorMsg}\nVui lòng thử lại với câu lệnh hoặc hình ảnh rõ nét hơn.`,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative mx-5 mb-8 flex min-h-[520px] flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 lg:mx-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand">
                        <SparkleIcon />
                    </span>
                    <div>
                        <h2 className="font-display text-lg font-bold text-ink dark:text-white">
                            TaskMatrix AI Agent
                        </h2>
                        <p className="text-xs text-muted">
                            Tự động phân tích ngôn ngữ tự nhiên, hình ảnh & đặt
                            lịch vào hệ thống qua AI.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowConfirmModal(true)}
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-hairline px-3.5 py-2 text-xs font-semibold text-muted transition hover:bg-slate-100 hover:text-ink dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    ➕ Chat mới
                </button>
            </div>

            <div
                className="my-6 flex-1 space-y-3 overflow-y-auto"
                role="log"
                aria-live="polite"
                aria-label="AI conversation"
            >
                {fetchingHistory ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted">
                        <span>Đang tải cuộc trò chuyện...</span>
                    </div>
                ) : (
                    messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                                    m.from === "user"
                                        ? "bg-ink text-white dark:!bg-brand dark:!text-slate-900"
                                        : "bg-canvas text-ink dark:bg-slate-700/50 dark:text-slate-100"
                                }`}
                            >
                                {m.imageUrl && (
                                    <img
                                        src={m.imageUrl}
                                        alt="Ảnh đính kèm"
                                        className="mb-2 max-h-56 w-auto rounded-xl object-contain"
                                    />
                                )}
                                {m.text && <div>{m.text}</div>}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted dark:bg-slate-700/50 dark:text-slate-300">
                            <span className="animate-pulse">
                                ✨ AI đang phân tích và xử lý...
                            </span>
                        </div>
                    </div>
                )}
                <div ref={end} />
            </div>

            {/* 🟢 Khu vực nhập liệu + Xem trước ảnh */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    send(draft);
                }}
                className="space-y-2.5"
            >
                {/* Khung xem trước ảnh nhỏ gọn phía trên thanh nhập */}
                {previewUrl && (
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-hairline bg-canvas/70 p-2 pr-3 dark:border-slate-700 dark:bg-slate-800/80">
                        <img
                            src={previewUrl}
                            alt="Xem trước"
                            className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="max-w-[180px] truncate text-xs">
                            <p className="truncate font-semibold text-ink dark:text-white">
                                {selectedImage?.name}
                            </p>
                            <p className="text-[11px] text-muted">
                                {selectedImage
                                    ? `${(selectedImage.size / 1024).toFixed(0)} KB`
                                    : ""}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={clearSelectedImage}
                            title="Bỏ chọn ảnh"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 text-xs font-bold text-ink transition hover:bg-red-500 hover:text-white dark:bg-slate-700 dark:text-slate-200"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Thanh nhập tin nhắn tích hợp nút chọn ảnh bên trái */}
                <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-white p-1.5 pl-2 transition focus-within:border-brand dark:border-slate-700/50 dark:bg-slate-800">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                            handleImageSelect(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading || fetchingHistory}
                        title="Chọn ảnh từ thiết bị (JPG, PNG, WEBP < 5MB)"
                        aria-label="Chọn ảnh từ thiết bị"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-white"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                        >
                            <rect
                                width="18"
                                height="18"
                                x="3"
                                y="3"
                                rx="2"
                                ry="2"
                            />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </button>

                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onPaste={handlePaste}
                        disabled={loading || fetchingHistory}
                        placeholder="Nhập tin nhắn hoặc chọn/dán ảnh..."
                        aria-label="Message"
                        className="flex-1 bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-muted disabled:opacity-60 dark:text-white"
                    />

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            fetchingHistory ||
                            (!draft.trim() && !selectedImage)
                        }
                        className="shrink-0 rounded-xl bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:!bg-brand dark:!text-slate-900"
                    >
                        {loading ? "Đang xử lý..." : "Gửi"}
                    </button>
                </div>
            </form>

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transition-all dark:border dark:border-slate-700 dark:bg-slate-800">
                        <h3 className="text-base font-bold text-ink dark:text-white">
                            Bắt đầu cuộc trò chuyện mới?
                        </h3>
                        <p className="mt-2 text-sm text-muted dark:text-slate-300">
                            Lịch sử trò chuyện cũ sẽ bị xóa hoàn toàn khỏi hệ
                            thống.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                disabled={resetting}
                                className="rounded-xl border border-hairline px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReset}
                                disabled={resetting}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                                {resetting ? "Đang xóa..." : "Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
