import React, { useEffect } from 'react';
import { Modal, Typography, Button, Checkbox, InputNumber } from 'antd';
import { FaFileSignature, FaDonate } from 'react-icons/fa';
import dayjs from 'dayjs';
import StripePayment from '../StripePayment';

const { Title } = Typography;

type Profile = {
    firstName: string;
    lastName: string;
    profileId?: any;
};

type ThinkTankHost = {
    firstName: string;
    lastName: string;
};

type NdaModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    showStepper?: boolean;
    showJoinButton?: boolean;
    paymentAmount?: number;
    profile: Profile | any;
    thinkTankHost?: ThinkTankHost | null;
    loading?: boolean;
    step?: number;
    onNextStep?: () => void;
    onPrevStep?: () => void;
    checked: boolean;
    setChecked: (val: boolean) => void;
    isJoinDisabled?: boolean;
    buttonLabel?: string;
    selectedTankId?: string;
    isDonationBased?: boolean;
    donationAmount?: number;
    setDonationAmount?: (amount: number) => void;
    fromInvite?: boolean
};

const NdaModal: React.FC<NdaModalProps> = ({
    open,
    onClose,
    onConfirm,
    showStepper = false,
    showJoinButton = false,
    profile,
    thinkTankHost,
    paymentAmount,
    step = 0,
    onNextStep,
    onPrevStep,
    checked,
    setChecked,
    loading = false,
    isJoinDisabled = false,
    buttonLabel = 'Join for Free',
    selectedTankId,
    isDonationBased = false,
    donationAmount = 0,
    setDonationAmount,
    fromInvite
}) => {

    useEffect(() => {
        if (open) setChecked(false);
    }, [open]);

    const renderAgreementContent = () => (
        <div style={{ maxHeight: 400, overflowY: 'auto', padding: '20px 35px', backgroundColor: '#f1f1f1', borderRadius: 15, display: "flex", flexDirection: "column", gap: 25 }}>
            <div>
                <span className="block-span agreement-header-heading">Mutual Non-Disclosure Agreement (NDA)</span>
                <span className="block-span">This Mutual Non-Disclosure Agreement (the “Agreement”) is entered into as of {dayjs().format("MMMM DD, YYYY")} by and between the following parties:</span>
            </div>

            <div>
                <div>
                    <span style={{ fontWeight: "bold" }}>Disclosing Party: </span>
                    <span>{profile.firstName} {profile.lastName}</span>
                </div>
                <div>
                    <span style={{ fontWeight: "bold" }}>Service Provider: </span>
                    <span>{thinkTankHost && thinkTankHost.firstName + ' ' + thinkTankHost.lastName}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                    <p>The Parties wish to explore a potential collaboration or service agreement through Kaboom Collab. In connection with this, either Party may disclose or receive confidential or proprietary information.</p>
                </div>
            </div>

            <div>
                <ol>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">Definition of Confidential Information:</span>
                        <span>“Confidential Information” includes any non-public, proprietary, or sensitive materials, ideas, methods, creative content, business strategies, and other data shared between the Parties for the purpose of collaboration.</span>
                    </li>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">Obligations of Service Provider:</span>
                        <span>The Service Provider agrees to:</span>
                        <ul className='inside-list'>
                            <li>Use the Confidential Information solely for the purpose of evaluating a collaboration.</li>
                            <li>Not disclose it to any third party without prior written consent.</li>
                            <li>Take reasonable steps to protect and secure the Confidential Information.</li>
                        </ul>
                    </li>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">Exclusions:</span>
                        <span>Confidential Information does not include information that:</span>
                        <ul className='inside-list'>
                            <li>Was publicly known at the time of disclosure.</li>
                            <li>Was independently developed without use of Confidential Information.</li>
                            <li>Is disclosed with written permission from the Disclosing Party.</li>
                            <li>Is required to be disclosed by law or court order.</li>
                        </ul>
                    </li>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">Term:</span>
                        <span>This Agreement will remain in effect for a period of two (2) years from the date of execution.</span>
                    </li>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">No License:</span>
                        <span>Nothing in this Agreement grants either Party any rights to the other’s intellectual property or content.</span>
                    </li>
                    <li className="agreement-point">
                        <span className="block-span agreement-point-heading">General:</span>
                        <span>This Agreement is governed by the laws of [Your State]. Any disputes shall be resolved in the appropriate courts located therein. This Agreement may be executed electronically and in counterparts.</span>
                    </li>
                </ol>
            </div>

            <div style={{ display: "flex", flexDirection: 'column', gap: 20 }}>
                <span className="block-span">IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.</span>
                <div style={{ display: "flex", flexDirection: 'column', gap: 30 }}>
                    <div>
                        <span className="block-span">Disclosing Party Signature: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{profile.firstName} {profile.lastName}</span></span>
                        <span className="block-span">Printed Name: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{profile.firstName} {profile.lastName}</span></span>
                        <span className="block-span">Date: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</span></span>
                    </div>
                    <div>
                        <span className="block-span">Service Provider Signature: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{thinkTankHost && thinkTankHost.firstName + ' ' + thinkTankHost.lastName}</span></span>
                        <span className="block-span">Printed Name: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{thinkTankHost && thinkTankHost.firstName + ' ' + thinkTankHost.lastName}</span></span>
                        <span className="block-span">Date: <span style={{ fontWeight: "bold", textDecoration: "underline" }}>{dayjs().format("MMMM DD, YYYY")}</span></span>
                    </div>
                </div>
            </div>

            <div>
                <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)}>Accept License Agreement</Checkbox>
            </div>
        </div>
    );

    const renderDonationContent = () => (
        <div style={{ padding: '20px 35px', display: "flex", flexDirection: "column", gap: 25, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    backgroundColor: '#2878b5',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    marginBottom: 20
                }}>
                    <FaDonate size={24} />
                </div>
                <Title level={3} style={{ marginBottom: 8 }}>Support This Collab Room</Title>
                <p style={{ color: '#666', marginBottom: 0 }}>
                    This is a donation-based room. You can contribute any amount to support the host and join the discussion.
                </p>
            </div>

            <div style={{ width: '100%', maxWidth: 300 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                    Donation Amount (USD)
                </label>
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1}
                    precision={2}
                    value={donationAmount}
                    onChange={(value) => setDonationAmount?.(value || 0)}
                    placeholder="Enter donation amount"
                    prefix="$"
                    size="large"
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: 8, textAlign: 'center' }}>
                    Minimum: $0 (You can join for free)
                </p>
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
                <p>Your donation helps support the host and keeps the community thriving!</p>
            </div>
        </div>
    );

    const renderContent = () => {
        if (!showStepper) return renderAgreementContent();

        switch (step) {
            case 0:
                return renderAgreementContent();
            case 1:
                return isDonationBased ? renderDonationContent() : (
                    <StripePayment
                        paymentAmount={paymentAmount ?? 0}
                        thinkTankId={selectedTankId}
                        profileId={profile.profileId}
                        setShowHireModal={onClose}
                        fromInvite={fromInvite}
                    />
                );
            case 2:
                return (
                    <StripePayment
                        paymentAmount={donationAmount}
                        thinkTankId={selectedTankId}
                        profileId={profile.profileId}
                        setShowHireModal={onClose}
                        fromInvite={fromInvite}
                    />
                );
            default:
                return null;
        }
    };

    const getMaxSteps = () => {
        if (!isDonationBased) return 1;
        return donationAmount > 0 ? 2 : 1;
    };

    const renderFooter = () => {
        if (showStepper) {
            const maxSteps = getMaxSteps();
            const isLastStep = step >= maxSteps;

            return (
                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'flex-end' }}>
                    {step > 0 && <Button style={{ marginRight: 10 }} onClick={onPrevStep}>Back</Button>}
                    {!isLastStep && (
                        <Button
                            type="primary"
                            onClick={onNextStep}
                            disabled={step === 0 && !checked}
                        >
                            {step === 1 && isDonationBased && donationAmount === 0 ? 'Join for Free' : 'Next'}
                        </Button>
                    )}
                </div>
            );
        }

        if (showJoinButton) {
            return (
                <div style={{ marginTop: 15, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        loading={loading}
                        disabled={!checked || isJoinDisabled}
                        onClick={onConfirm}
                    >
                        {buttonLabel}
                    </Button>
                </div>
            );
        }

        return null;
    };

    return (
        <Modal
            title={
                <Title level={2}>
                    <div style={{ padding: '5px 30px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ backgroundColor: '#2878b5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '100%', padding: 10 }}>
                            <FaFileSignature />
                        </span>
                        <span>Kaboom Collab – Mutual Non-Disclosure Agreement (NDA)</span>
                    </div>
                </Title>
            }
            open={open}
            onCancel={onClose}
            centered
            width={900}
            footer={null}
        >
            {renderContent()}
            {renderFooter()}
        </Modal>
    );
};

export default NdaModal;