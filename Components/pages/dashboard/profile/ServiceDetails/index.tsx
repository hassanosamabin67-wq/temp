'use client'
import React, { useEffect, useState } from 'react'
import { Avatar, Button, Carousel, Collapse, CollapseProps, Rate, Skeleton } from 'antd';
import "./style.css"
import Image from 'next/image';
import gigImage from "@/public/assets/img/audioengineering.png"
import { supabase } from '@/config/supabase';
import { useNotification } from '@/Components/custom/custom-notification';
import { createMessageNotification } from '@/lib/notificationService';
import { useAppSelector } from '@/store';
import { StarOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import styles from './style.module.css'
import ClientReviews from './ClientReviews';
import PricingType from './PricingType';
import PortfolioSample from '../PortfolioSample';
import RelatedServices from './RelatedServices';
import MaxWidthWrapper from '@/Components/UIComponents/MaxWidthWrapper';
import ActionButton from '@/Components/UIComponents/ActionBtn';

const ServiceDetailComponent = ({ serviceId }: any) => {
    const [serviceData, setServiceData] = useState<any>([]);
    const [loading, setLoading] = useState(false);
    const parsedAvailability = serviceData.availability ? JSON.parse(serviceData.availability) : [];
    const faqItems: CollapseProps['items'] = serviceData.faqs?.map((faq: any, index: number) => ({
        key: String(index + 1),
        label: <span className={styles.faqQuestion}>{faq.question}</span>,
        children: <p className={styles.faqAnswer}>{faq.answer}</p>,
    })) || [];
    const { notify } = useNotification();
    const [serviceVisibility, setServiceVisibility] = useState<string>("PUBLIC");
    const profile = useAppSelector((state) => state.auth);
    const [sendMessageLoading, setSendMessageLoading] = useState(false);
    const router = useRouter();
    const [btnLoading, setBtnLoading] = useState(false);

    const visitProfile = () => {
        setBtnLoading(true)
        router.push(`/dashboard/visionary?visionary=${serviceData.userDetail?.userId}`)
    }

    useEffect(() => {
        if (serviceData?.visibility) {
            setServiceVisibility(serviceData.visibility.toUpperCase());
        }
    }, [serviceData]);

    const handleFetchService = async (serviceId: string) => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("service")
                .select("*")
                .eq("id", serviceId)
                .single()
            if (error) {
                console.error("Error Fetching service data: ", error);
                return;
            }

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("userId, firstName, lastName, profileImage, country, title, skills")
                .eq("userId", data.profileId)
                .single()

            if (error) {
                console.error("Error Fetching user data: ", userError);
                return;
            }

            const reviews = data.reviews || [];
            const averageRating = reviews.length > 0 ? (reviews.reduce((sum: any, r: any) => sum + r, 0) / reviews.length).toFixed(1) : "0.0";

            setServiceData({
                ...data,
                userDetail: userData,
                averageRating
            });

        } catch (error) {
            console.error("Unexpected Error: ", error);
        } finally {
            setLoading(false)
        }
    };

    const getAvailabilityStatus = () => {
        if (!parsedAvailability.length) return [];

        const today = new Date();
        const currentDay = today.toLocaleString('en-US', { weekday: 'long' });
        const currentTime = today.getHours() + today.getMinutes() / 60;

        const parseTime = (timeStr: string) => {
            const [time, modifier] = timeStr.split(" ");
            let [hours, minutes] = time.split(":").map(Number);
            if (modifier === "PM" && hours !== 12) hours += 12;
            if (modifier === "AM" && hours === 12) hours = 0;
            return hours + minutes / 60;
        };

        return parsedAvailability.map((item: any) => {
            const isToday = item.day === currentDay;
            let isAvailableNow = false;

            if (isToday) {
                const start = parseTime(item.startTime);
                const end = parseTime(item.endTime);
                isAvailableNow = currentTime >= start && currentTime <= end;
            }

            return {
                ...item,
                isToday,
                isAvailableNow
            };
        });
    };
    const availability = getAvailabilityStatus();

    const generateQuoteRequestMessage = () => {
        return `Hi! I'm interested in your service "${serviceData.name}" and would like to request a custom quote. 

            Could you please provide a custom quote based on my specific requirements? I'd love to discuss the details with you.

            Thank you!`;
    };

    const handleOpenConversation = async (participantId: string, profileId: string) => {
        try {
            setSendMessageLoading(true)
            const message = generateQuoteRequestMessage()
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

            const messagePayload = {
                message,
                sender_id: profileId,
                message_type: "text"
            };

            const insertData = { ...messagePayload, receiver_id: participantId, inbox_conversation_id: conversationId };

            const { error } = await supabase.from("messages").insert([insertData]);

            if (error) {
                console.error('Message sending failed', error);
                return;
            }

            notify({ type: "success", message: 'Message Send!' });

            await createMessageNotification(profileId, `K.${profile.firstName}`, participantId, `Hi! I'm interested in your service "${serviceData.name}" and would like to request a custom quote.`, conversationId)

        } catch (err) {
            console.error('Unexpected error:', err);
        } finally { }
        setSendMessageLoading(false)
    }

    useEffect(() => {
        if (!serviceId) return;
        handleFetchService(serviceId)
    }, []);

    if (loading) {
        return (
            <div className={styles.servicePageContainer} style={{ minHeight: "80vh" }}>
                <div className={styles.mainContent}>
                    <div className={styles.leftContent} style={{ height: "100%" }}>
                        <Skeleton active />
                    </div>
                    <div className={styles.rightContent}>
                        <Skeleton active />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <MaxWidthWrapper withPadding={false} className={styles.servicePageContainer}>
            <div className={styles.serviceHeader}>
                <div className={styles.serviceInfo}>
                    <span className={styles.serviceName}>{serviceData.name}</span>
                    <p className={styles.serviceTagLine}>{serviceData.service_tagline || "No Tagline"}</p>
                </div>
                <div>
                    <div className={styles.serviceProviderDetail}>
                        {serviceData.userDetail?.profileImage ? (
                            <Image src={serviceData.userDetail?.profileImage} width={200} height={200} alt='user_image' className='service-user-img' />
                        ) : (
                            <Avatar icon={<UserOutlined />} size={50} />
                        )}
                        <div className={styles.userInfoDiv}>
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>
                                    <span style={{ color: "#F9B100" }}>K.</span>
                                    {serviceData.userDetail?.firstName} {serviceData.userDetail?.lastName}
                                </span>
                                <span className={styles.profileReviews}>
                                    {serviceData?.averageRating ? (
                                        <>
                                            <Rate value={parseFloat(serviceData?.averageRating)} disabled allowHalf />
                                            <span>({serviceData?.averageRating})</span>
                                        </>
                                    ) : (
                                        <Rate defaultValue={5} disabled allowHalf character={<StarOutlined style={{ color: "#dacd05" }} />} />
                                    )}
                                </span>
                                <span className={styles.userCountry}>{serviceData.userDetail?.country}</span>
                                <span className={styles.userTagLine}>{serviceData.userDetail?.title}</span>
                                <div className={styles.profileSkillsTagDiv}>
                                    <span className={styles.profileSkillTags}>UI/UX</span>
                                    <span className={styles.profileSkillTags}>MERN</span>
                                    <span className={styles.profileSkillTags}>Webflow</span>
                                    {serviceData.userDetail?.skills && serviceData.userDetail?.skills.map((skills: any, index: any) => (
                                        <span key={index} className={styles.profileSkillTags}>{skills}</span>
                                    ))}
                                </div>
                            </div>
                            <ActionButton loading={btnLoading} className={styles.viewProfileBtn} onClick={visitProfile}>View Profile</ActionButton>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.leftContent}>
                    <div className={styles.thumbnailCarousel}>
                        <Carousel className={styles.thumbnail} arrows infinite={false}>
                            {serviceData.file && (<Image src={serviceData.file || gigImage} className={styles.thumbnailImg} alt='Gig Image' width={500} height={500} />)}
                            <video controls width="526" className={styles.thumbnailVideo}>
                                <source src={serviceData.video} type="video/mp4" width="326" />
                                Your browser does not support the video tag.
                            </video>
                        </Carousel>
                    </div>
                    <div className={`${styles.rightContent} ${styles.rightContentMobile}`}>
                        <PricingType
                            availability={availability}
                            pricingPackage={serviceData.pricing_packages}
                            serviceProviderId={serviceData.userDetail?.userId}
                            serviceTitle={serviceData.name}
                            serviceId={serviceId}
                            bookingCounts={serviceData.bookings_count}
                        />
                        <div className={styles.rightContentSecond}>
                            <Button variant='solid' color='geekblue' className={styles.requestQuoteBtn} loading={sendMessageLoading} onClick={() => handleOpenConversation(serviceData.profileId, profile.profileId!)}>Request Quote for Custom Price</Button>
                        </div>
                    </div>
                    <div className={styles.serviceContentDiv}>
                        <span className={styles.subHeading}>Description:</span>
                        <p className={styles.serviceDescription}>{serviceData.description}</p>
                    </div>
                    {serviceData.show_portfolio && (
                        <div className={styles.serviceContentDiv}>
                            <span className={styles.subHeading}>Potfolio Samples</span>
                            <PortfolioSample userId={serviceData?.userDetail.userId} />
                        </div>
                    )}
                    <div className={styles.serviceContentDiv}>
                        <span className={styles.subHeading}>FAQ</span>
                        <Collapse
                            bordered={false}
                            style={{ backgroundColor: "white" }}
                            items={faqItems}
                        />
                    </div>
                    <div className={styles.serviceContentDiv}>
                        <div className={styles.testimonialDiv}>
                            {serviceData.review_message && serviceData.review_message.length > 0 ? (
                                serviceData.review_message.map((reviewDetail: any, index: any) => (
                                    <ClientReviews key={index} clientName={reviewDetail.clientName} reviewMessage={reviewDetail.reviewMessage} rating={reviewDetail.rating} />
                                ))
                            ) : (
                                <p>No Review</p>
                            )}
                        </div>
                        {(serviceData.review_message && serviceData.review_message.length > 4) && (<ActionButton>Show More</ActionButton>)}
                    </div>
                    <div className={styles.serviceContentDiv}>
                        <span className={styles.subHeading}>You may also like</span>
                        <RelatedServices category={serviceData.category} />
                    </div>
                </div>
                <div className={`${styles.rightContent} ${styles.rightContentBig}`}>
                    <PricingType
                        availability={availability}
                        pricingPackage={serviceData.pricing_packages}
                        serviceProviderId={serviceData.userDetail?.userId}
                        serviceTitle={serviceData.name}
                        serviceId={serviceId}
                        bookingCounts={serviceData.bookings_count}
                    />
                    <div className={styles.rightContentSecond}>
                        <Button variant='solid' color='geekblue' className={styles.requestQuoteBtn} loading={sendMessageLoading} onClick={() => handleOpenConversation(serviceData.profileId, profile.profileId!)}>Request Quote for Custom Price</Button>
                    </div>
                </div>
            </div>
        </MaxWidthWrapper>
    )
}

export default ServiceDetailComponent