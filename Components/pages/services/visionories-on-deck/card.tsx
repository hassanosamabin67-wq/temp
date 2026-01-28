import LoginModal from "@/Components/custom/login-modal";
import { useAppSelector } from "@/store";
import { Card, Button, Rate, Avatar } from "antd";
import { StarOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./visonories.module.css";
import Link from "next/link";
import { recordProfileStat } from "@/utils/profileStats";
import { BASE_URL } from "@/utils/constants/navigations";
import { updateClicksCount } from "@/lib/updateServiceClicks";
import { getBrandedNameParts } from "@/lib/brandName";
import ActionButton from "@/Components/UIComponents/ActionBtn";

const VisionaryCard = ({ data }: any) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const profile = useAppSelector((state) => state.auth);
  const router = useRouter();
  const curdesc = data?.description?.length > 100 ? data?.description?.slice(0, 100) + '...' : data?.description;
  const truTitle = data?.name?.length > 25 ? data?.name.slice(0, 25) + '...' : data?.name;
  const reviews = data?.reviews || [];
  const averageRating = reviews?.length > 0 ? (reviews?.reduce((sum: any, r: any) => sum + r, 0) / reviews?.length).toFixed(1) : "0.0";
  const [viewLoading, setViewLoading] = useState(false);
  const { prefix, name } = getBrandedNameParts(data?.visionaryData?.firstName, data?.visionaryData?.lastName);

  const handleLoginRedirect = () => {
    router.push("/login");
  };
  const openModal = async (id: string) => {
    try {
      recordProfileStat({
        profileId: profile.profileId!,
        userId: id,
        type: "click"
      });
      profile?.profileId ? router.push(`/${BASE_URL}?visionary=${id}`) : setIsModalVisible(true);
    } catch (error) {
      console.error("Unexpected Error: ", error)
    }
  }
  const closeModal = () => setIsModalVisible(false);

  const handleViewDetail = async (serviceId: string) => {
    try {
      setViewLoading(true)
      await updateClicksCount(profile.profileId!, serviceId)
      router.push(`/service-details/${data?.id}`)
    } catch (error) {
      console.error("Unexpected Error:", error);
    } finally {
      setViewLoading(false)
    }
  }

  return (
    <div className={styles.cardMain}>
      <Card className={styles.card} classNames={{ body: styles.card_body }}
        cover={
          data.video ? (
            <div className={styles.serviceVideoCard}>
              <video src={data.video} controls className={styles.cardVideo}>Your browser does not support the video tag.</video>
            </div>
          ) : (
            <div className={styles.serviceVideoCard}>
              <div className={styles.videoFallback}>No Video Available</div>
            </div>
          )
        }
      >
        <div className={styles.userDetails}>
          <Avatar size={40} icon={<UserOutlined />} />
          <span className={styles.visionaryName}>
            <span style={{ color: "#F9B100" }}>{prefix}</span>
            {name}
          </span>
        </div>
        <div className={styles.cardContent}>
          <span className={styles.serviceName}>{truTitle}</span>
          <span className={styles.price}>${data?.price}</span>
          <div className={styles.tagDiv}>
            <span className={`${styles.tag} ${styles.category}`}>{data.category}</span>
            <span className={`${styles.tag} ${styles.subcategory}`}>{data.subcategory}</span>
          </div>
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 3 }}>
            {data.reviews && data.reviews.length > 0 ? (
              <>
                <Rate value={parseFloat(averageRating)} disabled allowHalf />
                <span style={{ color: "black" }}>({averageRating})</span>
              </>
            ) : (
              <Rate defaultValue={5} disabled allowHalf character={<StarOutlined style={{ color: "#dacd05" }} />} />
            )}
          </div>
          <p className={styles.serviceDescription}>{curdesc}</p>
        </div>

        <div className={styles.cardFooter}>
          <ActionButton onClick={() => openModal(data?.profileId)} className={styles.viewProfileBtn}>
            View Profile
          </ActionButton>

          <Button onClick={() => handleViewDetail(data?.id)} className={styles.collabBtn} loading={viewLoading}>
            View Details{" "}
          </Button>
        </div>

        <LoginModal
          visible={isModalVisible}
          onClose={closeModal}
          handleLoginRedirect={handleLoginRedirect}
        />
      </Card>
    </div>
  );
};

export default VisionaryCard;
