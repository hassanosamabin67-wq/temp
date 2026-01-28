import Image from "next/image";
import React, { useCallback, useRef } from "react";
import { MdDownload } from "react-icons/md";
import { useWavesurfer } from '@wavesurfer/react'
import { FaCirclePause } from "react-icons/fa6";
import { FaPlay } from "react-icons/fa";
import { IoDocument } from "react-icons/io5";
import './style.css'
import dayjs from "dayjs";

interface MessageProps {
    message: string | null;
    message_type: "text" | "emoji" | "gif" | "file" | "audio" | "video";
    file_url?: string | any;
    isOwnMessage?: any;
    createdAt?: any
}

const MessageRenderer: React.FC<MessageProps> = ({ message, message_type, file_url, isOwnMessage, createdAt }) => {
    const containerRef = useRef(null)

    const { wavesurfer, isPlaying } = useWavesurfer({
        container: containerRef,
        height: 60,
        waveColor: `${isOwnMessage ? "rgb(190, 190, 190)" : "rgb(168, 168, 168)"}`,
        progressColor: `${isOwnMessage ? "rgb(255, 255, 255)" : "#158eff"}`,
        url: file_url,
        width: 250,
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        cursorWidth: 0,
        barHeight: 1
    })

    const onPlayPause = useCallback(() => {
        wavesurfer && wavesurfer.playPause()
    }, [wavesurfer])

    switch (message_type) {
        case "text":
            return <p className={`message ${isOwnMessage ? "owner-message" : ""}`}>{message}</p>;

        case "emoji":
            return <span className="text-3xl">{message}</span>;

        case "gif":
            return (
                <Image
                    src={file_url}
                    alt="Uploaded image"
                    width={200}
                    height={200}
                    style={{ marginTop: 10 }}
                />
            );

        case "file":
            const fileName = file_url?.split('/').pop()?.split('_').slice(1).join('_') || "Download file";
            return (
                <div className="file-uploaded-div">
                    <span className="file-icon"><IoDocument /></span>
                    <div>
                        <span className="file-name-span">{fileName}</span>
                        <span className="file-message-time">{dayjs(createdAt).calendar(null, {
                            sameDay: '[Today] h:mm A',
                            lastDay: '[Yesterday] h:mm A',
                            lastWeek: 'dddd h:mm A',
                            sameElse: 'DD/MM/YYYY h:mm A'
                        })}</span>
                    </div>
                    <a href={file_url || "#"} download target="_blank" rel="noopener noreferrer">
                        <span className="file-download-icon"><MdDownload /></span>
                    </a>
                </div>
            );

        case "audio":
            return (
                <div className="audio-box" style={{ ...(isOwnMessage && { backgroundColor: "#158eff" }) }}>
                    <span className="audio-play-btn" style={{ ...(isOwnMessage && { color: "#158eff", backgroundColor: "#fff" }) }} onClick={onPlayPause}>{isPlaying ? <FaCirclePause /> : <FaPlay />}</span>
                    <div id="audio-root" ref={containerRef} />
                </div >
            );
        case "video":
            return (
                <video controls width={250} style={{ marginTop: 10 }}>
                    <source src={file_url} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )

        default:
            return <p className="text-red-500">Unsupported message type</p>;
    }
};

export default MessageRenderer;