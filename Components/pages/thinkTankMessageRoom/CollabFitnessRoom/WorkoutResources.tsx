import React, { useState } from "react";
import styles from './styles.module.css'
import { FitnessFileRecord } from "@/utils/fitnessRoom";
import { useNotification } from "@/Components/custom/custom-notification";
import { Modal } from 'antd';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import FitnessFilePaymentForm from './FitnessFilePaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function WorkoutResources({ files, hostId }: { files: FitnessFileRecord[], hostId?: string }) {
  const { notify } = useNotification();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FitnessFileRecord | null>(null);

  const handleDownload = async (file: FitnessFileRecord) => {
    if (file.is_paid) {
      setSelectedFile(file);
      setShowPaymentModal(true);
      return;
    }

    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      notify({ type: "error", message: "Error downloading file. Please try again later." });
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedFile(null);

    // Download the file after successful payment
    if (selectedFile) {
      const downloadFile = async () => {
        try {
          const response = await fetch(selectedFile.file_url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = selectedFile.name;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error downloading file:", error);
          notify({ type: "error", message: "Error downloading file. Please try again later." });
        }
      };
      downloadFile();
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    setSelectedFile(null);
  };

  return (
    <div className={styles.card} style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 16 }}>📚 Workout Resources</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {files.map((file) => (
          <div key={file.id} className={styles.resourceCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>
                    {file.type === "workout" ? "💪" : file.type === "meal_plan" ? "🥗" : "📋"}
                  </span>
                  <h3 style={{ fontWeight: 800, color: "#111827", fontSize: 15 }}>{file.name}</h3>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ padding: "4px 8px", background: "#f3f4f6", color: "#374151", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                    {file.type.replace("_", " ").toUpperCase()}
                  </span>
                  {file.is_paid ? (
                    <span style={{ padding: "4px 8px", background: "#ecfdf5", color: "#16a34a", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                      ${file.price}
                    </span>
                  ) : (
                    <span style={{ padding: "4px 8px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, fontSize: 12, fontWeight: 800 }}>
                      FREE
                    </span>
                  )}
                </div>
                {file.file_size && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    {(file.file_size / 1024 / 1024).toFixed(1)} MB
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDownload(file)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                background: file.is_paid ? "#16a34a" : "#2563eb",
                color: "white"
              }}
            >
              {file.is_paid ? "💳 Purchase & Download" : "⬇️ Download"}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      <Modal
        title="Purchase File"
        open={showPaymentModal}
        onCancel={handlePaymentCancel}
        footer={null}
        width={600}
        centered
      >
        {selectedFile && hostId && (
          <Elements
            stripe={stripePromise}
            options={{
              mode: 'payment',
              amount: Math.round((selectedFile.price || 0) * 100),
              currency: 'usd',
            }}
          >
            <FitnessFilePaymentForm
              file={selectedFile}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              hostId={hostId}
            />
          </Elements>
        )}
      </Modal>
    </div>
  );
}