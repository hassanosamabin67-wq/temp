import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Button, Tag, Space, Tooltip, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { IoFlagOutline } from "react-icons/io5";
import dayjs from 'dayjs';
import style from './style.module.css'
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { logContentAction } from '@/utils/PlatformLogging';

const ContractToolsUsage = () => {
    const [contractData, setContractData] = useState<any>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const { notify } = useNotification();

    const handleFetchContractData = async () => {
        try {
            setDataLoading(true);

            const { data: contracts, error: contractError } = await supabase
                .from('contract_tool_usage')
                .select("*");

            if (contractError) {
                console.error("Error Fetching Contracts: ", contractError);
                return;
            }

            const userIds = [...new Set(contracts.map((contract) => contract.user))];

            const { data: rooms, error: roomError } = await supabase
                .from('thinktank')
                .select("id, end_datetime");

            if (roomError) {
                console.error("Error fetching thinktanks: ", roomError);
                return;
            }

            const { data: userData, error: userFetchError } = await supabase
                .from('users')
                .select("userId, userName, firstName, lastName, email")
                .in('userId', userIds)

            if (userFetchError) {
                console.error("Error fetching users: ", userFetchError);
                return;
            }

            const roomEndMap = rooms?.reduce((map, room) => {
                map[room.id] = room.end_datetime;
                return map;
            }, {} as Record<string, string>);

            const currentDate = new Date();

            const userMap = new Map();
            userData.forEach((user) => {
                userMap.set(user.userId, user)
            })

            const enrichedContracts = contracts.map(contract => {
                let computedStatus = contract.status;

                if (roomEndMap && roomEndMap[contract.for]) {
                    const endDate = new Date(roomEndMap[contract.for]);
                    if (contract.status === "Active" && endDate <= currentDate) {
                        computedStatus = "Completed";
                    }
                }

                return {
                    ...contract,
                    userData: userMap.get(contract.user),
                    projectId: contract.for,
                    projectName: contract.project,
                    associatedPayment: contract.payment ? `$${contract.payment}` : "$0.00",
                    currentStatus: computedStatus,
                    timestamp: contract.created_at
                };
            });

            setContractData(enrichedContracts);
        } catch (err) {
            console.error("Unexpected Error While Fetching Contracts: ", err);
        } finally {
            setDataLoading(false);
        }
    };

    const handleFlagContract = async (contractId: string, flagged: boolean, userName: string, userId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('contract_tool_usage')
                .update({ is_flagged: !flagged })
                .eq("id", contractId);

            if (updateError) {
                notify({ type: "error", message: flagged ? "Error: Unable to remove flag from the contract." : `Error: Unable to flag the contract: ${updateError}` });
                console.error("Error updating contract flag status: ", updateError);
                return;
            }

            logContentAction.onFlag(flagged, contractId, "Contract", userName, userId, undefined, "contract")
            notify({ type: "success", message: flagged ? "Contract unflagged successfully." : "Contract flagged successfully." });

            handleFetchContractData(); // refresh data
        } catch (err) {
            console.error("Unexpected error: ", err);
        }
    };

    useEffect(() => {
        handleFetchContractData();
    }, [])

    const contractUsageData = contractData.map((contract: any) => ({
        key: contract.id,
        userName: contract.userData?.userName || `${contract.userData.firstName} ${contract.userData.lastName}`,
        userId: contract.userData?.userId,
        userEmail: contract.userData?.email,
        contractType: contract.contract_type,
        projectName: contract.projectName,
        projectId: contract.projectId,
        associatedPayment: contract.associatedPayment,
        status: contract.currentStatus,
        timestamp: contract.timestamp,
        flagged: contract.is_flagged === true
    }))

    const contractActivityColumns = [
        {
            title: 'User Info',
            dataIndex: 'userName',
            key: 'userName',
            width: 200,
            render: (text: any, record: any) => (
                <div>
                    <div>
                        <span className={style.userName}>{text}</span>
                        <span className={style.userEmail}>{record.userEmail}</span>
                        <span className={style.userId}>ID: {record.userId}</span>
                    </div>

                    {record.flagged && (
                        <div className={style.flaggedDiv}>
                            <Tag color="red" icon={<ExclamationCircleOutlined />}>
                                Flagged
                            </Tag>
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: 'Contract Type',
            dataIndex: 'contractType',
            key: 'contractType',
            width: 130,
            render: (type: any) => {
                const colors: Record<string, string> = {
                    'NDA': 'blue',
                    'Work-for-Hire': 'green',
                    'Service-Agreement': 'orange',
                    'License Agreement': 'purple'
                };
                return <Tag color={colors[type]}>{type}</Tag>;
            }
        },
        {
            title: 'Project',
            dataIndex: 'projectName',
            key: 'projectName',
            width: 180,
            render: (text: any, record: any) => (
                <div>
                    <div className={style.projectName}>{text}</div>
                    <div className={style.projectId}>{record.projectId}</div>
                </div>
            )
        },
        {
            title: 'Payment',
            dataIndex: 'associatedPayment',
            key: 'associatedPayment',
            width: 100,
            render: (payment: any) => (
                <span style={{
                    color: payment === '$0.00' ? '#666' : '#52c41a',
                    fontWeight: payment === '$0.00' ? 'normal' : 'bold'
                }}>
                    {payment}
                </span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: any) => {
                const statusConfig: Record<any, any> = {
                    completed: { color: 'success', text: 'Completed' },
                    pending: { color: 'processing', text: 'Pending' },
                    active: { color: 'warning', text: 'Active' },
                    flagged: { color: 'error', text: 'Flagged' },
                    rejected: { color: 'error', text: 'Rejected' }
                };
                const config = statusConfig[status?.toLowerCase()];
                return config ? (
                    <Badge status={config.color} text={config.text} />
                ) : (
                    <Badge status="default" text={status} />
                );
            }
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 100,
            render: (timestamp: any) => (
                <div>
                    <div>{dayjs(timestamp).format('MMM DD, YYYY')}</div>
                    <div className={style.timestamp}>
                        {dayjs(timestamp).format('HH:mm:ss')}
                    </div>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_: any, record: any) => (
                <Space>
                    <Tooltip title={record.flagged ? "Unflag Contract" : "Flag Contract"}>
                        <Button
                            size="small"
                            icon={<IoFlagOutline />}
                            type={record.flagged ? "primary" : "default"}
                            danger={record.flagged}
                            onClick={() => handleFlagContract(record.key, record.flagged, record.userName, record.userId)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    return (
        <div className={style.container}>
            {/* Header */}
            <div className={style.header}>
                <span className={style.headerHeading}>Contract Tools Usage</span>
            </div>
            {/* Main Content Tabs */}
            <Card>
                <Table
                    columns={contractActivityColumns}
                    dataSource={contractUsageData}
                    loading={dataLoading}
                    scroll={{ x: 1200 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} contract activities`
                    }}
                />
            </Card>
        </div>
    );
};

export default ContractToolsUsage;