'use client'
import React, { useEffect, useState } from 'react'
import styles from './style.module.css'
import { Card, Carousel } from 'antd'
import { supabase } from '@/config/supabase'
import VisionaryCard from '@/Components/pages/services/visionories-on-deck/card'
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css"
import "swiper/css/navigation"

interface RelatedServicesProps {
    category: string;
}

const RelatedServices = ({ category }: RelatedServicesProps) => {
    const [relatedServices, setRelatedServices] = useState<any[]>([])
    const [loadingServices, setLoadingServices] = useState(false)

    const handleGetAllServices = async () => {
        try {
            setLoadingServices(true)

            const { data: services, error: servicesError } = await supabase
                .from("service")
                .select("*")
                .eq("category", category)

            if (servicesError || !services) {
                console.error("Error fetching services:", servicesError)
                return
            }

            const userIds = [...new Set(services.map(service => service.profileId))]

            const { data: users, error: usersError } = await supabase
                .from("users")
                .select("*")
                .in("profileId", userIds)

            if (usersError || !users) {
                console.error("Error fetching users:", usersError)
                return
            }

            const combined = services.map(service => {
                const user = users.find(u => u.profileId === service.profileId)
                return {
                    ...service,
                    visionaryData: user,
                }
            })

            setRelatedServices(combined)

        } catch (error) {
            console.error("Unexpected Error:", error)
        } finally {
            setLoadingServices(false)
        }
    }

    useEffect(() => {
        if (category) {
            handleGetAllServices()
        }
    }, [category])

    return (
        <div>
            <Swiper
                spaceBetween={20}
                slidesPerView={3} // default (desktop)
                navigation
                modules={[Navigation]}
                className={styles.gigSlider}
                breakpoints={{
                    // Mobile (<= 640px)
                    0: {
                        slidesPerView: 1,
                        spaceBetween: 12,
                    },

                    // Tablet (>= 640px)
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 12,
                    },

                    // Desktop (>= 1024px)
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 50,
                    },
                }}
            >
                {relatedServices.map((service, index) => (
                    <SwiperSlide key={index}>
                        <VisionaryCard data={service} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    )
}

export default RelatedServices
