"use client";

import React, { useEffect, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Card, Skeleton } from "antd";
import { supabase } from "@/config/supabase";
import convertToSubcurrency from "@/lib/convertToSubcurrency";
import { useNotification } from "../custom/custom-notification";
import { useRouter } from "next/navigation";
import { createOfferMessageNotificationWithEmail } from "@/lib/notificationService";
import { useAppSelector } from "@/store";
import { insertInvoice } from "@/utils/add-invoices/invoice";
import { getClientCountry } from "@/lib/getClientCountry";
import { collabRoomJoining } from "@/lib/collabRoomNotifications";
import PaymentCard from "../custom/payment-card";

const PaymentForm = ({ amount, clientId, thinkTankId, profileId, visionaryId, priceType, startDate, endDate, setShowHireModal, order, description, milestones, title, profile, eventId, eventHost, selectedBoost, think_tank_id, fromInvite, roomId, receiverEmail, collabCardPurchase = false, onPaymentSuccess }: any) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [clientSecret, setClientSecret] = useState("");
    const [paymentIntentId, setPaymentIntentId] = useState("");
    const [loading, setLoading] = useState(false);
    const { notify } = useNotification();
    const offerMessageClientProfile = useAppSelector((state) => state.auth);
    const router = useRouter();

    const handleAddOrder = async (clientId: any, visionaryId: any, priceType: any, startDate: any, endDate: any, amount: any, hireDescription: any, milestone: any, hireTitle: any, paymentIntentStatus: any) => {
        try {
            const { client_country_code, client_country_name } = await getClientCountry();

            const payload = {
                client_id: clientId,
                visionary_id: visionaryId,
                status: "Pending",
                price_type: priceType,
                price: amount ?? null,
                start_datetime: startDate ? startDate.toISOString() : null,
                end_datetime: endDate ? endDate.toISOString() : null,
                license_agreement: true,
                title: hireTitle,
                description: hireDescription ?? null,
                milestone: milestone ?? null,
                client_country_code,
                client_country_name,
            };

            const { data, error } = await supabase.from("order").insert([payload]).select().single();

            if (error) {
                console.error("Error adding order: ", error);
                return
            }

            const { error: transactionError } = await supabase.from('transactions').insert([{
                stripe_transaction_id: paymentIntentId,
                application_fee: Math.round(amount * 0.20),
                category: 'Contract',
                amount: amount,
                user_id: visionaryId,
                client_id: clientId,
                type: "Service",
                status: paymentIntentStatus,
                purchase_name: `Order placed for: ${hireTitle}`
            }]);

            if (transactionError) {
                console.error('Error inserting transaction:', transactionError);
                return;
            }

            await supabase.from("contract_tool_usage").insert({
                user: clientId,
                for: data.id,
                contract_type: "Work-for-Hire",
                project: hireTitle,
                payment: amount || null,
                status: "Active"
            })

            try {
                await insertInvoice({ amount, clientId, priceType, serviceId: data.id, serviceTitle: hireTitle, visionaryId, orderId: data.id, issueDate: startDate ? startDate.toISOString() : null, dueDate: endDate ? endDate.toISOString() : null })
            } catch (error) {
                console.error("Error inserting invoices: ", error);
            }

            notify({ type: "success", message: "Offer sent successfully, redirecting...." })
            return data?.id;

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    };

    const handleUpdateStatus = async (profileId: any, tankId: any, paymentIntentStatus: any) => {
        try {
            const { data: existingEntry, error: checkError } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('participant_id', profileId)
                .eq('think_tank_id', tankId)
                .maybeSingle();

            if (checkError) {
                console.error("Check failed:", checkError);
                return;
            }

            const { data: thinkTank, error: fetchError } = await supabase
                .from('thinktank')
                .select('host, accesstype, title')
                .eq('id', tankId)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch failed:', fetchError);
                return;
            }

            const isOpen = thinkTank?.accesstype === "Open";
            const newStatus = isOpen ? "Accepted" : "Pending";

            if (fromInvite) {
                const { error: participantAddError } = await supabase
                    .from('think_tank_participants')
                    .update({ status: newStatus, payment: "Paid", is_agreement_accepted: true, forEvent: false })
                    .eq("participant_id", profileId)
                    .eq('think_tank_id', tankId)

                if (participantAddError) {
                    console.error("Error updating participants:", participantAddError);
                    return;
                }

                notify({ type: "success", message: "Redirecting...." })
                router.refresh();
            }

            const { error: transactionError } = await supabase.from('transactions').insert([{
                stripe_transaction_id: paymentIntentId,
                category: "Collab Room",
                application_fee: Math.round(amount * 0.20),
                status: paymentIntentStatus,
                amount: amount,
                user_id: thinkTank?.host,
                client_id: profileId,
                type: "Think Tank Access",
                purchase_name: `Access fee for collab room: ${thinkTank?.title}`
            }]);

            if (transactionError) {
                console.error('Error inserting transaction:', transactionError);
            }

            if (existingEntry) {
                console.log("Already joined, skipping insert.");
                return;
            }

            const { error: insertError } = await supabase
                .from("think_tank_participants")
                .insert({
                    status: newStatus,
                    think_tank_id: tankId,
                    participant_id: profileId,
                    payment: "Paid",
                    is_agreement_accepted: true
                });

            if (insertError) {
                console.error('Insert failed:', insertError);
                return;
            }

            if (isOpen) {
                notify({
                    type: "success",
                    message: "Payment successful, redirecting...."
                });
                try {
                    await collabRoomJoining(offerMessageClientProfile.profileId!, `${offerMessageClientProfile.firstName} ${offerMessageClientProfile.lastName}`, thinkTank.host, thinkTank.title)
                } catch (error) {
                    console.error("Error Sending Room Joining Notification: ", error)
                }
                router.push(`/think-tank/room/${tankId}`);
            } else {
                notify({
                    type: "success",
                    message: "Your request has been sent, please wait for your approval"
                });
            }

        } catch (err) {
            console.error("Unexpected error: ", err);
        }
    };

    const handleOpenConversation = async (participantId: string, profileId: string, clientName: string, receiverEmail: string, contractTitle: string, orderId: string) => {
        try {
            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${profileId},user2_id.eq.${participantId}),and(user1_id.eq.${participantId},user2_id.eq.${profileId})`)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError);
                return;
            }

            let conversationId;

            if (existingConversation) {
                conversationId = existingConversation.id
            }

            if (!existingConversation) {
                const { data: newConversation, error: insertError } = await supabase
                    .from('inbox_conversation')
                    .insert({
                        user1_id: profileId,
                        user2_id: participantId,
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating conversation:', insertError);
                    return;
                }

                conversationId = newConversation.id;

            }

            try {
                await createOfferMessageNotificationWithEmail(clientId, clientName, visionaryId, `You have receive an offer from ${clientName}, please check your inbox`, receiverEmail, contractTitle, orderId, "offer-received", 'New Offer received from', `${conversationId}?ch=${clientId}`)
            } catch (error) {
                console.error("Error Sending Offer Notification: ", error)
            }

            router.push(`/messages/room/${conversationId}?ch=${participantId}`)

        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    const insertTransaction = async (paymentIntentId: string, amount: number, visionaryId: string, orderId: string, clientId: string, paymentIntentStatus: any) => {
        try {
            const { error } = await supabase.from('transactions').insert([{
                stripe_transaction_id: paymentIntentId,
                amount: amount,
                user_id: visionaryId,
                client_id: clientId,
                purchase_name: `Order placed for: ${order?.title}`,
                type: "Service",
                category: "Contract",
                status: paymentIntentStatus
            }]);

            if (error) {
                console.error('Error inserting transaction:', error);
                return;
            }

            notify({ type: "success", message: "Payment successfull" })

        } catch (err) {
            console.error('Unexpected error:', err);
            return;
        }
    };

    const handleAddMilestone = async (profileId: string, visionaryId: string, milestone: any, orderId: string) => {
        try {
            const { error } = await supabase.from("milestone_payment").insert(
                milestone.map((data: any) => ({
                    client_id: profileId,
                    visionary_id: visionaryId,
                    title: data.title,
                    amount: data.amount,
                    due_date: data.due_date?.toISOString() ?? null,
                    status: "Pending",
                    order_id: orderId
                }))
            );

            if (error) {
                console.error("Error inserting milestone payments:", error);
                return
            }

        } catch (err) {
            console.error("Unexpected Error: ", err);
            return;
        }
    }

    const handleEventPayment = async (eventId: string, profileId: string, profile: any, fromInvite: any, roomId: any, paymentIntentStatus: any) => {
        try {
            const { data: eventData, error } = await supabase
                .from("think_tank_events")
                .select("*")
                .eq("id", eventId)
                .single();

            if (error) {
                console.error("Error fetching event:", error);
                return;
            }
            const participants = eventData.participants || [];
            const current = participants.find((p: any) => p.id === profileId);

            const updatedParticipants = current
                ? participants.map((p: any) => p.id === profileId ? { ...p, payment: "Paid", role: "participant" } : p)
                : [...participants, { id: profileId, name: profile.firstName, picture: profile.profileImage, payment: "Paid", role: "participant", ...(fromInvite && { fromInvite: true }) }];

            const { error: updateError } = await supabase
                .from("think_tank_events")
                .update({ participants: updatedParticipants })
                .eq("id", eventId);

            if (updateError) {
                console.error("Error updating participants:", updateError);
                return;
            }

            notify({ type: "success", message: "You are now registered!" });

            // if (isTimeReached) {
            //     window.open(`/channel/video/${eventId}`, "_blank");
            // }

            const { error: insertError } = await supabase.from("event_payments").insert({
                event_id: eventId,
                participant_id: profileId,
                amount,
                status: "pending",
                stripe_payment_intent_id: paymentIntentId,
            });

            if (insertError) {
                console.error("Supabase insert error:", insertError);
                return
            }

            const { error: transactionError } = await supabase.from('transactions').insert([{
                stripe_transaction_id: paymentIntentId,
                application_fee: Math.round(amount * 0.20),
                category: 'Collab Room',
                amount: amount,
                user_id: eventHost,
                client_id: profileId,
                status: paymentIntentStatus,
                type: "Collab room event",
                purchase_name: `Ticket purchased for event: ${eventData.event_name}`
            }]);

            if (transactionError) {
                console.error('Error inserting transaction:', error);
                return;
            }

            if (fromInvite) {
                const { error: participantAddError } = await supabase.from('think_tank_participants').insert({
                    status: "Accepted",
                    think_tank_id: roomId,
                    participant_id: profile.profileId,
                    forEvent: true
                });

                if (participantAddError) {
                    console.error("Error updating participants:", participantAddError);
                    return;
                }

                notify({ type: "success", message: "Redirecting...." })
                router.push(`${window.location.origin}/think-tank/room/${roomId}`)
            }

        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    const handleCollabRoomBoost = async (thinkTankId: string, selectedBoost: string, paymentIntentStatus: any) => {
        try {
            const { data, error } = await supabase
                .from("thinktank")
                .update({ requested_boosting: selectedBoost, paid_for_boost: true })
                .eq("id", thinkTankId)
                .select("title")
                .single()

            if (error) {
                console.error("Error While Boosting: ", error);
                notify({ type: "error", message: "Unexpected Error..." });
                return;
            }

            const { error: transactionError } = await supabase.from('transactions').insert([{
                stripe_transaction_id: paymentIntentId,
                category: "Collab Room",
                application_fee: Math.round(amount * 0.20),
                status: paymentIntentStatus,
                amount: amount,
                user_id: '',
                client_id: profileId,
                type: "Collab Room Boost",
                purchase_name: `Boosted Collab Room: ${data.title}`
            }]);

            if (transactionError) {
                console.error('Error inserting transaction:', transactionError);
            }

            notify({ type: "success", message: `Collab Room Boosted ${selectedBoost}%` });

        } catch (err) {
            console.error("Unexpected error: ", err);
        }
    }

    useEffect(() => {
        const endpoint = thinkTankId ? "/api/create-payment" : eventId ? "/api/stripe/event-payment" : order ? "/api/stripe/order-pay" : think_tank_id ? "/api/stripe/boost-room" : "/api/stripe/charge";

        const payload = clientId
            ? {
                clientId,
                amount: convertToSubcurrency(amount),
            } : order ? {
                amount: convertToSubcurrency(amount),
                orderId: order.id,
            } : eventId ? {
                amount: convertToSubcurrency(amount),
                eventHostId: eventHost,
                description: `Buying Event Ticket`
            } : think_tank_id ? {
                clientId,
                amount: convertToSubcurrency(amount),
            } : {
                amount: convertToSubcurrency(amount),
                profileId,
                thinkTankId,
            };

        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                const data = await res.json();
                console.log("Stripe API Response:", data);

                if (!res.ok) {
                    console.error("Payment Error:", res.status, data?.error || data);
                    return;
                }

                if (data.paymentIntentId) {
                    setPaymentIntentId(data.paymentIntentId);
                }

                setClientSecret(data.clientSecret);
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
            });
    }, [amount]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);
        setErrorMessage("");

        const cardElement = elements.getElement(CardElement);

        // const { error: submitError } = await elements.submit();

        // if (submitError) {
        //     setErrorMessage(submitError.message);
        //     setLoading(false);
        //     return;
        // }

        if (!cardElement) {
            setErrorMessage("Card input not found. Please refresh and try again.");
            setLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
            },
        });

        if (error) {
            // This point is only reached if there's an immediate error when
            // confirming the payment. Show the error to your customer (for example, payment details incomplete)
            setErrorMessage(error.message);
            return;
        } else {
            console.log("PaymentIntent status: " + paymentIntent.status)
            if (collabCardPurchase) {
                try {
                    await supabase.from('users').update({ has_collab_card: true, card_eligible: true }).eq('userId', clientId);
                    notify({ type: "success", message: "Card granted to user" });
                    onPaymentSuccess?.();
                } catch (e) {
                    console.error('Error updating card flags:', e);
                }
            } else if (visionaryId) {
                const orderId = await handleAddOrder(clientId, visionaryId, priceType, startDate, endDate, amount, description, milestones, title, paymentIntent.status);
                if (orderId && milestones?.length > 0) {
                    await handleAddMilestone(clientId, visionaryId, milestones, orderId);
                }
                await handleOpenConversation(visionaryId, clientId, offerMessageClientProfile.firstName!, receiverEmail, title, orderId)
            } else if (order) {
                insertTransaction(paymentIntentId, amount, order.visionary_id, order.id, order.client_id, paymentIntent.status);
            } else if (selectedBoost) {
                handleCollabRoomBoost(think_tank_id, selectedBoost, paymentIntent.status)
            } else if (eventId) {
                handleEventPayment(eventId, profile.profileId, profile, fromInvite, roomId, paymentIntent.status)
            } else {
                handleUpdateStatus(profileId, thinkTankId, paymentIntent.status)
            }
            setShowHireModal(false)
        }

        setLoading(false);
    };

    if (!clientSecret || !stripe || !elements) {
        return (
            <div style={{ padding: 20 }}>
                <Skeleton active />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            style={{
                padding: 20,
                borderRadius: 10,
                border: "1px solid #ddd",
                maxWidth: 400,
                margin: "auto",
                background: "#fff",
            }}>
            <h2 style={{ textAlign: "center", marginBottom: 20 }}>Card Payment</h2>
            {clientSecret && <PaymentCard />}

            {errorMessage && <div style={{ color: "#FF0000", margin: 10 }}>{errorMessage}</div>}

            <button type="submit" disabled={!stripe || loading} style={{
                width: "100%",
                background: "black",
                color: "white",
                padding: "10px 0",
                borderRadius: 6,
                fontWeight: "bold",
                fontSize: 16,
                marginTop: 20,
            }}>
                {loading ? "Processing..." : clientId || order ? `Pay $${amount}` : `Join for $${amount}`}
            </button>
        </form>
    );
};

export default PaymentForm;