'use client'
import React, { useEffect, useState } from 'react'
import './style.css'
import { supabase } from '@/config/supabase';
import { Button, Modal, Form, InputNumber } from 'antd';
import dayjs from 'dayjs';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import StripePayment from '@/Components/StripePayment';

const CollabRoomEvent = ({ eventId }: any) => {
    const [event, setEvent] = useState<any>(null)
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [joinLoading, setJoinLoading] = useState(false);
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const [currentStep, setCurrentStep] = useState(0);
    const [eventPrice, setEventPrice] = useState(null);

    const fetchEventById = async (eventId: string) => {
        try {
            const { data, error } = await supabase
                .from('think_tank_events')
                .select("*")
                .eq("id", eventId)
                .maybeSingle()

            if (error) {
                console.error("Supabase Error:", error);
                return;
            }

            const { data: hostData, error: hostError } = await supabase
                .from('users')
                .select("firstName, lastName")
                .eq("userId", data?.host)
                .maybeSingle()

            if (hostError) {
                console.error("Supabase Error:", error);
                return;
            }

            setEvent({ ...data, hostName: hostData ? `${hostData.firstName} ${hostData.lastName}` : 'Unknown' });

        } catch (err) {
            console.error("Unexpected error while fetching events:", err);
        }
    };

    const handleJoinEvent = async (event: any) => {
        try {
            setJoinLoading(true)

            const isTimeReached = new Date(event.event_date).getTime() <= Date.now();
            if (isTimeReached) {
                notify({ type: "info", message: "Event Time Ended!" })
                return;
            }

            setShowPaymentModal(true)

        } catch (err) {
            console.error("Unexpected Error: ", err);
        } finally {
            setJoinLoading(false)
        }
    };

    const next = async () => setCurrentStep(currentStep + 1);

    const prev = () => setCurrentStep(currentStep - 1);

    useEffect(() => {
        fetchEventById(eventId)
    }, [eventId])

    return (
        <>
            <div className='invited-main'>
                {event ? (
                    <div className='invited-container'>
                        <span className='event-title'>{event.event_name}</span>
                        <p className='event-description'>{event.description}</p>
                        <div className='in-detail-div'>
                            <div className='invite-detail'>
                                <span className='in-key'>Host:</span>
                                <span className='in-value'>{event.hostName}</span>
                            </div>
                            <div className='invite-detail'>
                                <span className='in-key'>Date:</span>
                                <span className='in-value'>{dayjs(event.event_date).format('MMMM D, YYYY [at] h:mm A')}</span>
                            </div>
                            <span className='in-key'>
                                {Math.max((event.slots ?? 1) - 1, 0)} Spot{Math.max((event.slots ?? 1) - 1, 0) !== 1 ? 's' : ''} Available
                            </span>
                        </div>
                        <Button disabled={Math.max((event.slots ?? 1) - 1, 0) <= 0} loading={joinLoading} variant='solid' color='geekblue' className='buy-btn' onClick={() => handleJoinEvent(event)}>Buy Ticket</Button>
                        {Math.max((event.slots ?? 1) - 1, 0) <= 0 && (
                            <p className="no-spots-warning">No more spots available for this event.</p>
                        )}
                    </div>
                ) : (
                    <div className="invited-container">
                        <span className="event-title">No Upcoming Event!</span>
                    </div>
                )}
            </div>

            <Modal
                open={showPaymentModal}
                onCancel={() => setShowPaymentModal(false)}
                centered
                width={600}
                footer={null}
            >
                {event?.type === 'Donation based' ? (
                    <>
                        {currentStep === 0 && (
                            <Form layout="vertical">
                                <Form.Item
                                    label="Enter Donation Amount"
                                    required
                                    rules={[{ required: true, message: "Please enter your amount" }]}
                                >
                                    <InputNumber
                                        min={1}
                                        placeholder="Enter amount"
                                        style={{ width: "100%" }}
                                        value={eventPrice}
                                        onChange={(value: any) => setEventPrice(value)}
                                    />
                                </Form.Item>
                            </Form>
                        )}

                        {currentStep === 1 && (
                            <StripePayment
                                profile={profile}
                                eventId={eventId}
                                eventHost={event?.host}
                                paymentAmount={eventPrice ?? 0}
                                setShowHireModal={setShowPaymentModal}
                                fromInvite={true}
                                roomId={event?.think_tank_id}
                            />
                        )}

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 15 }}>
                            {currentStep > 0 && (
                                <Button style={{ margin: "0 10px 0 0" }} onClick={prev}>Back</Button>
                            )}
                            {currentStep < 1 && (
                                <Button type="primary" onClick={next} disabled={!eventPrice}>Next</Button>
                            )}
                        </div>
                    </>
                ) : (
                    <StripePayment
                        profile={profile}
                        eventId={eventId}
                        eventHost={event?.host}
                        paymentAmount={event?.price ?? 0}
                        setShowHireModal={setShowPaymentModal}
                        fromInvite={true}
                        roomId={event?.think_tank_id}
                    />
                )}
            </Modal >
        </>
    )
}

export default CollabRoomEvent