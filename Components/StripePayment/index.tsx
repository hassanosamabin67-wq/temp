'use client'

import React from 'react'
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import convertToSubcurrency from '@/lib/convertToSubcurrency';
import PaymentForm from '../PaymentForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type StripePaymentProps = {
    paymentAmount: number;
    clientId?: string;
    selectedBoost?: string;
    thinkTankId?: string;
    profileId?: string;
    visionaryId?: string;
    priceType?: string;
    startDate?: any;
    endDate?: any;
    setShowHireModal: (open: boolean) => void;
    order?: any;
    description?: string;
    milestones?: any[];
    title?: string;
    profile?: any;
    eventId?: string;
    eventHost?: string;
    think_tank_id?: string;
    fromInvite?: boolean;
    roomId?: string;
    receiverEmail?: string;
    collabCardPurchase?: boolean;
    onSuccess?: () => void;
};

const StripePayment: React.FC<StripePaymentProps> = ({ paymentAmount, clientId, selectedBoost, thinkTankId, profileId, visionaryId, priceType, startDate, endDate, setShowHireModal, order, description, milestones, title, profile, eventId, eventHost, think_tank_id, fromInvite, roomId, receiverEmail, collabCardPurchase, onSuccess }) => {
    return (
        <Elements
            stripe={stripePromise}
            options={{
                mode: "payment",
                amount: convertToSubcurrency(paymentAmount),
                currency: "usd",
            }}
        >
            <PaymentForm description={description} selectedBoost={selectedBoost} clientId={clientId} amount={paymentAmount} thinkTankId={thinkTankId} profileId={profileId} visionaryId={visionaryId} priceType={priceType} startDate={startDate} endDate={endDate} setShowHireModal={setShowHireModal} order={order} milestones={milestones} title={title} profile={profile} eventId={eventId} eventHost={eventHost} think_tank_id={think_tank_id} fromInvite={fromInvite} roomId={roomId} receiverEmail={receiverEmail} collabCardPurchase={collabCardPurchase} onPaymentSuccess={onSuccess} />
        </Elements>
    )
}

export default StripePayment