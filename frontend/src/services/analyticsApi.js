
import apiClient from "./apiClient";

export const analyticsApi = {
    getOverview: (range) =>
        apiClient.get(
            `/analytics/personal/overview?range=${range}`
        ),

    getActivity: (range) =>
        apiClient.get(
            `/analytics/personal/activity?range=${range}`
        ),

    getDistribution: (range) =>
        apiClient.get(
            `/analytics/personal/distribution?range=${range}`
        ),

    getSummary: (range) =>
        apiClient.get(
            `/analytics/personal/summary?range=${range}`
        ),

    getDashboard: async (range) => {
        const [
            overview,
            activity,
            distribution,
            summary,
        ] = await Promise.all([
            analyticsApi.getOverview(range),
            analyticsApi.getActivity(range),
            analyticsApi.getDistribution(range),
            analyticsApi.getSummary(range),
        ]);

        return {
            overview,
            activity,
            distribution,
            summary,
        };
    },
};
