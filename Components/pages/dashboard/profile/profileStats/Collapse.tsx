import type { CSSProperties } from 'react';
import React from 'react';
import { CaretRightOutlined } from '@ant-design/icons';
import type { CollapseProps } from 'antd';
import { Collapse, theme } from 'antd';

interface CollapseComponentProps {
    ordersByStatus: {
        pending: any[];
        accepted: any[];
        approved: any[];
        rejected: any[];
    };
}

const CollapseComponent: React.FC<CollapseComponentProps> = ({ ordersByStatus }) => {
    const { token } = theme.useToken();

    const panelStyle: React.CSSProperties = {
        marginBottom: 24,
        background: '#a7a7a761',
        borderRadius: token.borderRadiusLG,
        border: "none",
        fontSize: 15,
        fontWeight: 500
    };

    const items: CollapseProps['items'] = [
        {
            key: '1',
            label: 'Active Projects',
            children: (
                <p style={{ fontWeight: "normal" }}>
                    {ordersByStatus.accepted.length > 0
                        ? `${ordersByStatus.accepted.length} ${ordersByStatus.accepted.length > 1 ? 'Active Projects' : 'Active Project'}`
                        : 'No data'}
                </p>
            ),
            style: panelStyle,
        },
        {
            key: '2',
            label: 'Completed Projects',
            children: (
                <p style={{ fontWeight: "normal" }}>
                    {ordersByStatus.approved.length > 0
                        ? `${ordersByStatus.approved.length} ${ordersByStatus.approved.length > 1 ? 'Projects Completed' : 'Project Completed'}`
                        : 'No data'}
                </p>
            ),
            style: panelStyle,
        },
        {
            key: '3',
            label: 'Pending Projects',
            children: (
                <p style={{ fontWeight: "normal" }}>
                    {ordersByStatus.pending.length > 0
                        ? `${ordersByStatus.pending.length} ${ordersByStatus.pending.length > 1 ? 'Projects Pending' : 'Project Pending'}`
                        : 'No data'}
                </p>
            ),
            style: panelStyle,
        },
        {
            key: '4',
            label: 'Rejected Projects',
            children: (
                <p style={{ fontWeight: "normal" }}>
                    {ordersByStatus.rejected.length > 0
                        ? `${ordersByStatus.rejected.length} ${ordersByStatus.rejected.length > 1 ? 'Projects Rejected' : 'Project Rejected'}`
                        : 'No data'}
                </p>
            ),
            style: panelStyle,
        },
    ];

    return (
        <Collapse
            bordered={false}
            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
            style={{ background: token.colorBgContainer }}
            items={items}
        />
    );
};

export default CollapseComponent;