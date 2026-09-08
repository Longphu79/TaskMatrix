const base = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

export function GridIcon(p) {
    return (
        <svg {...base} {...p}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

export function ChartIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M4 19V5" />
            <path d="M4 15l4-4 4 3 6-7" />
            <path d="M14 7h4v4" />
        </svg>
    );
}

export function ClockIcon(p) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 2.5" />
        </svg>
    );
}

export function ListIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M8 6h12" />
            <path d="M8 12h12" />
            <path d="M8 18h12" />
            <circle cx="4" cy="6" r="1" />
            <circle cx="4" cy="12" r="1" />
            <circle cx="4" cy="18" r="1" />
        </svg>
    );
}

export function FileIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M6 3h8l4 4v14H6z" />
            <path d="M14 3v4h4" />
            <path d="M9 13h6M9 17h6" />
        </svg>
    );
}

export function SettingsIcon(p) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
        </svg>
    );
}

export function BellIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
    );
}

export function SearchIcon(p) {
    return (
        <svg {...base} {...p}>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}

export function PlayIcon(p) {
    return (
        <svg {...base} fill="currentColor" stroke="none" {...p}>
            <path d="M8 5.5v13l11-6.5z" />
        </svg>
    );
}

export function PauseIcon(p) {
    return (
        <svg {...base} fill="currentColor" stroke="none" {...p}>
            <rect x="7" y="5" width="3.5" height="14" rx="1" />
            <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
        </svg>
    );
}

export function FolderIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
    );
}

export function MoreIcon(p) {
    return (
        <svg {...base} {...p}>
            <circle cx="12" cy="5" r="1.4" />
            <circle cx="12" cy="12" r="1.4" />
            <circle cx="12" cy="19" r="1.4" />
        </svg>
    );
}

export function ChevronDownIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

export function MenuIcon(p) {
    return (
        <svg {...base} {...p}>
            <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
    );
}

export const UserIcon = (p) => (
    <svg {...base} {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
);

export const CogIcon = (p) => (
    <svg {...base} {...p}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L3.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h5l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" />
    </svg>
);

export const ThemeIcon = (p) => (
    <svg {...base} {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
    </svg>
);

export const KeyboardIcon = (p) => (
    <svg {...base} {...p}>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
);

export const HelpIcon = (p) => (
    <svg {...base} {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" />
    </svg>
);

export const LogoutIcon = (p) => (
    <svg {...base} {...p}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
);

export const ChevronDown = (p) => (
    <svg {...base} {...p}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);
