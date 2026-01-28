"use client";
import { useState } from "react";
import styles from "./KAIFloatingWidget.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import Image from "next/image";
import kaiLogo from '@/public/assets/img/kai-logo.png';
import { CloseOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import ActionButton from "../UIComponents/ActionBtn";

function AnswerBox({ text }: { text: string }) {
    return (
        <div className={styles.markdownDiv}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {text}
            </ReactMarkdown>
        </div>
    );
}

export default function KAIFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
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

    const toggleWidget = () => {
        setIsOpen(!isOpen);
        // Clear previous state when opening
        if (!isOpen) {
            setAnswer("");
            setError("");
            setInput("");
        }
    };

    return (
        <>
            {/* Floating Button */}
            <Tooltip
                title="Ask K.A.I — your built-in guide to everything Kaboom."
                placement="bottom"
                classNames={{ root: "kai-tooltip" }}
                mouseEnterDelay={0.15}
                mouseLeaveDelay={0.15}
            >
                <div className={styles.floatingButton} onClick={toggleWidget}>
                    <Image src={kaiLogo} alt="K.A.I" width={32} height={32} />
                </div>
            </Tooltip>

            {/* Modal Overlay */}
            {isOpen && (
                <>
                    <div className={styles.overlay} onClick={toggleWidget} />
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <div className={styles.modalTitle}>
                                <Image src={kaiLogo} alt="K.A.I" width={24} height={24} />
                                <span>K.A.I</span>
                            </div>
                            <button className={styles.closeButton} onClick={toggleWidget}>
                                <CloseOutlined />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
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
                                <div className={styles.errorContainer}>
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
                    </div>
                </>
            )}
        </>
    );
}
