import React, { FC } from 'react';
import { FaChalkboardUser } from "react-icons/fa6";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import styles from './styles.module.css';
import { useAppSelector } from '@/store';
import { IoCall } from "react-icons/io5";
import { SlOptions } from "react-icons/sl";
import { LuCameraOff } from "react-icons/lu";
import { BsCameraFill } from "react-icons/bs";
import { Dropdown } from 'antd';
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";
import { formatTime } from '@/lib/formatTime';

const Controls: FC<VIDEO_CALL_CONTROLS> = ({
    micOn,
    setMic,
    cameraOn,
    setCamera,
    screenSharing,
    toggleScreenShare,
    calling,
    handleEndCall,
    setCalling,
    showWhiteBoard,
    setShowWhiteBoard,
    currentLiveStatus,
    handleLockRoom,
    showWhiteboardButton = true,
    showLockButton = true,
    channelID = "9078234kjhrwer",
    duration = "0: 15"
}) => {
    const profile = useAppSelector((state) => state.auth);

    return (
        <div className={styles.videoControlMain}>
            <div className={styles.videoControlDiv}>
                <div className={`${styles.meetingInfo} ${styles.meetingInfoWeb}`}>
                    <span>Meeting ID: {channelID}</span>
                    <span>Duration: {formatTime(Number(duration))}</span>
                </div>
                <div className={styles.videoControlIcons}>
                    {typeof micOn !== "undefined" && setMic && (
                        <button className={`${styles.videoIcons} ${micOn ? styles.activeVideoIcon : ""}`} onClick={() => setMic((prev) => !prev)}>
                            {micOn ? <BsMicFill /> : <BsMicMuteFill />}
                        </button>
                    )}

                    {typeof cameraOn !== "undefined" && setCamera && (
                        <button className={`${styles.videoIcons} ${cameraOn ? styles.activeVideoIcon : ""}`} onClick={() => setCamera((prev) => !prev)}>
                            {cameraOn ? <BsCameraFill /> : <LuCameraOff />}
                        </button>
                    )}

                    {(handleEndCall || setCalling) && (
                        <button
                            className={`${styles.videoIcons}`}
                            style={{ backgroundColor: "red", color: "white" }}
                            onClick={calling ? handleEndCall : () => setCalling?.((prev) => !prev)}
                        >
                            <IoCall />
                        </button>
                    )}
                </div>
                <div className={styles.menuContainer}>
                    <Dropdown menu={{
                        items: [
                            ...(showLockButton && handleLockRoom
                                ? [{
                                    key: "lock_room",
                                    label: currentLiveStatus === 'lock' ? 'Locked' : 'Lock Room',
                                    onClick: handleLockRoom,
                                    icon: (
                                        <span className={`${styles.menuIcon} ${currentLiveStatus === "lock" ? styles.activeMenuIcon : ""}`}>
                                            <FaLock />
                                        </span>
                                    )
                                }]
                                : []),
                            ...(showWhiteboardButton && setShowWhiteBoard
                                ? [{
                                    key: "show_whiteboard",
                                    label: 'Show Whiteboard',
                                    onClick: () => setShowWhiteBoard((prev) => !prev),
                                    icon: (
                                        <span className={`${styles.menuIcon} ${showWhiteBoard ? styles.activeMenuIcon : ""}`}>
                                            <FaChalkboardUser />
                                        </span>
                                    )
                                }]
                                : []),
                            ...(toggleScreenShare
                                ? [{
                                    key: "toggle_screen_share",
                                    label: 'Share Screen',
                                    onClick: () => toggleScreenShare({ userId: profile.profileId!, name: profile.firstName! }),
                                    icon: (
                                        <span className={`${styles.menuIcon} ${screenSharing ? styles.activeMenuIcon : ""}`}>
                                            {screenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
                                        </span>
                                    )
                                }] : [])
                        ]
                    }}
                        trigger={['click']}
                    >
                        <button className={styles.menuBtn}><SlOptions /></button>
                    </Dropdown>
                </div>
            </div>
            <div className={`${styles.meetingInfo} ${styles.meetingInfoMobile}`}>
                <span>Meeting ID: {channelID}</span>
                <span>Duration: {formatTime(Number(duration))}</span>
            </div>
        </div>
    );
};

export default Controls;