import React from 'react';
import { Tabs, TabsProps } from 'antd';
import SystemLogs from './SystemLogs';
import FlaggedContent from './FlaggedContent';
import AuditHistory from './AuditHistory';

const PlatformLogsModeration = ({ adminProfile }: any) => {
    const items: TabsProps['items'] = [
        {
            key: "1",
            label: 'System Logs',
            children: <SystemLogs />
        },
        {
            key: '2',
            label: 'Flagged Content',
            children: <FlaggedContent adminProfile={adminProfile} />
        },
        {
            key: '3',
            label: 'Audit History',
            children: <AuditHistory />
        }

    ];

    return (
        <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '32px' }}>
                    <span style={{ fontSize: '28px', display: "block", fontWeight: 'bold', marginBottom: '8px', color: '#262626' }}>Platform Logs & Moderation</span>
                </div>

                {/* Filters and Search */}

                {/* Main Content */}
                <Tabs
                    items={items}
                    indicator={{ size: (origin) => origin - 0, align: "center" }}
                />
            </div>
        </div>
    );
};

export default PlatformLogsModeration;