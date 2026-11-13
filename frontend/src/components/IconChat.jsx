import { useEffect, useRef, useState } from "react";

/* ---------- COLOR & FORMATTING HELPERS ---------- */

export const PASTEL = [
    "bg-amber-200 text-amber-900",
    "bg-sky-200 text-sky-900",
    "bg-emerald-200 text-emerald-900",
    "bg-purple-200 text-purple-900",
    "bg-rose-200 text-rose-900",
];

export const colorFor = (name = "") =>
    PASTEL[
        [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0) %
            PASTEL.length
    ];

export const initials = (name = "") =>
    name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U";

export const EMOJI_QUICK = ["👍", "❤️", "🚀", "💬"];
export const EMOJI_ALL = [
    "😀",
    "😂",
    "😍",
    "🤔",
    "🎉",
    "🔥",
    "👏",
    "🙏",
    "✅",
    "👀",
    "💡",
    "🚀",
];

export const dayLabel = (ts) => {
    if (!ts) return "Today";
    const d = new Date(ts);
    const diff = Math.round(
        (new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) /
            86400000,
    );
    const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
    if (diff === 0) return `Today, ${date}`;
    if (diff === 1) return `Yesterday, ${date}`;
    return `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${date}`;
};

export const timeLabel = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const KEYWORDS =
    /\b(export|async|function|const|let|var|return|await|import|from|if|else|new|class|public|private|static|void|string|int|true|false|null)\b/;
function highlight(code) {
    const re = new RegExp(
        `(\\/\\/.*$)|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*'|\`(?:[^\`\\\\]|\\\\.)*\`)|${KEYWORDS.source}|(\\b\\d+\\b)`,
        "gm",
    );
    const out = [];
    let last = 0;
    let m;
    while ((m = re.exec(code))) {
        if (m.index > last) out.push(code.slice(last, m.index));
        const cls = m[1]
            ? "text-slate-500 italic"
            : m[2]
              ? "text-emerald-300"
              : m[3]
                ? "text-amber-300"
                : "text-sky-300";
        out.push(
            <span key={m.index} className={cls}>
                {m[0]}
            </span>,
        );
        last = m.index + m[0].length;
    }
    out.push(code.slice(last));
    return out;
}

function inline(text, key) {
    if (!text) return "";
    const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|@\w+(?: \w+)?)/g);
    return parts.map((p, i) => {
        if (/^\*\*.+\*\*$/.test(p))
            return (
                <strong key={`${key}${i}`} className="font-bold">
                    {p.slice(2, -2)}
                </strong>
            );
        if (/^_.+_$/.test(p))
            return <em key={`${key}${i}`}>{p.slice(1, -1)}</em>;
        if (/^`.+`$/.test(p))
            return (
                <code
                    key={`${key}${i}`}
                    className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-rose-600 dark:bg-slate-700"
                >
                    {p.slice(1, -1)}
                </code>
            );
        if (/^@\w/.test(p))
            return (
                <span
                    key={`${key}${i}`}
                    className="rounded-md bg-amber-100 px-1 font-semibold text-amber-800"
                >
                    {p}
                </span>
            );
        return p;
    });
}

export function RichText({ text }) {
    if (!text) return null;
    const blocks = [];
    const lines = text.split("\n");
    let list = [];
    const flush = () => {
        if (list.length)
            blocks.push(
                <ul
                    key={`l${blocks.length}`}
                    className="my-1 list-disc space-y-0.5 pl-5"
                >
                    {list.map((l, i) => (
                        <li key={i}>{inline(l, i)}</li>
                    ))}
                </ul>,
            );
        list = [];
    };
    lines.forEach((line, i) => {
        if (/^[-*] /.test(line)) list.push(line.slice(2));
        else {
            flush();
            blocks.push(
                <p key={`p${i}`} className="min-h-[1em]">
                    {inline(line, i)}
                </p>,
            );
        }
    });
    flush();
    return (
        <div className="space-y-1 text-sm leading-relaxed break-words text-slate-700 dark:text-slate-200">
            {blocks}
        </div>
    );
}

/* ---------- ICONS ---------- */

export const I = ({ d, size = 18, ...p }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...p}
    >
        {[].concat(d).map((x, i) => (
            <path key={i} d={x} />
        ))}
    </svg>
);

export const ICONS = {
    search: "m21 21-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
    plus: "M12 5v14M5 12h14",
    chevron: "m6 9 6 6 6-6",
    pin: ["M12 17v5", "M9 3h6l-1 6 3 3v2H7v-2l3-3Z"],
    info: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 11v5M12 8h.01"],
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4Z",
    clip: "m21 12-8.6 8.6a5 5 0 0 1-7-7L14 5a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15 8",
    at: [
        "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
        "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8",
    ],
    smile: [
        "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
        "M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01",
    ],
    code: "m16 18 6-6-6-6M8 6l-6 6 6 6",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    dots: "M5 12h.01M12 12h.01M19 12h.01",
    reply: "M9 17 4 12l5-5M20 18v-2a4 4 0 0 0-4-4H4",
    copy: ["M9 9h11v11H9Z", "M5 15V5a1 1 0 0 1 1-1h10"],
    file: [
        "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z",
        "M14 3v5h5",
    ],
    download: "M12 3v12m0 0-4-4m4 4 4-4M4 20h16",
    close: "M18 6 6 18M6 6l12 12",
    check: "m5 13 4 4L19 7",
    building: [
        "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16",
        "M15 10h4a1 1 0 0 1 1 1v10M3 21h18M8 8h3M8 12h3M8 16h3",
    ],
};

export const Ic = ({ n, ...p }) => <I d={ICONS[n]} {...p} />;

/* ---------- COMPONENTS ---------- */

export function Avatar({
    name = "User",
    size = "h-9 w-9",
    status,
    text = "text-xs",
}) {
    return (
        <span className="relative inline-flex shrink-0">
            <span
                className={`flex ${size} items-center justify-center rounded-full font-bold ${text} ${colorFor(name)}`}
            >
                {initials(name)}
            </span>
            {status && (
                <span
                    className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white ${status === "online" ? "bg-emerald-500" : status === "busy" ? "bg-rose-500" : "bg-slate-300"}`}
                />
            )}
        </span>
    );
}

export function MessageItem({
    msg,
    currentUserId,
    personOf,
    onReact,
    onReplyTo,
    onPin,
    onDelete,
    openMenu,
    setOpenMenu,
    flashCopy,
}) {
    const sender = personOf(msg.senderId, msg.senderName);
    const isMine = msg.senderId === currentUserId;
    const reactions = Object.entries(msg.reactions || {}).filter(
        ([, u]) => u.length,
    );
    const act =
        "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700";

    const isImage =
        msg.attachment?.url?.startsWith("data:image/") ||
        msg.attachment?.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    return (
        <div className="group relative flex gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
            <Avatar name={sender.name} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {isMine ? "You" : sender.name}
                    </span>
                    {sender.badge && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            {sender.badge}
                        </span>
                    )}
                    <span className="text-[11px] font-medium text-slate-400">
                        {msg.time || timeLabel(msg.createdAt)}
                    </span>
                    {msg.pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                            <Ic n="pin" size={11} /> Pinned
                        </span>
                    )}
                </div>

                {msg.replyTo && (
                    <div className="mt-1.5 flex items-start gap-2 rounded-r-xl border-l-4 border-[#FACC15] bg-slate-100/80 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Ic
                            n="reply"
                            size={13}
                            className="mt-0.5 shrink-0 text-amber-600"
                        />
                        <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 dark:text-white">
                                {msg.replyTo.senderName || "Member"}
                            </span>
                            <p className="truncate text-slate-500 dark:text-slate-400">
                                {msg.replyTo.text ||
                                    msg.replyTo.attachment?.name ||
                                    "Attachment"}
                            </p>
                        </div>
                    </div>
                )}

                {msg.text && (
                    <div className="mt-1">
                        <RichText text={msg.text} />
                    </div>
                )}

                {msg.attachment && (
                    <div className="mt-2">
                        {isImage ? (
                            <a
                                href={msg.attachment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block max-w-xs overflow-hidden rounded-2xl border border-slate-200 shadow-xs dark:border-slate-700"
                            >
                                <img
                                    src={msg.attachment.url}
                                    alt={msg.attachment.name}
                                    className="max-h-60 w-full object-cover transition duration-300 hover:scale-105"
                                />
                            </a>
                        ) : (
                            <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                    <Ic n="file" size={20} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                        {msg.attachment.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {msg.attachment.size}
                                    </p>
                                </div>
                                <a
                                    href={msg.attachment.url}
                                    download={msg.attachment.name}
                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-[#FACC15] hover:text-slate-900 dark:bg-slate-700 dark:text-slate-200"
                                >
                                    <Ic n="download" size={16} />
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {reactions && reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {reactions.map(([e, users]) => (
                            <button
                                key={e}
                                onClick={() => onReact(msg.id, e)}
                                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition ${users.includes("me") ? "border-[#FACC15] bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700"}`}
                            >
                                <span>{e}</span>
                                {users.length}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div
                className={`absolute -top-4 right-4 z-10 flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-md transition dark:border-slate-700 ${openMenu === msg.id ? "opacity-100" : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"}`}
            >
                {EMOJI_QUICK.map((e) => (
                    <button
                        key={e}
                        aria-label={`React ${e}`}
                        onClick={() => onReact(msg.id, e)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        {e}
                    </button>
                ))}
                <span className="mx-0.5 h-5 w-px bg-slate-200" />
                <button
                    aria-label="Reply to message"
                    title="Reply"
                    onClick={() =>
                        onReplyTo({
                            id: msg.id,
                            senderName: sender.name,
                            text: msg.text,
                            attachment: msg.attachment,
                        })
                    }
                    className={act}
                >
                    <Ic n="reply" size={16} />
                </button>
                <button
                    aria-label="Copy text"
                    title="Copy text"
                    onClick={() =>
                        flashCopy(msg.text || msg.attachment?.name || "")
                    }
                    className={act}
                >
                    <Ic n="copy" size={16} />
                </button>
                <div className="relative">
                    <button
                        aria-label="More options"
                        title="More"
                        onClick={() =>
                            setOpenMenu(openMenu === msg.id ? null : msg.id)
                        }
                        className={act}
                    >
                        <Ic n="dots" size={16} />
                    </button>
                    {openMenu === msg.id && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenu(null)}
                            />
                            <div className="absolute top-9 right-0 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        onPin(msg.id);
                                        setOpenMenu(null);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                                >
                                    {msg.pinned
                                        ? "Unpin message"
                                        : "Pin message"}
                                </button>
                                {isMine && (
                                    <button
                                        onClick={() => {
                                            onDelete(msg.id);
                                            setOpenMenu(null);
                                        }}
                                        className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                        Delete message
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function Composer({
    placeholder,
    onSend,
    people = [],
    replyTo,
    onCancelReply,
    compact,
}) {
    const [text, setText] = useState("");
    const [attach, setAttach] = useState(null);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [mentionOpen, setMentionOpen] = useState(false);
    const ta = useRef(null);
    const fileRef = useRef(null);

    const edit = (fn) => {
        const el = ta.current;
        if (!el) return;
        const s = el.selectionStart;
        const e = el.selectionEnd;
        const { value, from, to } = fn(text, s, e);
        setText(value);
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(from, to);
        });
    };
    const wrap = (mark) =>
        edit((v, s, e) => ({
            value: v.slice(0, s) + mark + v.slice(s, e) + mark + v.slice(e),
            from: s + mark.length,
            to: e + mark.length,
        }));
    const prefixLines = () =>
        edit((v, s, e) => {
            const start = v.lastIndexOf("\n", s - 1) + 1;
            const block = v
                .slice(start, e)
                .split("\n")
                .map((l) => (l.startsWith("- ") ? l : `- ${l}`))
                .join("\n");
            return {
                value: v.slice(0, start) + block + v.slice(e),
                from: start,
                to: start + block.length,
            };
        });
    const insert = (str) =>
        edit((v, s, e) => ({
            value: v.slice(0, s) + str + v.slice(e),
            from: s + str.length,
            to: s + str.length,
        }));

    const pickFile = (f) => {
        if (!f) return;
        const size =
            f.size > 1048576
                ? `${(f.size / 1048576).toFixed(1)} MB`
                : `${Math.max(1, Math.round(f.size / 1024))} KB`;
        const r = new FileReader();
        r.onload = () => {
            setAttach({
                name: f.name,
                size,
                url: r.result,
                isImage: f.type.startsWith("image/"),
            });
        };
        r.readAsDataURL(f);
    };

    const submit = () => {
        const raw = text.trim();
        if (!raw && !attach) return;
        onSend({ text: raw, file: attach, replyTo });
        setText("");
        setAttach(null);
        setEmojiOpen(false);
        setMentionOpen(false);
        if (onCancelReply) onCancelReply();
    };

    const tool =
        "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-white";
    return (
        <div className="relative">
            {(emojiOpen || mentionOpen) && (
                <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                        setEmojiOpen(false);
                        setMentionOpen(false);
                    }}
                />
            )}
            {emojiOpen && (
                <div className="absolute bottom-full left-24 z-20 mb-2 grid w-56 grid-cols-6 gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700">
                    {EMOJI_ALL.map((e) => (
                        <button
                            key={e}
                            onClick={() => {
                                insert(e);
                                setEmojiOpen(false);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            {e}
                        </button>
                    ))}
                </div>
            )}
            {mentionOpen && (
                <div className="absolute bottom-full left-12 z-20 mb-2 w-52 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700">
                    {people.map((n) => (
                        <button
                            key={n}
                            onClick={() => {
                                insert(`@${n} `);
                                setMentionOpen(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                            <Avatar name={n} size="h-6 w-6" text="text-[9px]" />{" "}
                            {n}
                        </button>
                    ))}
                </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition focus-within:border-[#FACC15] focus-within:ring-4 focus-within:ring-[#FACC15]/20 dark:border-slate-700">
                {replyTo && (
                    <div className="mx-3 mt-3 flex items-center justify-between rounded-2xl border-l-4 border-[#FACC15] bg-amber-50/70 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2 truncate pr-2">
                            <Ic
                                n="reply"
                                size={14}
                                className="shrink-0 text-amber-600"
                            />
                            <span className="truncate">
                                Replying to{" "}
                                <strong className="font-bold text-slate-900 dark:text-white">
                                    {replyTo.senderName}
                                </strong>
                                :{" "}
                                {replyTo.text ||
                                    replyTo.attachment?.name ||
                                    "Attachment"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCancelReply}
                            className="h-6 w-6 shrink-0 rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {attach && (
                    <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-2 dark:bg-slate-800">
                        {attach.isImage ? (
                            <img
                                src={attach.url}
                                alt=""
                                className="h-12 w-12 rounded-xl object-cover"
                            />
                        ) : (
                            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <Ic n="file" />
                            </span>
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {attach.name}
                            </p>
                            <p className="text-xs text-slate-400">
                                {attach.size}
                            </p>
                        </div>
                        <button
                            aria-label="Remove attachment"
                            onClick={() => setAttach(null)}
                            className={tool}
                        >
                            <Ic n="close" size={14} />
                        </button>
                    </div>
                )}
                <textarea
                    ref={ta}
                    rows={compact ? 1 : 2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                        }
                    }}
                    placeholder={placeholder}
                    aria-label={placeholder}
                    className="block max-h-40 w-full resize-none bg-transparent px-5 pt-4 pb-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
                <div className="flex items-center gap-0.5 px-3 pb-3">
                    <button
                        aria-label="Bold"
                        title="Bold"
                        onClick={() => wrap("**")}
                        className={`${tool} font-bold`}
                    >
                        B
                    </button>
                    <button
                        aria-label="Italic"
                        title="Italic"
                        onClick={() => wrap("_")}
                        className={`${tool} italic`}
                    >
                        I
                    </button>
                    <button
                        aria-label="Code block"
                        title="Code block"
                        onClick={() => wrap("```\n")}
                        className={tool}
                    >
                        <Ic n="code" size="{16}" />
                    </button>
                    <button
                        aria-label="List"
                        title="List"
                        onClick={prefixLines}
                        className={tool}
                    >
                        <Ic n="list" size="{16}" />
                    </button>
                    <span className="mx-1.5 h-5 w-px bg-slate-200 dark:bg-slate-700" />
                    <input
                        ref={fileRef}
                        type="file"
                        hidden
                        onChange={(e) => {
                            pickFile(e.target.files?.[0]);
                            e.target.value = "";
                        }}
                    />
                    <button
                        aria-label="Attach file"
                        title="Attach file"
                        onClick={() => fileRef.current?.click()}
                        className={tool}
                    >
                        <Ic n="clip" size="{16}" />
                    </button>
                    <button
                        aria-label="Mention"
                        title="Mention"
                        onClick={() => {
                            setMentionOpen((o) => !o);
                            setEmojiOpen(false);
                        }}
                        className={tool}
                    >
                        <Ic n="at" size="{16}" />
                    </button>
                    <button
                        aria-label="Emoji"
                        title="Emoji"
                        onClick={() => {
                            setEmojiOpen((o) => !o);
                            setMentionOpen(false);
                        }}
                        className={tool}
                    >
                        <Ic n="smile" size="{16}" />
                    </button>
                    <button
                        onClick={submit}
                        aria-label="Send message"
                        disabled={!text.trim() && !attach}
                        className="ml-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FACC15] text-slate-900 shadow-sm transition hover:bg-[#EAB308] active:scale-95 disabled:opacity-40"
                    >
                        <Ic n="send" size="{17}" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PanelHead({ title, onClose }) {
    return (
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {title}
            </h3>
            <button
                aria-label="Close panel"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
                <Ic n="close" size="{16}" />
            </button>
        </div>
    );
}

export function InfoPanel({
    title,
    topic,
    members = [],
    messages = [],
    onClose,
}) {
    const files = messages.filter((m) => m.attachment);
    return (
        <>
            <PanelHead onClose="{onClose}" title="Channel Info" />
            <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <section>
                    <h4 className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                        About
                    </h4>
                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{topic}</p>
                </section>
                <section>
                    <h4 className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                        Members ({members.length})
                    </h4>
                    <ul className="mt-3 space-y-2.5">
                        {members.map((m) => {
                            const name =
                                m.fullName || m.name || m.email || "Member";
                            return (
                                <li
                                    key={m.id || name}
                                    className="flex items-center gap-3"
                                >
                                    <Avatar
                                        name="{name}"
                                        size="h-8 w-8"
                                        text="text-[11px]"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {name}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
                <section>
                    <h4 className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                        Shared files ({files.length})
                    </h4>
                    {files.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-400">
                            No files shared yet.
                        </p>
                    ) : (
                        files.map((m) => (
                            <div
                                key={m.id}
                                className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                            >
                                <Ic
                                    className="text-amber-600"
                                    n="file"
                                    size="{16}"
                                />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                        {m.attachment.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {m.attachment.size}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </section>
            </div>
        </>
    );
}
