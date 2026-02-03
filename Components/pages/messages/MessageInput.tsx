'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Picker from '@emoji-mart/react'
import { ImAttachment } from "react-icons/im";
import { AiFillAudio } from "react-icons/ai";
import { Dropdown, MenuProps } from 'antd'
import { MdOutlineEmojiEmotions, MdDelete } from "react-icons/md";
import { IoDocument, IoSend } from "react-icons/io5";
import { RiVideoUploadFill } from "react-icons/ri";
import data from '@emoji-mart/data'
import { FaStop, FaPause, FaPlay } from "react-icons/fa6";
import WaveSurfer from 'wavesurfer.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import { PaperClipOutlined, SmileOutlined, SendOutlined, AudioOutlined } from '@ant-design/icons'; // Using Ant icons for consistency with other files or Lucide matches

const MessageInput = ({ replyTo, users, setReplyTo, setAttachedFile, setAudioBlob, newMessage, setNewMessage, sendMessage, attachedFile, conversationId, profileId }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recording, setRecording] = useState(false);
    const waveformRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const recordRef = useRef<any>(null)
    const [isPaused, setIsPaused] = useState(false)
    const [recordTime, setRecordTime] = useState("00:00");
    const [isAudioStop, setIsAudioStop] = useState(false);

    useEffect(() => {
        if (!waveformRef.current) return

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: 'rgb(150,150,150)',
            progressColor: '#158eff',
            height: 40, // Reduced height for smoother fit
            barHeight: 1,
            cursorWidth: 0,
            normalize: true,
        })

        const record = ws.registerPlugin(
            RecordPlugin.create({
                renderRecordedAudio: false,
                scrollingWaveform: false,
                continuousWaveform: true,
                continuousWaveformDuration: 30,
            })
        )

        record.on('record-end', (blob) => {
            setAudioBlob(blob);
        });

        record.on('record-progress', (time: number) => {
            const minutes = String(Math.floor((time % 3600000) / 60000)).padStart(2, '0')
            const seconds = String(Math.floor((time % 60000) / 1000)).padStart(2, '0')
            setRecordTime(`${minutes}:${seconds}`)
        })

        wavesurferRef.current = ws
        recordRef.current = record

        return () => {
            try {
                ws.destroy()
            } catch (e) {
                console.error("Error destroying wavesurfer", e)
            }
        }
    }, [recording]); // Re-init if recording state toggles visibility? user snippet allows dynamic visibility. Ideally init once.

    const startRecording = async () => {
        if (!recordRef.current) return
        const devices = await RecordPlugin.getAvailableAudioDevices()
        await recordRef.current.startRecording({ deviceId: devices[0]?.deviceId })
        setRecording(true)
    }

    const stopRecording = () => {
        if (!recordRef.current) return
        recordRef.current.stopRecording()
        setRecordTime("00:00")
        setIsPaused(false)
        setIsAudioStop(true)
    }

    const pauseRecording = () => {
        if (!recordRef.current) return
        if (recordRef.current.isPaused()) {
            recordRef.current.resumeRecording()
            setIsPaused(false)
        } else {
            recordRef.current.pauseRecording()
            setIsPaused(true)
        }
    }

    const deleteRecording = () => {
        recordRef.current?.stopRecording()
        setRecording(false)
        setRecordTime("00:00")
        setAudioBlob(null);
        setIsPaused(false)
        setIsAudioStop(false)
    };

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: <span onClick={() => { fileInputRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center' }}><IoDocument style={{ marginRight: 5 }} />File</span>,
        },
        {
            key: '2',
            label: <span onClick={() => { fileInputRef.current?.click(); }} style={{ display: 'flex', alignItems: 'center' }}><RiVideoUploadFill style={{ marginRight: 5 }} />Video (mp4)</span>,
        },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachedFile(file);
    };

    const addEmoji = (emoji: any) => {
        setNewMessage((prev: any) => prev + emoji.native);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(profileId, conversationId, setIsAudioStop, setRecording);
        }
    };

    return (
        <div className='message-input-div' style={{ width: '100%' }}>
            {/* Context Previews (Reply, Recording, File) - Positioned absolutely above input usually */}

            {replyTo && (
                <div className="reply-preview">
                    <span>Replying to: <b>@{users[replyTo.sender_id]?.firstName}</b> -
                        {
                            replyTo.message_type === 'text' && replyTo.message
                                ? " " + (replyTo.message.slice(0, 30) + "...")
                                : " Attachment"
                        }
                    </span>
                    <span onClick={() => setReplyTo(null)} style={{ cursor: 'pointer', marginLeft: 10 }}>×</span>
                </div>
            )}

            {attachedFile && (
                <div className='file-preview'>
                    <span className="file-icon" style={{ fontSize: 20 }}><IoDocument /></span>
                    <p style={{ margin: 0, fontSize: 14 }}>{attachedFile.name}</p>
                    <span onClick={() => setAttachedFile(null)} style={{ cursor: 'pointer', marginLeft: 'auto' }}>×</span>
                </div>
            )}

            {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '80px', right: '20px', zIndex: 100 }}>
                    <Picker data={data} onEmojiSelect={addEmoji} theme="light" />
                </div>
            )}

            {recording ? (
                <div className='recording-preview' style={{ borderRadius: 24, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 0 }}>
                    <span style={{ color: "#ff4d4f", fontSize: 20, cursor: 'pointer' }} onClick={deleteRecording}><MdDelete /></span>
                    <div ref={waveformRef} style={{ flex: 1 }} />
                    <span style={{ fontSize: 14, minWidth: 45 }}>{recordTime}</span>

                    {isAudioStop ? (
                        <button
                            className="send-btn"
                            onClick={() => sendMessage(profileId, conversationId, setIsAudioStop, setRecording)}
                        >
                            <SendOutlined />
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: 10 }}>
                            <span onClick={pauseRecording} className='audio-resume-btn' style={{ width: 35, height: 35, fontSize: 14, padding: 0 }}>{isPaused ? <FaPlay /> : <FaPause />}</span>
                            <span onClick={stopRecording} className='audio-stop-btn' style={{ width: 35, height: 35, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaStop /></span>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                    <Dropdown menu={{ items }} trigger={['click']} placement="topRight">
                        <button className="input-action-btn">
                            <PaperClipOutlined style={{ fontSize: 20 }} />
                        </button>
                    </Dropdown>

                    <div className="message-input-wrapper">
                        <input
                            type="text"
                            placeholder="Write a message..."
                            className="message-input"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button className="input-action-btn emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                            <SmileOutlined style={{ fontSize: 20 }} />
                        </button>
                    </div>

                    {newMessage.trim() || attachedFile ? (
                        <button
                            className="send-btn"
                            onClick={() => sendMessage(profileId, conversationId, setIsAudioStop, setRecording)}
                        >
                            <SendOutlined style={{ fontSize: 18, marginLeft: -2 }} />
                        </button>
                    ) : (
                        <button className="input-action-btn" onClick={startRecording}>
                            <AudioOutlined style={{ fontSize: 20 }} />
                        </button>
                    )}
                </div>
            )}

            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
    )
}

export default MessageInput
