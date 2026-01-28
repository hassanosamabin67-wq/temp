import React, { useState, FC } from "react";
import { supabase } from "@/config/supabase";
import { Button, Dropdown, Empty, Pagination, PaginationProps, Rate } from "antd";
import { StarOutlined } from "@ant-design/icons";
import Link from "next/link";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { useNotification } from "@/Components/custom/custom-notification";
import AddService from "./addService";
import EditModal from "./EditModal";
import styles from './style.module.css'
import { updateClicksCount } from "@/lib/updateServiceClicks";
import { useAppSelector } from "@/store";
import ActionButton from "@/Components/UIComponents/ActionBtn";

const ServiceSection: FC<{ services: any[]; isOwnProfile: boolean }> = ({ services, isOwnProfile }) => {
    const [visible, setVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const profile = useAppSelector((state) => state.auth);

    const showModal = (service: any) => {
        setSelectedService(service);
        setVisible(true);
    };
    const handleCancel = () => {
        setVisible(false);
        setSelectedService(null);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const { notify } = useNotification()
    const [serviceVisibility, setServiceVisibility] = useState<string>("PUBLIC");

    const totalCards = services.length;
    const cardsPerPage = 3;
    const totalPages = Math.ceil(totalCards / cardsPerPage);

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const paginatedServices = services.slice(startIndex, endIndex);

    const onPageChange: PaginationProps['onChange'] = (page) => {
        setCurrentPage(page);
    };

    const privateVisibility = async (serviceId: string) => {
        try {
            const { error: updateError } = await supabase
                .from("service")
                .update({ visibility: "PRIVATE" })
                .eq('id', serviceId);

            if (updateError) {
                console.error("Error updating visibility: ", updateError);
                notify({ type: "error", message: "Error updating visibility" });
                return;
            }

            notify({ type: "success", message: `Visibility updated to PRIVATE` });
            setServiceVisibility("PRIVATE");
        } catch (error) {
            console.error("Unexpected Error: ", error);
        }
    };

    const publicVisibility = async (serviceId: string) => {
        try {
            const { error: updateError } = await supabase
                .from("service")
                .update({ visibility: "PUBLIC" })
                .eq('id', serviceId);

            if (updateError) {
                console.error("Error updating visibility: ", updateError);
                notify({ type: "error", message: "Error updating visibility" });
                return;
            }

            notify({ type: "success", message: `Visibility updated to PUBLIC` });
            setServiceVisibility("PUBLIC");
        } catch (error) {
            console.error("Unexpected Error: ", error);
        }
    };

    return (
        <div className={styles.serviceSectionProfilevisionary}>
            <div className={styles.serviceProfileElementsMainCont}>
                <div className={styles.serviceProfileElementsMainContLeft}>
                    {isOwnProfile && <AddService />}
                </div>
                {services.length > 0 ? (
                    <div className={styles.serviceList}>
                        {paginatedServices.map((service: any) => {
                            const truncatedDescription = service?.description?.length > 100
                                ? service.description.slice(0, 100) + "......"
                                : service?.description;
                            const truncatedTitle = service?.name?.length > 50
                                ? service.name.slice(0, 50) + "......"
                                : service?.name;
                            return (
                                <div key={service.id} className={styles.serviceCard} style={{ position: 'relative' }}>
                                    <div className={styles.headerBtns}>
                                        {(service.visibility === 'PRIVATE' && isOwnProfile) && (
                                            <div className={styles.privateTag}>
                                                Private
                                            </div>
                                        )}
                                        <Dropdown menu={{
                                            items: [{
                                                key: "1",
                                                label: "Change visibility to Private",
                                                onClick: () => privateVisibility(service.id)
                                            },
                                            {
                                                key: "2",
                                                label: "Change visibility to Public",
                                                onClick: () => publicVisibility(service.id)
                                            }]
                                        }} trigger={['click']}>
                                            <Button className={styles.visibilityBtn} type="text" icon={<IoEllipsisHorizontalSharp />} size="small" />
                                        </Dropdown>
                                        {/* Private Service Tag - Only visible to service owner */}
                                    </div>
                                    {
                                        service.video && (
                                            <div className={styles.serviceVideo}>
                                                <video controls width="326">
                                                    <source src={service.video} type="video/mp4" width="326" />
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        )
                                    }
                                    <div className={styles.serviceContent}>
                                        <Link className={styles.serviceLink} href={`/service-details/${service.id}`} onClick={() => updateClicksCount(profile.profileId!, service.id)}>
                                            <span className={styles.serviceName}>{truncatedTitle}</span>
                                            <p className={styles.serviceDescription}>{truncatedDescription}</p>
                                        </Link>
                                        <div style={{ margin: "10px 0" }}>
                                            <div style={{ marginBottom: 5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                {service.priceType && (
                                                    service.priceType === "hourly" ? (
                                                        <span style={{ display: "block", color: "black", fontSize: 16, fontWeight: 500, }}>
                                                            ${parseFloat(service.price).toFixed(2)}/hr
                                                        </span>
                                                    ) : service.priceType === "fixed" ? (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 5, color: "black", }}>
                                                            <span style={{ fontSize: 16, fontWeight: 500 }}>Fixed Price: </span>
                                                            <span style={{ fontSize: 16 }}>${parseFloat(service.price).toFixed(2)}</span>
                                                        </div>
                                                    ) : null
                                                )}
                                                {service.serviceDeliveryTime && (
                                                    <span style={{ fontSize: 15, fontWeight: 500, color: "gray" }}>{service.serviceDeliveryTime} delivery</span>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                {service?.averageRating ? (
                                                    <>
                                                        <Rate value={parseFloat(service?.averageRating)} disabled allowHalf />
                                                        <span style={{ marginLeft: 8 }}>({service?.averageRating})</span>
                                                    </>
                                                ) : (
                                                    <Rate defaultValue={5} disabled allowHalf character={<StarOutlined style={{ color: "#dacd05" }} />} />
                                                )}
                                            </div>
                                        </div>
                                        {isOwnProfile &&
                                            <div>
                                                <span style={{ display: "flex", justifyContent: "end" }}>
                                                    <ActionButton onClick={() => showModal(service)} >Edit Services</ActionButton>
                                                </span>
                                            </div>
                                        }
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <Empty description="No services found." />
                )}
                {
                    totalCards > 3 && (
                        <Pagination
                            style={{ margin: "20px 0" }}
                            align="end"
                            current={currentPage}
                            onChange={onPageChange}
                            total={totalPages * 10}
                            defaultCurrent={currentPage}
                        />
                    )}

            </div>
            {
                selectedService && (
                    <EditModal
                        service={selectedService}
                        visible={visible}
                        handleCancel={handleCancel}
                    />
                )
            }
        </div >
    );
}

export default ServiceSection;