'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Picker from '@emoji-mart/react'
import { ImAttachment } from "react-icons/im";
import { AiFillAudio } from "react-icons/ai";
import { Dropdown, Input, MenuProps } from 'antd'
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { IoDocument } from "react-icons/io5";
import { RiVideoUploadFill } from "react-icons/ri";
import data from '@emoji-mart/data'
import { FaStop, FaPause, FaPlay } from "react-icons/fa6";
import WaveSurfer from 'wavesurfer.js'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import { MdDelete } from "react-icons/md";
import { IoSend } from "react-icons/io5";

const MessageInput = ({ replyTo, users, setReplyTo, setAttachedFile, setAudioBlob, newMessage, setNewMessage, sendMessage, attachedFile, conversationId, profileId }: any) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [recording, setRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const waveformRef = useRef<HTMLDivElement>(null)
    const wavesurferRef = useRef<WaveSurfer | null>(null)
    const recordRef = useRef<any>(null)
    const [isPaused, setIsPaused] = useState(false)
    const [recordTime, setRecordTime] = useState("00:00");
    const [isAudioStop, setIsAudioStop] = useState(false);
    const containerRef = useRef(null)

    useEffect(() => {
        if (!waveformRef.current) return

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: 'rgb(150,150,150)',
            progressColor: '#158eff',
            height: 60,
            barHeight: 1,
            cursorWidth: 0
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
            ws.destroy()
        }
    }, []);

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
        recordRef.current.stopRecording()
        setRecording(false)
        setRecordTime("00:00")
        setAudioBlob(null);
        setIsPaused(false)
        setIsAudioStop(false)
    };

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: <span onClick={() => fileInputRef.current?.click()}><IoDocument style={{ marginRight: 5 }} />File</span>,
        },
        {
            key: '2',
            label: <span onClick={() => fileInputRef.current?.click()}><RiVideoUploadFill style={{ marginRight: 5 }} />Video (mp4)</span>,
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

    return (
        <div className='message-input-div'>
            {replyTo && (
                <div className="reply-preview">
                    <span>Replying to: @{users[replyTo.sender_id]?.firstName} -
                        {
                            replyTo.message_type === 'text' && replyTo.message
                                ? replyTo.message.slice(0, 50) + "..."
                                : replyTo.message_type === 'audio'
                                    ? "🎤 Voice message"
                                    : replyTo.message_type === 'file'
                                        ? "📎 File attachment"
                                        : replyTo.message_type === 'video'
                                            ? "📹 Video message"
                                            : replyTo.message_type === 'gif'
                                                ? "GIF image"
                                                : "Original message"
                        }
                    </span>
                    <span onClick={() => setReplyTo(null)} style={{ cursor: 'pointer' }}>×</span>
                </div>
            )}
            <div className='recording-preview' style={{ display: recording ? 'flex' : 'none', justifyContent: "space-between", alignItems: "center", gap: 40 }}>
                <div style={{ display: 'flex', gap: 20, justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <span style={{ color: "red", fontSize: 20 }} onClick={deleteRecording}><MdDelete /></span>
                    <div ref={waveformRef} style={{ width: 400, height: 60 }} />
                    {isAudioStop ? (
                        <div style={{ display: "flex", justifyContent: "flex-end", width: "30%", }}>
                            <span style={{ color: "#fff", cursor: "pointer", padding: 12, fontSize: 20, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "100%", backgroundColor: "blue" }} onClick={() => sendMessage(profileId, conversationId, setIsAudioStop, setRecording)}><IoSend /></span>
                        </div>
                    ) : (
                        <>
                            <div>
                                <span onClick={pauseRecording} className='audio-resume-btn'>{isPaused ? <FaPlay /> : <FaPause />}</span>
                            </div>
                            <p style={{ margin: '5px 0', fontSize: 14 }}>{recordTime}</p>
                        </>
                    )}
                </div>
                {!isAudioStop && (
                    <div className='start-pause-btn'>
                        <span onClick={stopRecording} className='audio-stop-btn'><FaStop /></span>
                    </div>
                )}
            </div>
            {showEmojiPicker && (
                <div style={{ position: 'absolute', bottom: '60px', zIndex: 10 }}>
                    <Picker data={data} onEmojiSelect={addEmoji} />
                </div>
            )}
            {attachedFile && (
                <div className='file-preview'>
                    <span className="file-icon"><IoDocument /></span>
                    <p>{attachedFile.name}</p>
                    <span onClick={() => setAttachedFile(null)} style={{ cursor: 'pointer', position: "absolute", right: 15, top: 0, fontSize: 25 }}>×</span>
                </div>
            )}
            <Input className='input-box' inputMode='text' placeholder='Write a message' prefix={
                <>
                    <MdOutlineEmojiEmotions onClick={() => setShowEmojiPicker(!showEmojiPicker)} className='emoji-icon' />
                    <Dropdown menu={{ items }} trigger={['click']} placement="topRight">
                        <span style={{ cursor: 'pointer', display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <ImAttachment />
                        </span>
                    </Dropdown>
                </>
            }
                suffix={
                    <>
                        {!recording && <span onClick={startRecording} style={{ cursor: "pointer" }}><AiFillAudio /></span>}
                        {newMessage.trim() && <span style={{ color: "#fff", cursor: "pointer", padding: 7, display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "100%", backgroundColor: "blue" }} onClick={() => sendMessage(profileId, conversationId, setIsAudioStop, setRecording)}><IoSend /></span>}
                    </>
                } value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onPressEnter={() => sendMessage(profileId, conversationId, setIsAudioStop, setRecording)} />
            <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} />
        </div>
    )
}

export default MessageInput