"use client";

import React, { useEffect, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { Card, Skeleton, Button, message } from "antd";
import { supabase } from "@/config/supabase";
import { useNotification } from "../custom/custom-notification";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store";
import PaymentCard from "../custom/payment-card";
import { collabRoomJoining } from "@/lib/collabRoomNotifications";

interface SubscriptionFormProps {
    roomId: string;
    roomTitle: string;
    subscriptionPrice: number;
    hostName: string;
    onSubscriptionSuccess?: () => void;
    onCancel?: () => void;
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
    roomId,
    roomTitle,
    subscriptionPrice,
    hostName,
    onSubscriptionSuccess,
    onCancel
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [clientSecret, setClientSecret] = useState("");
    const [subscriptionId, setSubscriptionId] = useState("");
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const { notify } = useNotification();
    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();

    useEffect(() => {
        const createSubscription = async () => {
            try {
                setInitializing(true);

                // Get the price ID from the room
                const { data: room, error: roomError } = await supabase
                    .from("thinktank")
                    .select("stripe_price_id, host, title")
                    .eq("id", roomId)
                    .single();

                if (roomError || !room?.stripe_price_id) {
                    setErrorMessage("Room subscription not properly configured");
                    return;
                }

                const response = await fetch("/api/subscriptions/create-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        roomId,
                        subscriberId: profile.profileId,
                        priceId: room.stripe_price_id,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    setErrorMessage(data.error || "Failed to create subscription");
                    return;
                }

                if (!data.clientSecret) {
                    setErrorMessage("Payment setup failed. Please try again.");
                    return;
                }

                setClientSecret(data.clientSecret);
                setSubscriptionId(data.subscriptionId);

            } catch (error) {
                console.error("Subscription creation error:", error);
                setErrorMessage("Failed to initialize subscription");
            } finally {
                setInitializing(false);
            }
        };

        if (profile.profileId) {
            createSubscription();
        }
    }, [roomId, profile.profileId]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            return;
        }

        setLoading(true);
        setErrorMessage("");

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setErrorMessage("Card input not found. Please refresh and try again.");
            setLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${profile.firstName} ${profile.lastName}`,
                    email: profile.email,
                },
            },
        });

        if (error) {
            setErrorMessage(error.message);
            setLoading(false);
            return;
        }

        if (paymentIntent.status === 'succeeded') {
            notify({
                type: "success",
                message: `Successfully subscribed to ${roomTitle}! You now have access to the room.`
            });

            // Grant immediate access to the room
            // try {
            //     const { error: participantError } = await supabase
            //         .from("think_tank_participants")
            //         .upsert({
            //             think_tank_id: roomId,
            //             participant_id: profile.profileId,
            //             status: 'Accepted',
            //             payment: 'Subscription',
            //             is_agreement_accepted: true,
            //         });

            //     if (participantError) {
            //         console.error("Error adding participant:", participantError);
            //     }
            // } catch (error) {
            //     console.error("Error granting room access:", error);
            // }

            await onSubscriptionSuccess?.();
        }

        setLoading(false);
    };

    if (initializing) {
        return (
            <div style={{ padding: 20 }}>
                <Skeleton active />
            </div>
        );
    }

    if (errorMessage && !clientSecret) {
        return (
            <div style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ color: '#ff4d4f', marginBottom: 16 }}>
                    {errorMessage}
                </div>
                <Button onClick={onCancel}>Close</Button>
            </div>
        );
    }

    if (!clientSecret || !stripe || !elements) {
        return (
            <div style={{ padding: 20 }}>
                <Skeleton active />
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <h2 style={{ margin: 0, marginBottom: 8 }}>Subscribe to {roomTitle}</h2>
                <p style={{ color: '#666', margin: 0, marginBottom: 4 }}>
                    Hosted by {hostName}
                </p>
                <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
                    Monthly subscription: <strong>${subscriptionPrice}/month</strong>
                </p>
                <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 6,
                    padding: 12,
                    marginTop: 12,
                    fontSize: 13,
                    color: '#0369a1'
                }}>
                    ✨ Get unlimited access to exclusive sessions, events, and content
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                    <PaymentCard />
                </div>

                {errorMessage && (
                    <div style={{
                        color: "#ff4d4f",
                        marginBottom: 16,
                        padding: 8,
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4
                    }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={!stripe || loading}
                        style={{
                            flex: 1,
                            height: 40,
                            background: "#000",
                            borderColor: "#000",
                        }}
                    >
                        {loading ? "Processing..." : `Subscribe for $${subscriptionPrice}/month`}
                    </Button>

                    <Button
                        onClick={onCancel}
                        disabled={loading}
                        style={{ height: 40 }}
                    >
                        Cancel
                    </Button>
                </div>

                <div style={{
                    fontSize: 12,
                    color: '#666',
                    textAlign: 'center',
                    marginTop: 12,
                    lineHeight: '1.4'
                }}>
                    Your subscription will automatically renew monthly. You can cancel anytime from your dashboard.
                </div>
            </form>
        </div>
    );
};

export default SubscriptionForm;
