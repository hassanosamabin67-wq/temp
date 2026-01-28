"use client";
import { useState } from "react";
import styles from "./KAIPage.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import ActionButton from "@/Components/UIComponents/ActionBtn";

function AnswerBox({ text }: { text: string }) {
    return (
        <div className={styles.markdownDiv}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {text}
            </ReactMarkdown>
        </div>
    );
}

export default function KAIPage() {
    const [input, setInput] = useState("");
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAsk = async () => {
        if (!input.trim()) return;
        setLoading(true);
        setAnswer("");
        setError("");

        try {
            const res = await fetch("/api/kai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: input }),
            });

            const data = await res.json();

            if (data.success) {
                setAnswer(data.answer);
            } else {
                setError(data.error || "Sorry, something went wrong. Please try again.");
            }
            setInput("")
        } catch (err) {
            setError("Failed to connect to K.A.I. Please check your connection and try again.");
            console.error("KAI fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !loading) {
            handleAsk();
        }
    };

    const handleBack = () => {
        window.history.back();
    };

    return (
        <div className={styles.container}>
            <button onClick={handleBack} className={styles.backButton}>
                Back to Platform
            </button>
            <h1 className={styles.title}>K.A.I</h1>
            <p className={styles.subtitle}>Your built-in guide to everything Kaboom.</p>

            <div className={styles.formContainer}>
                <input
                    type="text"
                    placeholder="Ask about setup, pricing, or troubleshooting..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={styles.inputField}
                    maxLength={500}
                    disabled={loading}
                />
                <ActionButton
                    onClick={handleAsk}
                    disabled={loading || !input.trim()}
                    className={styles.button}
                >
                    {loading ? "Thinking..." : "Ask K.A.I"}
                </ActionButton>
            </div>

            {error && (
                <div className={styles.errorContainer} style={{
                    padding: "1rem",
                    marginTop: "1rem",
                    backgroundColor: "#fee",
                    border: "1px solid #fcc",
                    borderRadius: "8px",
                    color: "#c00"
                }}>
                    <p>{error}</p>
                </div>
            )}

            {answer && (
                <div className={styles.resultContainer}>
                    <AnswerBox text={answer} />
                </div>
            )}

            <div className={styles.suggestionContainer}>
                {["How to connect Stripe", "How to create a Collab Room", "Pricing guide"].map((q) => (
                    <button
                        key={q}
                        onClick={() => setInput(q)}
                        className={styles.suggestionButton}
                    >
                        {q}
                    </button>
                ))}
            </div>
        </div>
    );
}