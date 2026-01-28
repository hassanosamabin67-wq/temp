import React, { FC } from 'react'
import { formatTime } from '@/lib/formatTime'
import { FaUser } from "react-icons/fa";

interface floatingProps {
    timeLeft: number;
    totalParticipant: any;
}

const FloatingStats: FC<floatingProps> = ({ timeLeft, totalParticipant }) => {
    return (
        <>
            <div className="float-box" style={{ position: "absolute", top: 10, right: 20 }}>
                {formatTime(timeLeft)} left
            </div>
            <div className="float-box" style={{ position: "absolute", top: 10, left: 20 }}>
                <FaUser /> {totalParticipant.length}
            </div>
        </>
    )
}

export default FloatingStats