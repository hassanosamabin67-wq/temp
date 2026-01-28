import React from "react";
import styles from './styles.module.css'
import { PrivateUploadRecord } from "@/utils/fitnessRoom";
import { useNotification } from "@/Components/custom/custom-notification";

export default function PrivateUploads({ uploads }: { uploads: PrivateUploadRecord[] }) {
  const { notify } = useNotification();

  if (!uploads.length) return null;

  const handleView = async (upload: PrivateUploadRecord) => {
    try {
      const response = await fetch(upload.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = upload.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      notify({ type: "error", message: "Error downloading file. Please try again later." });
    }
  };

  return (
    <div className={styles.card} style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 12 }}>🔒 Private Uploads from Clients</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {uploads.map((upload) => (
          <div key={upload.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: 700, color: "#111827" }}>{upload.name}</p>
              <p style={{ fontSize: 12, color: "#6b7280" }}>{new Date(upload.created_at ?? Date.now()).toLocaleString()}</p>
              {upload.file_size && (
                <p style={{ fontSize: 11, color: "#6b7280" }}>
                  {(upload.file_size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
            <button
              onClick={() => handleView(upload)}
              style={{ padding: "8px 12px", background: "#7c3aed", color: "white", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}