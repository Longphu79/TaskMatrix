import { TEAM_DEMO_DOCUMENTS, TEAM_WORKS } from "./teamWorkData.js";

const DOCUMENTS_KEY = "tasky-mock-documents";
const MAX_FILE_SIZE = 1024 * 1024;

const demoDocuments = () => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 3);
    const deadline = new Date(now);
    deadline.setDate(deadline.getDate() + 10);

    return [
        {
            id: crypto.randomUUID(),
            title: "Offline Demo Roadmap",
            fileName: "offline-demo-roadmap.txt",
            format: "TXT",
            category: "Engineering",
            progress: 65,
            workId: "work-preparation",
            taskId: "task-development",
            start: start.toISOString(),
            deadline: deadline.toISOString(),
            size: 44,
            contentType: "text/plain",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            content: "Demo document for offline testing.",
        },
        {
            id: crypto.randomUUID(),
            title: "Offline Design Notes",
            fileName: "offline-design-notes.txt",
            format: "TXT",
            category: "Design",
            progress: 30,
            workId: "work-preparation",
            taskId: "task-documentation",
            start: start.toISOString(),
            deadline: deadline.toISOString(),
            size: 38,
            contentType: "text/plain",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            content: "Design notes for offline testing.",
        },
        {
            id: crypto.randomUUID(),
            title: "Offline Budget Draft",
            fileName: "offline-budget-draft.txt",
            format: "TXT",
            category: "Finance",
            progress: 100,
            workId: "work-requirements",
            taskId: "task-requirement-report",
            start: start.toISOString(),
            deadline: deadline.toISOString(),
            size: 38,
            contentType: "text/plain",
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            content: "Budget draft for offline testing.",
        },
    ];
};

function getUserId() {
    const token = localStorage.getItem("tasky-token");
    if (!token?.startsWith("mock:")) {
        throw createError("Sign in to use offline demo data.", 401);
    }
    return token.slice("mock:".length);
}

function getStorageKey() {
    return `${DOCUMENTS_KEY}:${getUserId()}`;
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem("tasky-user") || "null");
    } catch {
        return null;
    }
}

function getDocuments() {
    const key = getStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
        const user = getCurrentUser();
        const documents = JSON.parse(saved).map((document) => ({
            ...document,
            uploadedBy: document.uploadedBy || user?.name || "Offline Member",
        }));
        localStorage.setItem(key, JSON.stringify(documents));
        return documents;
    }

    const user = getCurrentUser();
    const initial = demoDocuments().map((document) => ({
        ...document,
        uploadedBy: user?.name || "Offline Member",
    }));
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
}

function saveDocuments(documents) {
    localStorage.setItem(getStorageKey(), JSON.stringify(documents));
}

function publicDocument(document) {
    const { content, ...metadata } = document;
    return metadata;
}

function getTeamDocuments() {
    const documents = [...TEAM_DEMO_DOCUMENTS];
    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith(`${DOCUMENTS_KEY}:`)) continue;
        const saved = localStorage.getItem(key);
        if (saved) documents.push(...JSON.parse(saved));
    }
    return documents;
}

function getTeamWorks() {
    const documents = getTeamDocuments();
    const works = TEAM_WORKS.map((work) => ({
        ...work,
        tasks: work.tasks.map((task) => ({
            ...task,
            documents: documents
                .filter((document) => document.workId === work.id && document.taskId === task.id)
                .map((document) => ({
                    ...publicDocument(document),
                    uploadedBy: document.uploadedBy || "Offline Member",
                })),
        })),
    }));
    const assignedIds = new Set(
        TEAM_WORKS.flatMap((work) => work.tasks.map((task) => task.id)),
    );
    const unassignedDocuments = documents
        .filter((document) => !assignedIds.has(document.taskId))
        .map((document) => ({
            ...publicDocument(document),
            uploadedBy: document.uploadedBy || "Offline Member",
        }));

    if (unassignedDocuments.length) {
        works.push({
            id: "work-unassigned",
            key: "—",
            title: "Unassigned uploads",
            assignee: "Team",
            priority: "—",
            status: "Needs assignment",
            tasks: [{
                id: "task-unassigned",
                key: "—",
                title: "Documents without a Work or Task",
                assignee: "Team",
                status: "To Do",
                documents: unassignedDocuments,
            }],
        });
    }
    return works;
}

function createError(message, status) {
    const error = new Error(message);
    error.response = { status, data: { message } };
    return error;
}

function formValue(form, key) {
    const value = form.get(key);
    return value instanceof File ? undefined : value;
}

async function fileContent(file) {
    if (file.size > MAX_FILE_SIZE) {
        throw createError("Offline demo uploads are limited to 1 MB.", 400);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
}

function decodeContent(content) {
    const binary = atob(content || "");
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new Blob([bytes]);
}

function response(data, headers = {}) {
    return Promise.resolve({ data, headers, status: 200 });
}

async function authenticate(url, payload) {
    if (!payload.email?.trim()) {
        throw createError("Email is required.", 400);
    }
    if (url.endsWith("/register") && !payload.password) {
        throw createError("Password is required.", 400);
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.fullName?.trim() || email.split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const userId = `offline-${btoa(email).replace(/[^a-z0-9]/gi, "").slice(0, 20)}`;

    return response({
        token: `mock:${userId}`,
        userId,
        fullName: name,
        email,
        role: "User",
    });
}

async function createDocument(form) {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
        throw createError("Choose a non-empty file to upload.", 400);
    }

    const content = await fileContent(file);
    const now = new Date().toISOString();
    const document = {
        id: crypto.randomUUID(),
        title: String(formValue(form, "title") || ""),
        fileName: file.name,
        format: file.name.split(".").pop()?.toUpperCase() || "",
        category: String(formValue(form, "category") || ""),
        progress: Number(formValue(form, "progress") || 0),
        workId: String(formValue(form, "workId") || ""),
        taskId: String(formValue(form, "taskId") || ""),
        uploadedBy: getCurrentUser()?.name || "Offline Member",
        start: new Date(String(formValue(form, "start"))).toISOString(),
        deadline: new Date(String(formValue(form, "deadline"))).toISOString(),
        size: file.size,
        contentType: file.type || "application/octet-stream",
        createdAt: now,
        updatedAt: now,
        content,
    };

    const documents = getDocuments();
    saveDocuments([document, ...documents]);
    return response(publicDocument(document));
}

const mockApi = {
    async get(url, config = {}) {
        if (url === "/documents") {
            return response(getDocuments().map(publicDocument));
        }
        if (url === "/team/works") {
            getUserId();
            return response(getTeamWorks());
        }

        const downloadMatch = /^\/documents\/([^/]+)\/download$/.exec(url);
        if (downloadMatch) {
            const document = getTeamDocuments().find((item) => item.id === downloadMatch[1]);
            if (!document) throw createError("Document not found.", 404);
            return response(decodeContent(document.content), {
                "content-disposition": `attachment; filename="${document.fileName}"`,
                "content-type": document.contentType,
            });
        }

        const documentMatch = /^\/documents\/([^/]+)$/.exec(url);
        if (documentMatch) {
            const document = getDocuments().find((item) => item.id === documentMatch[1]);
            if (!document) throw createError("Document not found.", 404);
            return response(publicDocument(document));
        }

        if (config.responseType === "blob") {
            throw createError("Offline demo endpoint not found.", 404);
        }
        throw createError("Offline demo endpoint not found.", 404);
    },

    async post(url, payload) {
        if (url === "/auth/login" || url === "/auth/register") {
            return authenticate(url, payload);
        }
        if (url === "/documents") {
            return createDocument(payload);
        }
        throw createError("Offline demo endpoint not found.", 404);
    },

    async put(url, form) {
        const match = /^\/documents\/([^/]+)$/.exec(url);
        if (!match) throw createError("Offline demo endpoint not found.", 404);

        const documents = getDocuments();
        const index = documents.findIndex((item) => item.id === match[1]);
        if (index < 0) throw createError("Document not found.", 404);

        const updated = {
            ...documents[index],
            title: String(formValue(form, "title") || ""),
            category: String(formValue(form, "category") || ""),
            progress: Number(formValue(form, "progress") || 0),
            workId: String(formValue(form, "workId") || documents[index].workId || ""),
            taskId: String(formValue(form, "taskId") || documents[index].taskId || ""),
            start: new Date(String(formValue(form, "start"))).toISOString(),
            deadline: new Date(String(formValue(form, "deadline"))).toISOString(),
            updatedAt: new Date().toISOString(),
        };
        documents[index] = updated;
        saveDocuments(documents);
        return response(publicDocument(updated));
    },

    async patch(url, payload) {
        const match = /^\/documents\/([^/]+)\/progress$/.exec(url);
        if (!match) throw createError("Offline demo endpoint not found.", 404);
        if (!Number.isInteger(payload.progress) || payload.progress < 0 || payload.progress > 100) {
            throw createError("Progress must be between 0 and 100.", 400);
        }

        const documents = getDocuments();
        const index = documents.findIndex((item) => item.id === match[1]);
        if (index < 0) throw createError("Document not found.", 404);
        documents[index] = {
            ...documents[index],
            progress: payload.progress,
            updatedAt: new Date().toISOString(),
        };
        saveDocuments(documents);
        return response(publicDocument(documents[index]));
    },

    async delete(url) {
        const match = /^\/documents\/([^/]+)$/.exec(url);
        if (!match) throw createError("Offline demo endpoint not found.", 404);

        const documents = getDocuments();
        const remaining = documents.filter((item) => item.id !== match[1]);
        if (remaining.length === documents.length) {
            throw createError("Document not found.", 404);
        }
        saveDocuments(remaining);
        return response(null);
    },
};

export default mockApi;
