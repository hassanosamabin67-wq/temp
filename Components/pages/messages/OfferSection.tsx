import { Drawer, Typography, Button } from 'antd'
import React, { useState } from 'react'
import OfferMessage from './OfferMessage'
import CollabRoomModal from '../thinkTankPage/CollabRoomModal'
import ServiceOfferMessage from './ServiceOfferMessage';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const { Title } = Typography;

interface OfferSectionProps {
    openOfferSection: boolean;
    setOpenOfferSection: (open: boolean) => void;
    userDetail: any;
    receiverId: string | null;
    conversationId: string;
    items: any[];
}

const OfferSection = ({ openOfferSection, setOpenOfferSection, userDetail, receiverId, conversationId, items }: OfferSectionProps) => {
    const [visible, setVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const handleCreateCollabRoom = () => {
        setOpenOfferSection(false);
        setVisible(true);
    };

    const nextStep = () => setCurrentStep(1);

    const handleRoomCreated = (newThinkTank: any) => {
        setVisible(false);
        setCurrentStep(0);
    };

    return (
        <>
            <CollabRoomModal
                visible={visible}
                onCancel={() => setVisible(false)}
                onSuccess={handleRoomCreated}
                receiverId={receiverId}
                is_requested_room={true}
                step={currentStep}
                nextStep={nextStep}
            />
            <Drawer
                title={<Title level={2} style={{ fontWeight: "bold", marginBottom: "0px" }}>Offers</Title>}
                closable={{ 'aria-label': 'Close Button' }}
                onClose={() => setOpenOfferSection(false)}
                open={openOfferSection}
                size='large'
            >
                <div className='msg-container-right'>
                    <div className='order-container'>
                        <div className='order-container-header'>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h1>All Offers</h1>
                                <ActionButton
                                    size="large"
                                    onClick={handleCreateCollabRoom}
                                >
                                    Create Collab Room
                                </ActionButton>
                            </div>
                        </div>
                        <div className="offers-list">
                            {items && items?.length === 0 ? (
                                <p style={{ opacity: 0.7 }}>No offers yet.</p>
                            ) : (
                                items.map((item: any) => {
                                    if (item.type === "offer") {
                                        const startDate = item.start_datetime || null;
                                        const endDate = item.end_datetime || null;

                                        return (
                                            <OfferMessage
                                                key={`offer-${item.id}`}
                                                offerPrice={item.price}
                                                startDate={startDate}
                                                endDate={endDate}
                                                userDetail={userDetail}
                                                offerStatus={item.status}
                                                offerSendTime={item.created_at}
                                                clientId={item.client_id}
                                                receiverId={item.visionary_id}
                                                orderId={item.id}
                                                fileUrl={item.file_url}
                                                priceType={item.price_type}
                                                description={item.description}
                                                title={item.title}
                                                milestone={item.milestone}
                                                conversationId={conversationId}
                                                serviceId={item.service_id}
                                            />
                                        );
                                    }

                                    if (item.type === "service_offer") {
                                        return (
                                            <div key={`service-offer-${item.id}`}>
                                                <ServiceOfferMessage
                                                    conversationId={conversationId}
                                                    serviceOrder={item}
                                                    userDetail={userDetail}
                                                />
                                            </div>
                                        );
                                    }

                                    return null;
                                })
                            )}
                        </div>
                    </div>
                </div>
            </Drawer>
        </>
    );
};

export default OfferSection