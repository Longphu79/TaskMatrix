// components/VerifyProofModal.jsx
import React, { useState } from "react";
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../services/apiClient";

export default function VerifyProofModal({ task, onClose, OnSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleVerify = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("proofImage", file);

        setLoading(true);
        setResult(null);

        try {
            const res = await api.post(
                `/aiagent/verify-completion/${task.id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                },
            );

            setResult(res.data);
            if (res.data.success && OnSuccess) {
                OnSuccess(task.id);
            }
        } catch (err) {
            setResult({
                success: false,
                reasoning: "Có lỗi kết nối tới máy chủ AI.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-lg font-bold text-gray-800">
                    Xác thực hoàn thành: {task.title}
                </h3>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="proof-upload"
                    />
                    <label
                        htmlFor="proof-upload"
                        className="cursor-pointer flex flex-col items-center"
                    >
                        {preview ? (
                            <img
                                src={preview}
                                alt="Proof"
                                className="max-h-48 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="py-6 text-gray-400 flex flex-col items-center">
                                <Camera className="w-10 h-10 mb-2" />
                                <span className="text-sm">
                                    Tải lên hình ảnh bằng chứng (Ảnh chụp màn
                                    hình, ảnh thực tế...)
                                </span>
                            </div>
                        )}
                    </label>
                </div>

                {result && (
                    <div
                        className={`p-3 rounded-xl text-sm flex items-start gap-2 ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                    >
                        {result.success ? (
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 shrink-0" />
                        )}
                        <div>
                            <p className="font-semibold">{result.message}</p>
                            <p className="text-xs mt-1 opacity-90">
                                {result.reasoning}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleVerify}
                        disabled={!file || loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        Xác thực bằng AI
                    </button>
                </div>
            </div>
        </div>
    );
}
