
import { useCallback, useEffect, useMemo, useState } from "react";
import { analyticsApi } from "../services/analyticsApi";
import {
    ClockIcon,
    ChartIcon,
    ListIcon,
} from "../components/icon";

// ==============================
// CONSTANTS
// ==============================

const RANGES = ["week", "month", "year"];

const STATUS_COLORS = [
    "#f6c62e",
    "#242424",
    "#77b7a2",
    "#d9dce2",
];

// ==============================
// HELPERS
// ==============================

function number(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}

function field(object, name, fallback = null) {
    if (!object) return fallback;

    const pascalName =
        name.charAt(0).toUpperCase() + name.slice(1);

    return object[name] ?? object[pascalName] ?? fallback;
}

function minutesLabel(value) {
    const total = Math.max(0, Math.round(number(value)));

    const hours = Math.floor(total / 60);
    const minutes = total % 60;

    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function percent(value) {
    return `${number(value).toFixed(1).replace(/\.0$/, "")}%`;
}

function getErrorMessage(error) {
    const status =
        error?.response?.status ?? error?.status;

    if (status === 401) {
        return "Your session has expired. Please sign in again.";
    }

    if (status === 403) {
        return "You do not have permission to access Analytics.";
    }

    if (status === 400) {
        return "Invalid analytics period.";
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        error?.title ||
        "Unable to load analytics. Please try again."
    );
}

// Backend thống kê theo lịch Việt Nam UTC+7
function formatPeriod(range) {
    const now = new Date(
        Date.now() + 7 * 60 * 60 * 1000
    );

    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const day = now.getUTCDate();

    if (range === "year") {
        return String(year);
    }

    if (range === "month") {
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
        }).format(new Date(Date.UTC(year, month, 1)));
    }

    const current = new Date(Date.UTC(year, month, day));

    const daysSinceMonday =
        (current.getUTCDay() + 6) % 7;

    const start = new Date(
        current.getTime() - daysSinceMonday * 86400000
    );

    const end = new Date(
        start.getTime() + 6 * 86400000
    );

    const formatDay = (value) =>
        new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        }).format(value);

    return `${formatDay(start)} – ${formatDay(end)}, ${end.getUTCFullYear()}`;
}

// ==============================
// NORMALIZE BACKEND RESPONSE
// ==============================

function normalizeOverview(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid overview response.");
    }

    const normalizeTrend = (name) => {
        const trend = field(data, name, {});

        return {
            delta: field(trend, "delta", ""),
            up: Boolean(field(trend, "up", false)),
        };
    };

    return {
        completedTasks: number(
            field(data, "completedTasks", 0)
        ),

        completionRate: number(
            field(data, "completionRate", 0)
        ),

        completedOnTime: number(
            field(data, "completedOnTime", 0)
        ),

        onTimeRate: number(
            field(data, "onTimeRate", 0)
        ),

        completedTrend: normalizeTrend("completedTrend"),

        completionRateTrend: normalizeTrend(
            "completionRateTrend"
        ),

        onTimeTrend: normalizeTrend("onTimeTrend"),
    };
}



function normalizeActivity(data) {
    const items = field(data, "data", []);

    if (!Array.isArray(items)) {
        throw new Error("Invalid activity response.");
    }

    return items.map((item) => ({
        date: String(field(item, "date", "")),

        completedTasks: number(
            field(item, "completedTasks", 0)
        ),

        scheduledMinutes: number(
            field(item, "scheduledMinutes", 0)
        ),

        earlyMinutes: number(
            field(item, "earlyMinutes", 0)
        ),

        lateMinutes: number(
            field(item, "lateMinutes", 0)
        ),

        actualMinutes: number(
            field(item, "actualMinutes", 0)
        ),
    }));
}




function normalizeDistribution(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid distribution response.");
    }

    const todo = number(field(data, "todo", 0));
    const completed = number(field(data, "completed", 0));
    const cancelled = number(field(data, "cancelled", 0));

    // Giữ đầy đủ dữ liệu thực tế
    const total = number(field(data, "total", 0));

    const items = [
        {
            label: "To do",
            value: todo,
            color: "#f6c62e",
        },
        {
            label: "Completed",
            value: completed,
            color: "#77b7a2",
        },
    ];

    // Chỉ hiện Cancelled khi thực sự có task bị hủy
    if (cancelled > 0) {
        items.push({
            label: "Cancelled",
            value: cancelled,
            color: "#d9dce2",
        });
    }

    return {
        total,
        items,
    };
}


function normalizeSummary(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid summary response.");
    }

    return {
        totalTasks: number(
            field(data, "totalTasks", 0)
        ),

        completedTasks: number(
            field(data, "completedTasks", 0)
        ),

        pendingTasks: number(
            field(data, "pendingTasks", 0)
        ),

        overdueTasks: number(
            field(data, "overdueTasks", 0)
        ),

        totalActualMinutes: number(
            field(data, "totalActualMinutes", 0)
        ),

        averageActualMinutes: number(
            field(data, "averageActualMinutes", 0)
        ),

        mostProductiveDate: field(
            data,
            "mostProductiveDate",
            null
        ),

        mostProductiveMinutes: number(
            field(data, "mostProductiveMinutes", 0)
        ),

        onTimeRate: number(
            field(data, "onTimeRate", 0)
        ),
        longOverdueTasks: number(
        field(data, "longOverdueTasks", 0)
         ),
        completedVeryLateTasks: number(
            field(data, "completedVeryLateTasks", 0)
        ),
    };
}

// ==============================
// REUSABLE COMPONENTS
// ==============================

function TrendPill({ up, children }) {
    if (!children) return null;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                up
                    ? "bg-brand-soft text-[#a07a00]"
                    : "bg-canvas text-muted"
            }`}
        >
            {children}
        </span>
    );
}

function CardHead({ title, subtitle }) {
    return (
        <div className="mb-6">
            <h3 className="font-display text-[17px] font-semibold text-ink">
                {title}
            </h3>

            {subtitle && (
                <p className="mt-0.5 text-xs text-muted">
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function MetricCard({
    label,
    value,
    trend,
    hint,
    Icon,
}) {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]">

            <div className="mb-6 flex items-center justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                    <Icon width={20} height={20} />
                </span>

                {trend && (
                    <TrendPill up={trend.up}>
                        {trend.delta}
                    </TrendPill>
                )}
            </div>

            <div className="font-display text-3xl font-bold text-ink">
                {value}
            </div>

            <p className="mt-1 text-sm font-medium text-muted">
                {label}
            </p>

            {hint && (
                <p className="mt-1 text-xs text-muted">
                    {hint}
                </p>
            )}
        </div>
    );
}

function EmptyChart({ message }) {
    return (
        <div className="flex min-h-44 items-center justify-center rounded-2xl bg-canvas/60 px-6 text-center text-sm text-muted">
            {message}
        </div>
    );
}

// ==============================
// ACTIVITY CHART
// ==============================

function labelFor(date, range) {
    if (range === "year") {
        return date.slice(5);
    }

    if (range === "month") {
        return date.slice(8);
    }

    const parsed = new Date(`${date}T00:00:00Z`);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "UTC",
    }).format(parsed);
}



function ActivityChart({ data, range, metric }) {
    if (!data.length) {
        return (
            <EmptyChart message="No activity data for this period." />
        );
    }

    const isMinutes = metric === "minutes";

    const width = 680;
    const height = 240;

    const left = 44;
    const right = 14;
    const top = 18;
    const bottom = 38;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const colors = {
        scheduled: "#f6c62e",
        early: "#77b7a2",
        late: "#f87171",
        tasks: "#f6c62e",
    };

    const values = data.flatMap((item) =>
        isMinutes
            ? [
                  Number(item.scheduledMinutes) || 0,
                  Number(item.earlyMinutes) || 0,
                  Number(item.lateMinutes) || 0,
              ]
            : [Number(item.completedTasks) || 0]
    );

    const max = Math.max(1, ...values);

    const step = plotWidth / data.length;

    const barWidth = Math.max(
        2,
        Math.min(
            isMinutes ? 13 : 38,
            step * (isMinutes ? 0.25 : 0.65)
        )
    );

    const gap = 2;

    const labelEvery = range === "month" ? 5 : 1;

    const getHeight = (value) =>
        (Math.max(0, value) / max) * plotHeight;

    const getY = (value) =>
        top + plotHeight - getHeight(value);

    const legend = [
        {
            label: "Scheduled",
            color: colors.scheduled,
        },
        {
            label: "Early",
            color: colors.early,
        },
        {
            label: "Late",
            color: colors.late,
        },
    ];

    return (
        <div>
            {/* MINUTES LEGEND */}
            {isMinutes && (
                <div className="mb-4 flex flex-wrap items-center gap-5 text-xs text-muted">
                    {legend.map((item) => (
                        <div
                            key={item.label}
                            className="flex items-center gap-2"
                        >
                            <span
                                className="h-3 w-3 rounded"
                                style={{
                                    backgroundColor: item.color,
                                }}
                            />

                            {item.label}
                        </div>
                    ))}
                </div>
            )}

            {/* CHART */}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-60 w-full"
                role="img"
                aria-label={
                    isMinutes
                        ? "Scheduled, early and late minutes"
                        : "Completed tasks"
                }
            >
                {/* Y AXIS */}
                {[0, 0.5, 1].map((fraction) => {
                    const value = max * fraction;

                    const y =
                        top + plotHeight * (1 - fraction);

                    return (
                        <g key={fraction}>
                            <line
                                x1={left}
                                y1={y}
                                x2={width - right}
                                y2={y}
                                stroke="#e9e9e9"
                            />

                            <text
                                x={left - 8}
                                y={y + 4}
                                textAnchor="end"
                                fill="#888"
                                fontSize="11"
                            >
                                {Number(value.toFixed(1))}
                            </text>
                        </g>
                    );
                })}

                {/* BARS */}
                {data.map((item, index) => {
                    const center =
                        left + index * step + step / 2;

                    const bars = isMinutes
                        ? [
                              {
                                  label: "Scheduled",
                                  value: item.scheduledMinutes,
                                  color: colors.scheduled,
                                  x: center - 1.5 * barWidth - gap,
                              },
                              {
                                  label: "Early",
                                  value: item.earlyMinutes,
                                  color: colors.early,
                                  x: center - barWidth / 2,
                              },
                              {
                                  label: "Late",
                                  value: item.lateMinutes,
                                  color: colors.late,
                                  x: center + barWidth / 2 + gap,
                              },
                          ]
                        : [
                              {
                                  label: "Completed tasks",
                                  value: item.completedTasks,
                                  color: colors.tasks,
                                  x: center - barWidth / 2,
                              },
                          ];

                    return (
                        <g key={`${item.date}-${index}`}>
                            {bars.map((bar) => {
                                const value = Math.max(
                                    0,
                                    Number(bar.value) || 0
                                );

                                return (
                                    <rect
                                        key={bar.label}
                                        x={bar.x}
                                        y={getY(value)}
                                        width={barWidth}
                                        height={getHeight(value)}
                                        rx="3"
                                        fill={bar.color}
                                    >
                                        <title>
                                            {`${item.date} - ${bar.label}: ${value} ${
                                                isMinutes
                                                    ? "minutes"
                                                    : "tasks"
                                            }`}
                                        </title>
                                    </rect>
                                );
                            })}

                            {/* X AXIS LABEL */}
                            {(index % labelEvery === 0 ||
                                index === data.length - 1) && (
                                <text
                                    x={center}
                                    y={height - 12}
                                    textAnchor="middle"
                                    fill="#888"
                                    fontSize="11"
                                >
                                    {labelFor(item.date, range)}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>

            <p className="mt-2 text-center text-xs text-muted">
                {isMinutes
                    ? "Scheduled duration and completion timing"
                    : "Tasks completed"}
            </p>

            {isMinutes && (
                <p className="mt-2 text-center text-xs leading-5 text-muted">
                    Early and Late compare the completion
                    timestamp with the task's scheduled end time.
                    They do not measure actual work duration.
                </p>
            )}
        </div>
    );
}



// ==============================
// DONUT CHART
// ==============================

function Donut({ data, total }) {
    const sum = data.reduce(
        (value, item) => value + item.value,
        0
    );

    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    let offset = 0;

    return (
        <div className="relative h-40 w-40 shrink-0">
            <svg
                viewBox="0 0 140 140"
                className="h-40 w-40 -rotate-90"
                role="img"
                aria-label="Task distribution by status"
            >
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="#f4f5f7"
                    strokeWidth="16"
                />

                {sum > 0 &&
                    data.map((item) => {
                        const length =
                            (item.value / sum) * circumference;

                        const segment = (
                            <circle
                                key={item.label}
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth="16"
                                strokeDasharray={
                                    `${length} ${circumference - length}`
                                }
                                strokeDashoffset={-offset}
                            >
                                <title>
                                    {`${item.label}: ${item.value}`}
                                </title>
                            </circle>
                        );

                        offset += length;

                        return segment;
                    })}
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-ink">
                    {total}
                </span>

                <span className="text-xs text-muted">
                    tasks
                </span>
            </div>
        </div>
    );
}

function SummaryCell({ label, value }) {
    return (
        <div className="rounded-2xl bg-canvas p-4">
            <div className="font-display text-xl font-bold text-ink">
                {value}
            </div>

            <div className="mt-1 text-xs font-medium text-muted">
                {label}
            </div>
        </div>
    );
}

// ==============================
// MAIN ANALYTICS PAGE
// ==============================

export default function AnalyticsPage() {
    const [range, setRange] = useState("week");

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [refresh, setRefresh] = useState(0);

    const [activityMetric, setActivityMetric] =
        useState("tasks");

    const retry = useCallback(() => {
        setRefresh((current) => current + 1);
    }, []);

    // ==============================
    // FETCH ALL ANALYTICS APIs
    // ==============================

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError("");
        setDashboard(null);

        Promise.all([
            analyticsApi.getOverview(range),
            analyticsApi.getActivity(range),
            analyticsApi.getDistribution(range),
            analyticsApi.getSummary(range),
        ])
            .then((responses) => {
                if (cancelled) return;

                const [
                    overview,
                    activity,
                    distribution,
                    summary,
                ] = responses;

                setDashboard({
                    overview: normalizeOverview(overview),

                    activity: normalizeActivity(activity),

                    distribution:
                        normalizeDistribution(distribution),

                    summary: normalizeSummary(summary),
                });
            })
            .catch((err) => {
                if (cancelled) return;

                console.error(
                    "Analytics API error:",
                    err
                );

                setError(getErrorMessage(err));
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [range, refresh]);

    // ==============================
    // METRICS
    // ==============================

    const metrics = useMemo(() => {
        if (!dashboard) return [];

        const overview = dashboard.overview;

        return [
            {
                label: "Tasks Completed",
                value: overview.completedTasks,
                trend: overview.completedTrend,
                hint: `Completed during this ${range}`,
                Icon: ListIcon,
            },
            {
                label: "Completion Rate",
                value: percent(overview.completionRate),
                trend: overview.completionRateTrend,
                hint: "Completed tasks due this period",
                Icon: ChartIcon,
            },
            {
                label: "Completed On Time",
                value: overview.completedOnTime,
                trend: overview.onTimeTrend,
                hint: "Completed during this period by due date",
                Icon: ClockIcon,
            },
            {
                label: "On-time Rate",
                value: percent(overview.onTimeRate),
                hint: "On-time among completed tasks with due dates",
                Icon: ChartIcon,
            },
        ];
    }, [dashboard, range]);

    const cardClass =
        "rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(17,17,26,0.04)]";

    // ==============================
    // RENDER
    // ==============================

    return (
        <div className="px-5 pb-8 lg:px-8">

            {/* HEADER */}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <div>
                    <h2 className="font-display text-3xl font-bold text-ink">
                        Analytics
                    </h2>

                    <p className="mt-1 text-sm font-medium text-muted">
                        Performance overview · {formatPeriod(range)}
                    </p>
                </div>

                <div className="flex items-center gap-2">

                    {/* PERIOD FILTER */}

                    <div className="flex items-center gap-1 rounded-full bg-white p-1">
                        {RANGES.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setRange(item)}
                                aria-pressed={range === item}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                    range === item
                                        ? "bg-ink text-white"
                                        : "text-muted hover:text-ink"
                                }`}
                            >
                                {item.charAt(0).toUpperCase() +
                                    item.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* REFRESH */}

                    <button
                        type="button"
                        onClick={retry}
                        disabled={loading}
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* ERROR */}

            {error && (
                <div
                    role="alert"
                    className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={retry}
                        className="rounded-xl bg-white px-4 py-2 font-semibold"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* LOADING */}

            {loading && (
                <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-44 animate-pulse rounded-3xl bg-white"
                        />
                    ))}
                </div>
            )}

            {/* OVERVIEW METRICS */}

            {!loading && dashboard && (
                <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((item) => (
                        <MetricCard
                            key={item.label}
                            {...item}
                        />
                    ))}
                </div>
            )}

            {/* CHARTS */}

            {dashboard && (
                <>
                    <div className="mb-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">

                        {/* ACTIVITY OVERVIEW */}

                        <section className={cardClass}>
                            <CardHead
                                title="Activity Overview"
                                subtitle="Activity on completed tasks"
                            />

                            <div className="mb-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActivityMetric("tasks")
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                        activityMetric === "tasks"
                                            ? "bg-ink text-white"
                                            : "bg-canvas text-muted"
                                    }`}
                                >
                                    Tasks
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setActivityMetric("minutes")
                                    }
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                        activityMetric === "minutes"
                                            ? "bg-ink text-white"
                                            : "bg-canvas text-muted"
                                    }`}
                                >
                                    Minutes
                                </button>
                            </div>

                            <ActivityChart
                                data={dashboard.activity}
                                range={range}
                                metric={activityMetric}
                            />
                        </section>

                        
                        {/* AI RELIABILITY SCORE */}

                        <section className={cardClass}>
                            <CardHead
                                title="AI Reliability Score"
                                subtitle="AI-powered task reliability analysis"
                            />

                            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-canvas/60 px-6 py-8 text-center">

                                {/* AI Icon */}
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                                    <svg
                                        width="34"
                                        height="34"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 18V5" />
                                        <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                                        <path d="M17 6.5A4 4 0 0 0 9.5 5 4 4 0 0 0 5 11a4 4 0 0 0 2 7.5A4 4 0 0 0 12 20a4 4 0 0 0 5-1.5 4 4 0 0 0 2-7.5A4 4 0 0 0 17 6.5Z" />
                                    </svg>
                                </div>

                                {/* AI Score */}
                                <div className="font-display text-5xl font-bold text-ink">
                                    —%
                                </div>

                                {/* Status */}
                                <div className="mt-4 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold text-[#a07a00]">
                                    Coming Soon
                                </div>

                                <h4 className="mt-5 text-base font-semibold text-ink">
                                    Not evaluated yet
                                </h4>

                                <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
                                    AI will analyze your task completion patterns,
                                    consistency, and on-time performance to provide
                                    a reliability score.
                                </p>

                                {/* Future feature note */}
                                <div className="mt-6 w-full max-w-sm rounded-xl border border-hairline bg-white p-3">
                                    <p className="text-xs text-muted">
                                        AI evaluation is not available yet.
                                        Your score will appear here once
                                        this feature is enabled.
                                    </p>
                                </div>

                            </div>
                        </section>

                    </div>

                    {/* DISTRIBUTION AND SUMMARY */}

                    <div className="grid gap-5 lg:grid-cols-2">

                        {/* TASK DISTRIBUTION */}

                        <section className={cardClass}>
                            <CardHead
                                title="Task Distribution"
                                subtitle="Status of tasks due this period"
                            />

                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">

                                <Donut
                                    data={dashboard.distribution.items}
                                    total={dashboard.distribution.total}
                                />

                                <div className="w-full flex-1 space-y-3">

                                    {dashboard.distribution.items.map(
                                        (item) => (
                                            <div
                                                key={item.label}
                                                className="flex items-center gap-3"
                                            >
                                                <span
                                                    className="h-3 w-3 shrink-0 rounded-full"
                                                    style={{
                                                        background:
                                                            item.color,
                                                    }}
                                                />

                                                <span className="flex-1 text-sm font-medium text-ink">
                                                    {item.label}
                                                </span>

                                                <span className="text-sm font-semibold text-muted">
                                                    {item.value} (
                                                    {dashboard.distribution.total
                                                        ? Math.round(
                                                            item.value *
                                                            100 /
                                                            dashboard.distribution.total
                                                        )
                                                        : 0}
                                                    %)
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* ANALYTICS SUMMARY */}

                        <section className={cardClass}>
                            <CardHead
                                title="Analytics Summary"
                                subtitle="Key highlights for this period"
                            />

                            <div className="grid grid-cols-2 gap-4">

                                <SummaryCell
                                    label="Tasks due"
                                    value={dashboard.summary.totalTasks}
                                />

                                <SummaryCell
                                    label="Pending tasks"
                                    value={dashboard.summary.pendingTasks}
                                />

                                <SummaryCell
                                    label="Overdue tasks"
                                    value={dashboard.summary.overdueTasks}
                                />

                                <SummaryCell
                                    label="Avg. time per completed task"
                                    value={minutesLabel(
                                        dashboard.summary.averageActualMinutes
                                    )}
                                />

                                <SummaryCell
                                    label="Completed tasks due this period"
                                    value={dashboard.summary.completedTasks}
                                />

                                <SummaryCell
                                    label="On-time completion"
                                    value={percent(
                                        dashboard.summary.onTimeRate
                                    )}
                                />

                                <SummaryCell
                                    label="Long overdue (over 24h)"
                                    value={dashboard.summary.longOverdueTasks}
                                />

                                <SummaryCell
                                    label="Completed very late (over 24h)"
                                    value={dashboard.summary.completedVeryLateTasks}
                                />
                            </div>

                            {/* MOST PRODUCTIVE DAY */}

                            <div className="mt-4 rounded-2xl bg-ink p-4 text-white">

                                <p className="text-sm font-semibold">
                                    Most productive day:{" "}
                                    {dashboard.summary.mostProductiveDate ||
                                        "No completed tasks"}
                                </p>

                                <p className="mt-1 text-xs text-white/70">
                                    {dashboard.summary.mostProductiveDate
                                        ? `${minutesLabel(
                                            dashboard.summary.mostProductiveMinutes
                                        )} recorded on completed tasks`
                                        : "No completed-task time has been recorded in this period."}
                                </p>

                            </div>
                        </section>
                    </div>
                </>
            )}

            {/* NO DATA */}

            {!loading && !dashboard && !error && (
                <EmptyChart message="No analytics available." />
            )}

        </div>
    );
}
