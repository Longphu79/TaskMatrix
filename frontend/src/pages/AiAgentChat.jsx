import { useEffect, useRef, useState } from "react";
import { SparkleIcon } from "../components/icon";
import { toISODate, useTasks } from "../context/TaskContext";

const SUGGESTIONS = [
    "What's on my schedule today?",
    "Which tasks are still pending?",
    "Show my high priority tasks",
];

function reply(text, tasks) {
    const q = text.toLowerCase();
    const today = toISODate(new Date());
    const list = (items) =>
        items.length
            ? items
                  .map(
                      (t) =>
                          `• ${t.title} (${t.dueDate}, ${t.startTime}–${t.endTime})`,
                  )
                  .join("\n")
            : "Nothing found.";
    if (q.includes("today") || q.includes("schedule"))
        return `Today's tasks:\n${list(tasks.filter((t) => t.dueDate === today))}`;
    if (q.includes("high"))
        return `High priority tasks:\n${list(tasks.filter((t) => t.priority === "High" && t.status === "Pending"))}`;
    if (q.includes("pending") || q.includes("todo") || q.includes("left"))
        return `Pending tasks:\n${list(tasks.filter((t) => t.status === "Pending"))}`;
    return `You have ${tasks.filter((t) => t.status === "Pending").length} pending and ${tasks.filter((t) => t.status === "Completed").length} completed tasks. Try asking about today's schedule or high priority work.`;
}

export default function AiAgentChat() {
    const { tasks } = useTasks();
    const [messages, setMessages] = useState([
        {
            id: 0,
            from: "ai",
            text: "Hi, I'm your TASKY assistant. I can look through your tasks and schedule.",
        },
    ]);
    const [draft, setDraft] = useState("");
    const end = useRef(null);
    useEffect(() => {
        end.current?.scrollIntoView({ block: "end" });
    }, [messages]);

    const send = (text) => {
        if (!text.trim()) return;
        setMessages((m) => [
            ...m,
            { id: crypto.randomUUID(), from: "user", text: text.trim() },
            { id: crypto.randomUUID(), from: "ai", text: reply(text, tasks) },
        ]);
        setDraft("");
    };

    return (
        <section className="mx-5 mb-8 flex min-h-[520px] flex-col rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)] dark:border dark:border-slate-700/50 lg:mx-8">
            <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-ink dark:bg-brand/15 dark:text-brand">
                    <SparkleIcon />
                </span>
                <div>
                    <h2 className="font-display text-lg font-bold text-ink">
                        AI Agent
                    </h2>
                    <p className="text-xs text-muted">
                        Local demo assistant. Answers come from your tasks, not
                        an external model.
                    </p>
                </div>
            </div>

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
                        <p
                            className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                                m.from === "user"
                                    ? "bg-ink text-white dark:!bg-brand dark:!text-slate-900"
                                    : "bg-canvas text-ink dark:bg-slate-700/50 dark:text-slate-100"
                            }`}
                        >
                            {m.text}
                        </p>
                    </div>
                ))}
                <div ref={end} />
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-ink"
                    >
                        {s}
                    </button>
                ))}
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
                    placeholder="Ask about your tasks..."
                    aria-label="Message"
                    className="flex-1 rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand dark:bg-slate-800 dark:border-slate-700/50 dark:text-white"
                />
                <button
                    type="submit"
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black dark:!bg-brand dark:!text-slate-900"
                >
                    Send
                </button>
            </form>
        </section>
    );
}
