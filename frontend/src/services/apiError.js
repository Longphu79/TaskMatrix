export async function getApiErrorMessage(error) {
    const data = error?.response?.data;
    if (data instanceof Blob) {
        try {
            const body = JSON.parse(await data.text());
            return body.message || body.title || "The request failed.";
        } catch {
            return error?.message || "The request failed.";
        }
    }

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    return (
        data?.message ||
        data?.title ||
        error?.message ||
        "The request failed."
    );
}