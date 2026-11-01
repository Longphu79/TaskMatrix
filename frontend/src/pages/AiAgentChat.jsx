import { useEffect, useRef, useState } from "react";
import { SparkleIcon } from "../components/icon";
import { useTasks } from "../context/TaskContext";
import apiClient from "../services/apiClient";

export default function AiAgentChat() {
    const { fetchTasks } = useTasks();

    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingHistory, setFetchingHistory] = useState(true);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [resetting, setResetting] = useState(false);

    const end = useRef(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            setFetchingHistory(true);
            const res = await apiClient.get("/aiagent/history");
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
                        text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu tạo task bằng ngôn ngữ tự nhiên.",
                    },
                ]);
            }
        } catch (error) {
            console.error("Lỗi khi tải lịch sử chat:", error);
            setMessages([
                {
                    id: 0,
                    from: "ai",
                    text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu tạo task bằng ngôn ngữ tự nhiên.",
                },
            ]);
        } finally {
            setFetchingHistory(false);
        }
    };

    const handleConfirmReset = async () => {
        setResetting(true);
        try {
            await apiClient.delete("/aiagent/history");
            setMessages([
                {
                    id: 0,
                    from: "ai",
                    text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu tạo task bằng ngôn ngữ tự nhiên.",
                },
            ]);
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

    const send = async (text) => {
        if (!text.trim() || loading) return;

        const userText = text.trim();

        setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), from: "user", text: userText },
        ]);
        setDraft("");
        setLoading(true);

        try {
            const res = await apiClient.post("/aiagent/parse-and-create", {
                prompt: userText,
                userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });

            // 🟢 TỰ ĐỘNG TẢI LẠI LỊCH / TASKS KHI CREATE, UPDATE HOẶC DELETE
            const isTaskAction = [
                "CREATE_TASK",
                "UPDATE_TASK",
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

            // Gọi fetchTasks để UI cập nhật ngay lập tức
            if (isTaskAction && fetchTasks) {
                await fetchTasks();
            }
        } catch (error) {
            const errorMsg =
                typeof error === "string"
                    ? error
                    : "Không thể thực hiện thao tác từ câu lệnh này.";
            setMessages((m) => [
                ...m,
                {
                    id: crypto.randomUUID(),
                    from: "ai",
                    text: `❌ ${errorMsg}\nVui lòng thử lại với câu lệnh cụ thể hơn.`,
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
                            Tự động phân tích ngôn ngữ tự nhiên & đặt lịch vào
                            hệ thống qua AI.
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
                                {m.text}
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

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    send(draft);
                }}
                className="flex gap-3"
            >
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={loading || fetchingHistory}
                    placeholder="Nhập tin nhắn..."
                    aria-label="Message"
                    className="flex-1 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand disabled:opacity-60 dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={loading || fetchingHistory || !draft.trim()}
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:!bg-brand dark:!text-slate-900"
                >
                    {loading ? "Đang xử lý..." : "Gửi"}
                </button>
            </form>

            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-800 dark:border dark:border-slate-700">
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
                                className="rounded-xl border border-hairline px-4 py-2 text-xs font-semibold text-muted transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 dark:text-slate-300"
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
