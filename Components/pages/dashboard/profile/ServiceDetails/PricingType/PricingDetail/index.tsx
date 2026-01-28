import React, { FC, useEffect, useState } from 'react';
import styles from './style.module.css';
import { FaClock, FaRepeat } from 'react-icons/fa6';
import { Button, DatePicker, Form, Input, Modal, Select, Switch, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ServiceBuyForm from './ServiceBuyForm';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabase';
import { createOfferMessageNotificationWithEmail } from '@/lib/notificationService';
import { useAppSelector } from '@/store';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type AddOn = { id?: string; name: string; price?: number; description?: string, enabled: boolean };
type Pkg = {
    key: string;
    label: string;
    title: string;
    description: string;
    price: number;
    serviceDeliveryTime?: string;
    revision?: number;
    addOns?: AddOn[];
};

interface packageProps {
    pkg: Pkg;
    currency?: string;
    serviceTitle: string;
    serviceId: string;
    serviceProviderId: string;
    availability: [{ d: any, i: number }];
}

const formatPrice = (value: number, currency: string = 'USD', locale: string = 'en-US') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);

const PricingDetail: FC<packageProps> = ({ pkg, availability, serviceId, serviceProviderId, serviceTitle }) => {
    const detectLocaleCurrency = () => {
        const locale = navigator.language || 'en-US';
        const localeCurrencyMap: Record<string, string> = {
            'en-US': 'USD',
            'en-GB': 'GBP',
            'en-PK': 'PKR',
            'fr-FR': 'EUR',
            'de-DE': 'EUR',
            'ja-JP': 'JPY',
        };

        const currency = localeCurrencyMap[locale] || 'USD';
        return { locale, currency };
    };

    const [locale, setLocale] = useState('en-US');
    const [currency, setCurrency] = useState('USD');
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const router = useRouter();
    const [uploadedImage, setUploadedImage] = useState<string[]>([]);
    const profile = useAppSelector((state) => state.auth);

    const toggleAddOn = (addOn: AddOn, checked: boolean) => {
        if (checked) {
            setSelectedAddOns((prev) => [...prev, addOn]);
        } else {
            setSelectedAddOns((prev) => prev.filter((a) => a.name !== addOn.name));
        }
    };

    const calculateTotalPrice = () => {
        const addOnsTotal = selectedAddOns.reduce(
            (sum, a) => sum + (a.price || 0),
            0
        );
        return pkg.price + addOnsTotal;
    };

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true);
            await form.validateFields();
            const values = await form.getFieldsValue();

            const orderPayload = {
                serviceId,
                serviceProviderId,
                packageName: pkg.title,
                amount: calculateTotalPrice(),
                basePrice: pkg.price,
                selectedAddOns,
                description: values.description,
                deadline: values.deadline,
                file_url: uploadedImage || []
            };

            setOrderData(orderPayload);
            setShowPayment(true);
        } catch (error) {
            console.error("Form validation error: ", error);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleImageChange = async (info: any) => {
        if (info.file.status === 'removed') {
            setUploadedImage((prev: string[]) =>
                prev.filter((url) => !url.includes(info.file.name))
            );
            return;
        }

        const file = info.file.originFileObj || info.file;
        if (!file) return;

        const filePath = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
            .from("service_order_files")
            .upload(filePath, file, {
                cacheControl: "3600",
                upsert: true,
            });

        if (error) {
            console.error("File upload error:", error);
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from("service_order_files")
            .getPublicUrl(filePath);

        if (publicUrlData?.publicUrl) {
            setUploadedImage((prev: string[]) => [...prev, publicUrlData.publicUrl]);
        }
    };

    const handlePaymentSuccess = async (paymentIntentId: string, orderId: string, totalAmount: number) => {
        try {
            router.push(`${window.location.origin}/payment-success?order=${orderId}`)
            handleSendRequest(orderId, profile.profileId!, serviceProviderId, totalAmount, serviceTitle, `${profile.firstName} ${profile.lastName}`)
            setIsModalVisible(false);
            setShowPayment(false);
            form.resetFields();
            setSelectedAddOns([]);
            setOrderData(null);
        } catch (error) {
            console.error("Error handling payment success: ", error);
        }
    };

    const handleSendRequest = async (orderId: string, clientId: string, visionaryId: string, amount: number, hireTitle: string, clientName: string) => {
        try {
            const { data: visionaryEmail, error: visionaryEmailError } = await supabase
                .from("users")
                .select("email")
                .eq("userId", visionaryId)
                .single()

            if (visionaryEmailError) {
                console.error("Error getting visionary email: ", visionaryEmailError);
                return
            }

            await supabase.from("contract_tool_usage").insert({
                user: clientId,
                for: orderId,
                contract_type: "Service-Agreement",
                project: hireTitle,
                payment: amount || null,
                status: "Active"
            })

            const { data: existingConversation, error: fetchError } = await supabase
                .from('inbox_conversation')
                .select('*')
                .or(`and(user1_id.eq.${clientId},user2_id.eq.${visionaryId}),and(user1_id.eq.${visionaryId},user2_id.eq.${clientId})`)
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
                        user1_id: clientId,
                        user2_id: visionaryId,
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
                await createOfferMessageNotificationWithEmail(clientId, clientName, visionaryId, `You have receive an offer from ${clientName}, please check your inbox`, visionaryEmail.email, hireTitle, orderId, "offer-received", 'New Offer received from', `${conversationId}?ch=${clientId}`)
            } catch (error) {
                console.error("Error Sending Offer Notification: ", error)
            }
        } catch (err) {
            console.error("Unexpected Error: ", err)
        }
    }

    useEffect(() => {
        const { locale, currency } = detectLocaleCurrency();
        setLocale(locale);
        setCurrency(currency);
    }, []);

    return (
        <>
            <div className={styles.pricingDetailMain}>
                <div className={styles.detailDiv}>
                    <div className={styles.pricingInfo}>
                        <span className={styles.pricingTitle}>{pkg.title}</span>
                        <span className={styles.price}>{formatPrice(pkg.price, currency)}</span>
                    </div>
                    <p className={styles.pricingDesc}>{pkg.description}</p>
                </div>

                {(pkg.serviceDeliveryTime || pkg.revision !== undefined) && (
                    <div className={styles.revisionDiv}>
                        {pkg.serviceDeliveryTime && (
                            <div className={styles.revisionContent}>
                                <span className={styles.revisionDivIcon}><FaClock /></span>
                                <span className={styles.revisionDivValue}>{pkg.serviceDeliveryTime} Delivery</span>
                            </div>
                        )}
                        {pkg.revision !== undefined && (
                            <div className={styles.revisionContent}>
                                <span className={styles.revisionDivIcon}><FaRepeat /></span>
                                <span className={styles.revisionDivValue}>
                                    {pkg.revision} {pkg.revision === 1 ? 'Revision' : 'Revisions'}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <div>
                    <span className={styles.subHeading}>Add-ons</span>
                    <ul className={styles.listStyle}>
                        {(pkg.addOns?.length ? pkg.addOns : []).map((a) => (
                            <li key={a.id ?? a.name}>
                                {a.name}{typeof a.price === 'number' ? ` (+${formatPrice(a.price, currency, locale)})` : ''}
                            </li>
                        ))}
                        {!pkg.addOns?.length && <li>No add-ons</li>}
                    </ul>
                </div>

                <div>
                    <span className={styles.subHeading}>Availability</span>
                    <ul className={`${styles.listStyle} ${styles.availabilityLists}`}>
                        {availability.map((d: any, i: number) => (
                            <li key={i} className={styles.list}>
                                {d.day}: {d.startTime} - {d.endTime}
                            </li>
                        ))}
                    </ul>
                </div>
                <Button variant='solid' color='cyan' className={styles.buyBtn} onClick={() => setIsModalVisible(true)}>
                    Buy Now
                </Button>
            </div>

            <Modal
                title="Service Details"
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setShowPayment(false);
                    setOrderData(null);
                }}
                footer={null}
                centered
                width={600}
            >
                {showPayment ? (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            mode: 'payment',
                            amount: Math.round((calculateTotalPrice() || 0) * 100),
                            currency: 'usd',
                        }}
                    >
                        <ServiceBuyForm
                            onCancel={() => setShowPayment(false)}
                            onSuccess={handlePaymentSuccess}
                            serviceId={serviceId}
                            serviceProviderId={serviceProviderId}
                            serviceTitle={serviceTitle}
                            totalAmount={calculateTotalPrice()}
                            servicePrice={pkg.price}
                            addOns={selectedAddOns}
                            orderData={orderData}
                        />
                    </Elements>
                ) : (
                    <>
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="description"
                                label="Describe what you need"
                                rules={[{ required: true, message: "Please describe your request" }]}
                            >
                                <Input.TextArea rows={4} placeholder="Enter your requirements..." />
                            </Form.Item>

                            <span className={styles.customLabel}>Reference files (Optional)</span>
                            <Upload onChange={handleImageChange} beforeUpload={() => false} multiple accept=".png,.jpg,.jpeg,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.webp">
                                <Button icon={<UploadOutlined />}>Click to Upload</Button>
                            </Upload>

                            <div className={styles.servicePurchaseAddOnsDiv}>
                                <span className={styles.customLabel}>Include Add-Ons (Optional)</span>
                                {(pkg.addOns?.length ? pkg.addOns : []).map((a) => (
                                    <div key={a.id ?? a.name} className={styles.servicePurchaseAddOns}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500, marginBottom: 2 }}>
                                                {a.name} (+${a.price})
                                            </div>
                                            <div style={{ fontSize: 12, color: "#666" }}>
                                                {a.description}
                                            </div>
                                        </div>
                                        <Switch
                                            size="small"
                                            onChange={(checked) => toggleAddOn(a, checked)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <Form.Item
                                name="deadline"
                                label="Choose deadline"
                                rules={[{ required: true, message: "Please pick a deadline" }]}
                            >
                                <DatePicker style={{ width: "100%" }} />
                            </Form.Item>
                        </Form>

                        <Button
                            className={styles.submitPurchaseBtn}
                            variant='solid'
                            color='blue'
                            onClick={handleSubmit}
                            loading={submitLoading}
                        >
                            Submit & Continue to Payment
                        </Button>
                    </>
                )}
            </Modal>
        </>
    );
};

export default PricingDetail;