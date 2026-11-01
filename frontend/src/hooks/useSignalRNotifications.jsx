// hooks/useSignalRNotifications.js
import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";

export default function useSignalRNotifications() {
    useEffect(() => {
        // Xin quyền hiển thị Browser Notification
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }

        const token = localStorage.getItem("token"); // Hoặc lấy từ AuthContext
        if (!token) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.REACT_APP_API_URL}/hubs/notification`, {
                accessTokenFactory: () => token,
            })
            .withAutomaticReconnect()
            .build();

        connection
            .start()
            .then(() => console.log("✅ SignalR Notification Hub Connected"))
            .catch((err) => console.error("SignalR Connection Error: ", err));

        // Lắng nghe sự kiện từ Worker
        connection.on("ReceiveTaskReminder", (data) => {
            // 1. Browser Push Notification (khi user tab đi chỗ khác)
            if (Notification.permission === "granted") {
                new Notification("⏰ TaskMatrix Deadline Warning", {
                    body: data.message,
                    icon: "/favicon.ico",
                });
            }

            // 2. Hoặc trigger UI Toast (HotToast / Toastify)
            alert(data.message);
        });

        return () => {
            connection.stop();
        };
    }, []);
}
