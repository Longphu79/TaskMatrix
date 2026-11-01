import axios from "axios";

export const reportApi = {
    export: async (report) => {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5045/api"}/reports/export`,
            report,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                responseType: "blob",
            },
        );
        return response.data;
    },
};
