import React, { FC } from 'react'
import { Popover, Tag } from 'antd';

interface messageReactionProps {
    message: any;
    profileId: string;
    emojis: string[];
    reactionDetail: (message: any) => React.ReactNode;
    toggleReaction: (message: any, type: string) => void;
}
const MessageReaction: FC<messageReactionProps> = ({ message, profileId, reactionDetail, toggleReaction, emojis }) => {
    const allReactions = message.reactions || [];

    const activeReactions = emojis.map((type) => {
        const count = allReactions.filter((r: any) => r.reaction === type).length;
        const isUserReaction = allReactions.some((r: any) => r.user_id === profileId && r.reaction === type);
        return count > 0 ? { type, count, isUserReaction } : null;
    }).filter(Boolean);

    const totalReactions = allReactions.length;

    if (activeReactions.length === 0) return null;

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            {activeReactions.map((reaction, idx) => (
                <Popover key={reaction!.type} content={reactionDetail(message)}>
                    <Tag color='cyan' style={{ borderRadius: 12, fontSize: 14, margin: 0 }} onClick={() => toggleReaction(message, reaction!.type)}>
                        {reaction!.type}
                        {idx === activeReactions.length - 1 && (
                            <span>{totalReactions}</span>
                        )}
                    </Tag>
                </Popover>
            ))}
        </div>
    )
}

export default MessageReaction