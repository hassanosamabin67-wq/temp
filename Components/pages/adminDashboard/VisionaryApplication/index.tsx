'use client'
import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '@/config/supabase';
import { Button, Input, Table, Tag, Typography } from 'antd';
import style from './style.module.css'
import { useNotification } from '@/Components/custom/custom-notification';
import dayjs from 'dayjs';
import { RiDeleteBin6Fill } from "react-icons/ri";
import { visionaryApplication } from '@/utils/PlatformLogging';
import { visionaryAcceptApplicationNotification, visionaryRejectApplicationNotification } from '@/lib/adminDashboardNoifications/visionaryApplications';
const { Paragraph, Text } = Typography;

const VisionaryApplication = ({ adminProfile }: any) => {
    const [data, setData] = useState<any>([]);
    const [loadingData, setLoadingData] = useState(false);
    const { notify } = useNotification();
    const [activeNoteUserId, setActiveNoteUserId] = useState<string | null>(null);
    const [profileNote, setProfileNote] = useState("");
    const noteInputRef = useRef<HTMLDivElement | null>(null);
    const [loadingAcceptUserId, setLoadingAcceptUserId] = useState<string | null>(null);
    const [loadingRejectUserId, setLoadingRejectUserId] = useState<string | null>(null);

    const handleFetchVisionaryApplication = async () => {
        try {
            setLoadingData(true)
            const { data: visionaryData, error } = await supabase
                .from('users')
                .select('userId,firstName,lastName,userName,profileType,status,stripe_account_id,createdAt,profile_note,email')

            if (error) {
                console.error("Error Fetching Visionary Application", error);
                return;
            }

            const visionaryProfile = visionaryData.filter((profile) => profile.profileType === 'Visionary');
            setData(visionaryProfile);

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setLoadingData(false)
        }
    };

    const handleAccept = async (userId: string, userEmail: string) => {
        setLoadingAcceptUserId(userId);
        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ status: 'Approved' })
                .eq("userId", userId)

            if (updateError) {
                notify({ type: 'error', message: `Error Approving application` })
                console.error(`Error Approving application`, updateError);
                return;
            }

            visionaryApplication.onAcceptReject('Approved', userId);
            try {
                await visionaryAcceptApplicationNotification(adminProfile.profileId, userId, '/profile', userEmail)
            } catch (error) {
                notify({ type: 'error', message: `Error Approving application` })
                console.error(`Error Approving application`, updateError);
                return;
            }

            setData((prev: any) => prev.map((user: any) => user.userId === userId ? { ...user, status: 'Approved' } : user));

            notify({ type: 'success', message: `Application Approved Successfully` })

        } catch (err) {
            console.error('Unexpected Error: ', err);
        } finally {
            setLoadingAcceptUserId(null);
        }
    }

    const handleReject = async (userId: string, userEmail: string) => {
        setLoadingRejectUserId(userId);
        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({ status: 'Rejected' })
                .eq("userId", userId)

            if (updateError) {
                notify({ type: 'error', message: `Error Rejecting application` })
                console.error(`Error Rejectingapplication`, updateError);
                return;
            }

            visionaryApplication.onAcceptReject('Rejected', userId);
            try {
                await visionaryRejectApplicationNotification(adminProfile.profileId, userId, '', userEmail)
            } catch (error) {
                notify({ type: 'error', message: `Error Rejecting application` })
                console.error(`Error Rejecting application`, updateError);
                return;
            }
            setData((prev: any) => prev.map((user: any) => user.userId === userId ? { ...user, status: 'Rejected' } : user));

            notify({ type: 'success', message: `Application Rejected` })

        } catch (err) {
            console.error('Unexpected Error: ', err);
        } finally {
            setLoadingRejectUserId(null);
        }
    }

    const handleAddProfileNote = async (note: string, userId: string) => {
        try {
            const trimmedNote = note.trim();

            const { error: addNoteError } = await supabase
                .from('users')
                .update({ profile_note: trimmedNote || null })
                .eq("userId", userId)

            if (addNoteError) {
                notify({ type: 'error', message: `Error adding ${note} Note` })
                console.error(`Error adding ${note} Note`, addNoteError);
                return;
            }

            visionaryApplication.onNoteAdd(userId);
            setData((prev: any) => prev.map((user: any) => user.userId === userId ? { ...user, profile_note: note.trim() || null } : user));

            notify({ type: 'success', message: trimmedNote ? `Note updated` : `Note removed` });
            setActiveNoteUserId(null)
            setProfileNote("")

        } catch (err) {
            console.error("Unexpected Error");
        }
    }

    useEffect(() => {
        handleFetchVisionaryApplication()
    }, []);

    const tagType = (type: string) => {
        switch (type) {
            case 'Client':
                return <Tag color='green-inverse' >{type}</Tag>;
            case 'Visionary':
                return <Tag color='geekblue-inverse' >{type}</Tag>;
            case 'Pending':
                return <Tag color='processing' >{type}</Tag>;
            case 'Onboarded':
                return <Tag color='orange-inverse' >{type}</Tag>;
            case 'Approved':
                return <Tag color='success' >{type}</Tag>;
            case 'Rejected':
                return <Tag color='red-inverse' >{type}</Tag>;
            default:
                return <Tag color='processing' >{type}</Tag>;
        }
    }

    const dataSource = data.map((visionaryData: any, idx: any) => (
        {
            key: idx,
            userName: (
                <>
                    <span className={style.visionaryName}>{visionaryData.userName || `${visionaryData.firstName} ${visionaryData.lastName}`}</span>
                    {visionaryData.profile_note && (
                        <Paragraph className={style.notePara} editable={{ onChange: (val) => handleAddProfileNote(val, visionaryData.userId) }}>
                            <Text>{visionaryData.profile_note}</Text>
                            <Button size="small" danger type="text" onClick={() => handleAddProfileNote("", visionaryData.userId)}><RiDeleteBin6Fill /></Button>
                        </Paragraph >
                    )}
                </>
            ),
            status: tagType(visionaryData.status),
            stripe_account_id: visionaryData.stripe_account_id,
            createdAt: dayjs(visionaryData.createdAt).format("MMMM D, YYYY"),
            actions: (
                <div className='actionBtn'>
                    <Button variant='solid' color='green' loading={loadingAcceptUserId === visionaryData.userId} onClick={() => handleAccept(visionaryData.userId, visionaryData.email)}>Approved</Button>
                    <Button variant='solid' color='red' loading={loadingRejectUserId === visionaryData.userId} onClick={() => handleReject(visionaryData.userId, visionaryData.email)}>Reject</Button>
                    {activeNoteUserId === visionaryData.userId ? (
                        <div ref={noteInputRef} className={style.addNoteInputDiv}>
                            <Input
                                type="text"
                                value={profileNote}
                                className={style.addNoteInput}
                                onChange={(e) => setProfileNote(e.target.value)}
                                onPressEnter={() => handleAddProfileNote(profileNote, visionaryData.userId)}
                                autoFocus
                                placeholder="Add Profile Note"
                                onBlur={(e) => {
                                    setTimeout(() => {
                                        if (
                                            noteInputRef.current &&
                                            !noteInputRef.current.contains(document.activeElement)
                                        ) {
                                            setActiveNoteUserId(null);
                                            setProfileNote("");
                                        }
                                    }, 100);
                                }}
                            />
                            <Button variant='solid' color='blue' onClick={() => handleAddProfileNote(profileNote, visionaryData.userId)}>Add Note</Button>
                        </div>
                    ) : (
                        <Button variant='solid' color='yellow' onClick={() => setActiveNoteUserId(visionaryData.userId)}>Add Note</Button>
                    )}
                </div>
            ),
        }
    ))

    const columns = [
        {
            key: '1',
            title: 'USER NAME',
            dataIndex: 'userName',
            width: 300,
        },
        {
            key: '2',
            title: 'STATUS',
            dataIndex: 'status',
            width: 200,
        },
        {
            key: '3',
            title: 'STRIPE ACCOUNT',
            dataIndex: 'stripe_account_id',
            width: 300,
        },
        {
            key: '4',
            title: 'CREATED',
            dataIndex: 'createdAt',
            width: 200,
        },
        {
            key: '5',
            title: 'ACTIONS',
            dataIndex: 'actions',
            width: 400,
        },
    ];

    return (
        <div className='table'>
            <Table dataSource={dataSource} columns={columns} loading={loadingData} scroll={{ x: 1024 }} style={{ width: "100%" }} />
        </div>
    )
}

export default VisionaryApplication