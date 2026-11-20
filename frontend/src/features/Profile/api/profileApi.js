import apiClient from "../../../services/apiClient";

export const profileApi = {
    getMyProfile: () => apiClient.get("/profile/me"),
    updateMyProfile: (profile) => apiClient.put("/profile/me", profile),
};
