import React from 'react';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import Image from 'next/image';
import userImg from '@/public/assets/img/userImg.webp'

interface TabProps {
    participants: Array<any>;
    messages: Array<any>;
}

const Tab: React.FC<TabProps> = ({ participants, messages }) => {
    const participantContent = (
        participants && participants.map((participant) => (
            <div key={participant.id} className="participants">
                <Image className='user-image' src={participant.profileImg || userImg} alt='userImg' width={100} height={100} />
                <span className='user-name'>{participant.name}</span>
            </div>
        ))
    );

    const messageContent = (
        messages && messages.map((message, index) => (
            <div key={index} className='participants'>
                <Image className='user-image' src={message.profileImg || userImg} alt='userImg' width={100} height={100} />
                <div>
                    <span className='user-name'>{message.userName}</span>
                    <p className='user-message'>{message.text}</p>
                </div>
            </div>
        ))
    );

    const items: TabsProps['items'] = [
        { key: '1', label: 'Participants', children: participantContent },
        { key: '2', label: 'Comments', children: messageContent }
    ];

    return (
        <Tabs
            defaultActiveKey="1"
            items={items}
            indicator={{ size: (origin) => origin - 20, align: "center" }}
            centered
        />
    );
};

export default Tab;