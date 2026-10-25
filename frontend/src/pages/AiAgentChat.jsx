import { useEffect, useRef, useState } from "react";
import { SparkleIcon } from "../components/icon";
import { useTasks } from "../context/TaskContext";
import apiClient from "../services/apiClient"; // 🟢 Import Axios client đã cấu hình Interceptor

export default function AiAgentChat() {
    // Lấy hàm fetchTasks/getTasks từ context để reload lại danh sách task sau khi AI tạo
    const { fetchTasks } = useTasks();

    const [messages, setMessages] = useState([
        {
            id: 0,
            from: "ai",
            text: "Xin chào! Tôi là trợ lý AI TaskMatrix. Hãy nhập yêu cầu tạo task bằng ngôn ngữ tự nhiên.",
        },
    ]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false); // 🟢 State xử lý hiệu ứng chờ AI
    const end = useRef(null);

    useEffect(() => {
        end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, loading]);

    const send = async (text) => {
        if (!text.trim() || loading) return;

        const userText = text.trim();

        // 1. Hiển thị ngay tin nhắn người dùng lên khung chat
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

            // Nếu là tạo Task thành công -> Reload danh sách Task ở UI
            if (res.intent === "CREATE_TASK") {
                setMessages((m) => [
                    ...m,
                    {
                        id: crypto.randomUUID(),
                        from: "ai",
                        text: `✅ ${res.message}`,
                    },
                ]);
                if (fetchTasks) await fetchTasks();
            } else {
                // Nếu chỉ là trò chuyện thông thường -> In ra câu trả lời của AI
                setMessages((m) => [
                    ...m,
                    { id: crypto.randomUUID(), from: "ai", text: res.message },
                ]);
            }
        } catch (error) {
            // Xử lý thông báo lỗi từ Interceptor
            const errorMsg =
                typeof error === "string"
                    ? error
                    : "Không thể tạo công việc từ câu lệnh này.";
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
        <section className="mx-5 mb-8 flex min-h-[520px] flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 lg:mx-8">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand">
                    <SparkleIcon />
                </span>
                <div>
                    <h2 className="font-display text-lg font-bold text-ink">
                        TaskMatrix AI Agent
                    </h2>
                    <p className="text-xs text-muted">
                        Tự động phân tích ngôn ngữ tự nhiên & đặt lịch vào hệ
                        thống qua AI.
                    </p>
                </div>
            </div>

            {/* Chat Box Content */}
            <div
                className="my-6 flex-1 space-y-3 overflow-y-auto"
                role="log"
                aria-live="polite"
                aria-label="AI conversation"
            >
                {messages.map((m) => (
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
                ))}

                {/* 🟢 Hiệu ứng loading khi AI đang xử lý */}
                {loading && (
                    <div className="flex justify-start">
                        <div className="rounded-2xl bg-canvas px-4 py-3 text-sm text-muted dark:bg-slate-700/50 dark:text-slate-300">
                            <span className="animate-pulse">
                                ✨ AI đang phân tích và tạo công việc...
                            </span>
                        </div>
                    </div>
                )}
                <div ref={end} />
            </div>

            {/* Input Form */}
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
                    disabled={loading}
                    placeholder="Nhập yêu cầu tạo task (ví dụ: Họp team vào 9h sáng mai)..."
                    aria-label="Message"
                    className="flex-1 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand disabled:opacity-60 dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={loading || !draft.trim()}
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50 dark:!bg-brand dark:!text-slate-900"
                >
                    {loading ? "Đang xử lý..." : "Gửi"}
                </button>
            </form>
        </section>
    );
}
