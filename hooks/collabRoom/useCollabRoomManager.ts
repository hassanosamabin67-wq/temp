import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store';
import { useNotification } from '@/Components/custom/custom-notification';
import { supabase } from '@/config/supabase';
import { collabRoomJoining, collabRoomJoinRequest } from '@/lib/collabRoomNotifications';

interface UseCollabRoomManagerProps {
    filteredThinkTanks: any;
}

const useCollabRoomManager = ({ filteredThinkTanks }: UseCollabRoomManagerProps) => {
    const [joiningTankId, setJoiningTankId] = useState<string | null>(null);
    const [selectedTankId, setSelectedTankId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [donationAmount, setDonationAmount] = useState<number>(0);
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [joinFreeModal, setJoinFreeModal] = useState(false);
    const [thinkTankHost, setThinkTankHost] = useState<any>({});
    const [currentStep, setCurrentStep] = useState(0);
    const [checked, setChecked] = useState(false);
    const [authModalVisible, setAuthModalVisible] = useState(false);
    const [isDonationBased, setIsDonationBased] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [subscriptionRoomData, setSubscriptionRoomData] = useState<any>(null);

    const profile = useAppSelector((state) => state.auth);
    const router = useRouter();
    const { notify } = useNotification();

    const authModal = () => setAuthModalVisible(true);

    const showFreeModal = async (id: any, profileId: any) => {
        try {
            setJoiningTankId(id);
            const { data: thinkTank, error: fetchError } = await supabase
                .from('thinktank')
                .select('host, title, accesstype')
                .eq('id', id)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch failed:', fetchError);
                return;
            }

            const isOpen = thinkTank?.accesstype === "Open";
            const newStatus = isOpen ? "Accepted" : "Pending";

            const { error: insertError } = await supabase.from('think_tank_participants').insert({
                status: newStatus,
                think_tank_id: id,
                participant_id: profileId,
                is_agreement_accepted: true
            });

            if (insertError) {
                console.error('Insert failed:', insertError);
                notify({ type: 'error', message: 'Failed to join. Please try again.' });
                return;
            }

            if (isOpen) {
                setJoinFreeModal(false);
                try {
                    await collabRoomJoining(profile.profileId!, `${profile.firstName} ${profile.lastName}`, thinkTank?.host, thinkTank?.title)
                } catch (error) {
                    console.error("Error Sending Room Joining Notification: ", error)
                }
                router.push(`/think-tank/room/${id}`);
            } else {
                setJoinFreeModal(false);
                try {
                    await collabRoomJoinRequest(profile.profileId!, `${profile.firstName} ${profile.lastName}`, thinkTank?.host, thinkTank?.title)
                } catch (error) {
                    console.error("Error Sending Room Joining Notification: ", error)
                }
                notify({
                    type: 'success',
                    message: 'Your request to join the Think Tank has been send. Please wait for your approval',
                });
                return;
            }
            setJoinFreeModal(false);

        } catch (err) {
            console.error("Unexpected error: ", err);
        } finally {
            setJoiningTankId(null)
        }
    }

    const handleJoin = async (id: string, profileId: string | any) => {
        try {
            if (!profileId) {
                authModal();
                return;
            }
            setJoiningTankId(id);

            const { data: existingParticipant, error: fetchError } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('participant_id', profileId)
                .eq('think_tank_id', id)
                .maybeSingle();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Fetch failed:', fetchError);
                return;
            }

            const tankInfo = filteredThinkTanks.find((tank: any) => tank.id === id);
            if (!tankInfo) {
                console.error("Think Tank not found");
                return;
            }

            if (tankInfo.host === profileId) {
                router.push(`/think-tank/room/${id}`);
                return;
            }

            const { data: hostData, error: hostError } = await supabase
                .from('users')
                .select('userId, firstName, lastName, profileImage')
                .eq('userId', tankInfo.host)
                .single()

            if (hostError) {
                console.error('Error fetching host:', hostError)
                return
            }
            setThinkTankHost(hostData)

            const isOpen = tankInfo.accesstype === "Open";
            const newStatus = isOpen ? "Accepted" : "Pending";
            const donationBasedRoom = tankInfo.pricingtype === 'Donation-Based'
            const isSubscriptionRoom = tankInfo.pricingtype === 'Subscription';
            const requiresPayment = !!tankInfo.price;
            const hasPaid = existingParticipant?.payment === "Paid";
            const hasSubscription = existingParticipant?.payment === "Subscription";

            setSelectedTankId(id);
            setPaymentAmount(tankInfo.price);
            setIsDonationBased(donationBasedRoom);
            setDonationAmount(0);

            // Check capacity limits for all room types
            const { data: participants, error: participantError } = await supabase
                .from('think_tank_participants')
                .select('*')
                .eq('think_tank_id', id)
                .eq('status', 'Accepted');

            if (participantError) {
                console.error('Participant fetch failed:', participantError);
                return;
            }

            const currentParticipants = participants.length;
            const availableSpots = tankInfo.available_spots;
            const participantLimit = tankInfo.participant_limit;

            // Check against available_spots (universal capacity)
            if (availableSpots && currentParticipants >= availableSpots) {
                notify({
                    type: 'error',
                    message: `Room is at full capacity (${availableSpots}/${availableSpots} participants). You cannot join.`,
                });
                return;
            }

            // Check against participant_limit for Limited access type
            if (tankInfo.accesstype === 'Limited' && participantLimit && currentParticipants >= participantLimit) {
                notify({
                    type: 'error',
                    message: `Room has reached its participant limit (${participantLimit}/${participantLimit}). You cannot join.`,
                });
                return;
            }

            // Enforce maximum 300 participant capacity
            if (currentParticipants >= 300) {
                notify({
                    type: 'error',
                    message: 'Room has reached maximum capacity (300 participants). You cannot join.',
                });
                return;
            }

            if (existingParticipant) {
                if (isSubscriptionRoom && !hasSubscription) {
                    // Check if user has active subscription
                    const { data: activeSubscription } = await supabase
                        .from('room_subscriptions')
                        .select('status')
                        .eq('room_id', id)
                        .eq('subscriber_id', profileId)
                        .eq('status', 'active')
                        .single();

                    if (!activeSubscription) {
                        // Show subscription modal
                        setSubscriptionRoomData({
                            roomId: id,
                            roomTitle: tankInfo.title,
                            subscriptionPrice: tankInfo.price,
                            hostName: `${hostData?.firstName} ${hostData?.lastName}`,
                            hostId: tankInfo.host
                        });
                        setShowSubscriptionModal(true);
                        return;
                    }
                } else if (requiresPayment && !hasPaid && !hasSubscription) {
                    // Show payment + NDA modal
                    setShowAgreementModal(true);
                    return;
                }

                if (existingParticipant.status === 'Pending') {
                    notify({
                        type: 'info',
                        message: 'Your request is under review. Please wait for the host to approve it.',
                    });
                    return;
                }

                // Already accepted
                router.push(`/think-tank/room/${id}`);
                return;
            }

            // Check for subscription room
            if (isSubscriptionRoom) {
                setSubscriptionRoomData({
                    roomId: id,
                    roomTitle: tankInfo.title,
                    subscriptionPrice: tankInfo.price,
                    hostName: `${hostData?.firstName} ${hostData?.lastName}`,
                    hostId: tankInfo.host
                });
                setShowSubscriptionModal(true);
                return;
            }

            // Check for donation based room
            if (donationBasedRoom) {
                setShowAgreementModal(true);
                console.log("YEEYEYEYEYssssss")
                return
            }

            // New participant
            if (requiresPayment) {
                setShowAgreementModal(true);
                console.log("herere")
                return;
            }

            if (isOpen) {
                setJoinFreeModal(true);
                return;
            }

            // For non-open free tanks (e.g. Limited), show NDA and wait for host approval
            setJoinFreeModal(true);
        } catch (error) {
            console.error('Error joining think tank:', error);
        } finally {
            setJoiningTankId(null);
        }
    };

    const getMaxSteps = () => {
        if (!isDonationBased) return 1;
        return donationAmount > 0 ? 2 : 1;
    };


    const next = async () => {
        try {
            if (currentStep === 0 && !checked) {
                notify({ type: "error", message: "Please accept the License Agreement before proceeding." });
                return;
            }

            const maxSteps = getMaxSteps();
            if (currentStep === 1 && isDonationBased && donationAmount === 0) {
                await showFreeModal(selectedTankId, profile.profileId);
                setShowAgreementModal(false);
                return;
            }

            if (currentStep < maxSteps) {
                setCurrentStep(currentStep + 1);
            }
        } catch (err) {
            console.log("Validation error", err);
        }
    };

    const prev = () => setCurrentStep(currentStep - 1);

    const handleSubscriptionSuccess = () => {
        setShowSubscriptionModal(false);
        setSubscriptionRoomData(null);
    };

    return {
        // State
        joiningTankId,
        selectedTankId,
        paymentAmount,
        donationAmount,
        showAgreementModal,
        joinFreeModal,
        thinkTankHost,
        checked,
        currentStep,
        authModalVisible,
        isDonationBased,
        showSubscriptionModal,
        subscriptionRoomData,

        // Setters
        setJoiningTankId,
        setSelectedTankId,
        setShowAgreementModal,
        setJoinFreeModal,
        setChecked,
        setDonationAmount,
        next,
        prev,
        setAuthModalVisible,
        authModal,
        setShowSubscriptionModal,

        // Actions
        handleJoin,
        showFreeModal,
        handleSubscriptionSuccess,

        // Profile
        profile
    };
};

export default useCollabRoomManager;