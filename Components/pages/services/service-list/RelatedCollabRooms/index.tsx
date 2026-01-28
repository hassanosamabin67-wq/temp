import React, { useEffect, useState } from "react";
import { supabase } from "@/config/supabase";
import Image from "next/image";
import Link from "next/link";
import useCollabRoomManager from "@/hooks/collabRoom/useCollabRoomManager";
import { useAppSelector } from "@/store";
import { Button, Modal, Typography } from "antd";
import NdaModal from "@/Components/NdaModal";
import { RiErrorWarningFill } from "react-icons/ri";
import { Globe, Monitor } from "lucide-react";
import ActionButton from "../../../../UIComponents/ActionBtn";
import styles from "./style.module.css";
import "../online-events.css";

const { Title } = Typography;

export default function RelatedCollabRooms({ category }: { category: string }) {
    const [rooms, setRooms] = useState<any[]>([]);
    const profile = useAppSelector((state) => state.auth);

    const handleFetchRelatedRooms = async (category: string) => {
        try {
            const { data, error } = await supabase
                .from("thinktank")
                .select("*")
                .eq("category", category)

            if (error) {
                console.error("Error fetching related rooms")
                return
            }

            const now = new Date();

            if (data) {
                const isValidTank = (tank: any) => {
                    if (tank.recurring === 'One-Time Think Tank') {
                        const expiryDate = new Date(tank.one_time_date);
                        if (expiryDate < now) return false;
                        if (tank.accesstype === "Open" || tank.accesstype === "Private") return true;
                        if (tank.accesstype === "Limited") return true;
                        return false;
                    }
                    const expiryDate = new Date(tank.end_datetime);
                    if (expiryDate < now) return false;

                    if (tank.accesstype === "Open" || tank.accesstype === "Private") return true;
                    if (tank.accesstype === "Limited") return true;
                    return false;
                };

                const visibleTanks = data.filter(isValidTank);

                const sortedTanks = visibleTanks.sort((a, b) => {
                    const boostA = Number(a.requested_boosting) || 0;
                    const boostB = Number(b.requested_boosting) || 0;
                    return boostB - boostA;
                });

                setRooms(sortedTanks);
            }

        } catch (error) {
            console.error("Unexpected error fetching related collab rooms: ", error)
        }
    }

    const { thinkTankHost, joiningTankId, selectedTankId, paymentAmount, showAgreementModal, setShowAgreementModal, joinFreeModal, setJoinFreeModal, showFreeModal, checked, setChecked, next, prev, currentStep, authModalVisible, setAuthModalVisible, authModal, handleJoin, isDonationBased, donationAmount, setDonationAmount } = useCollabRoomManager({ filteredThinkTanks: rooms })

    const roomThumbnail = (currentFileUrl: string) => {
        if (!currentFileUrl) return null;
        const isVideo = currentFileUrl.match(/\.(mp4|webm|ogg)$/i);
        const isImage = currentFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        if (isVideo) {
            return (
                <video className={styles.thumb} autoPlay loop muted playsInline>
                    <source src={currentFileUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (isImage) {
            return (
                <Image className={styles.thumb} src={currentFileUrl} alt={"img"} width={200} height={200} />
            )
        }
    }

    useEffect(() => {
        if (!category) return;
        handleFetchRelatedRooms(category)
    }, [category])

    return (
        <>
            <Modal
                title={
                    <Title level={3}>
                        <div className='warning-icon-div'><RiErrorWarningFill className='warning-icon' /> <span>Please Login or Signup to join the Think tank</span></div>
                    </Title>
                }
                open={authModalVisible}
                onCancel={() => setAuthModalVisible(false)}
                footer={null}
                centered
                width={600}
            >
                <div className='warning-div'>
                    <Button type="primary" className='warning-btn'>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button className='warning-btn'>
                        <Link href="/signup">Signup</Link>
                    </Button>
                </div>
            </Modal>

            <NdaModal
                open={showAgreementModal}
                onClose={() => setShowAgreementModal(false)}
                profile={profile}
                thinkTankHost={thinkTankHost}
                checked={checked}
                setChecked={setChecked}
                showStepper={true}
                step={currentStep}
                onNextStep={next}
                onPrevStep={prev}
                paymentAmount={paymentAmount}
                selectedTankId={selectedTankId}
                isDonationBased={isDonationBased}
                donationAmount={donationAmount}
                setDonationAmount={setDonationAmount}
            />

            <NdaModal
                open={joinFreeModal}
                onClose={() => setJoinFreeModal(false)}
                profile={profile}
                thinkTankHost={thinkTankHost}
                checked={checked}
                setChecked={setChecked}
                showJoinButton={true}
                loading={joiningTankId === selectedTankId}
                onConfirm={() => showFreeModal(selectedTankId, profile.profileId)}
            />
            <section className="online-events-collab">
                <div className="online-events-container">
                    <h2 className="online-events-section-title">Related Collab Rooms</h2>
                    <p className="online-events-section-subtitle">
                        Explore rooms where creators collaborate on {category?.toLowerCase()} experiences
                    </p>

                    {(rooms && rooms.length > 0) ? (
                        <div className="online-events-grid">
                            {rooms.map((r) => {
                                const truncatedDescription =
                                    r?.description?.length > 100
                                        ? r.description.slice(0, 100) + '...'
                                        : r?.description;
                                return (
                                    <div key={r.id} className="online-events-card-wrapper">
                                        <div className="online-events-card">
                                            <div className="online-events-card-icon">
                                                <Monitor size={48} />
                                            </div>
                                            <h3 className="online-events-card-title">{r.title}</h3>
                                            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                                                {truncatedDescription}
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <ActionButton 
                                                    loading={joiningTankId === r.id} 
                                                    onClick={() => handleJoin(r.id, profile.profileId!)}
                                                    style={{
                                                        background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.5rem',
                                                        padding: '0.75rem 1.5rem',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Join
                                                </ActionButton>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="online-events-collab-empty">
                            <Globe size={64} className="online-events-collab-icon" />
                            <p className="online-events-collab-text">No Room for this category</p>
                            <Link href="/think-tank" className="online-events-collab-link">
                                See all collab rooms →
                            </Link>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}