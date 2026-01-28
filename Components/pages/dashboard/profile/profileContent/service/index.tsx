import React, { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import { useAppSelector } from "@/store";
import { Button, Dropdown, Empty, MenuProps, Pagination, PaginationProps, Rate, Spin } from "antd";
import "./style.css";
import AddService from "../../add-service";
import { useSearchParams } from "next/navigation";
import { EditFilled, StarFilled, StarOutlined } from "@ant-design/icons";
import EditModal from "./editModal";
import Link from "next/link";
import { IoEllipsisHorizontalSharp } from "react-icons/io5";
import { useNotification } from "@/Components/custom/custom-notification";
import ActionButton from "@/Components/UIComponents/ActionBtn";

function ServiceSection() {
  const searchParam = useSearchParams();
  const visionary: string | null = searchParam.get("visionary");
  const profileRedux = useAppSelector((state) => state.auth);
  const [profile, setProfile] = useState(profileRedux);
  const [visible, setVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const showModal = (service: any) => {
    setSelectedService(service);
    setVisible(true);
  };
  const handleCancel = () => {
    setVisible(false);
    setSelectedService(null);
  };

  useEffect(() => {
    if (visionary) {
      fetchVisionaries();
    } else {
      setProfile(profileRedux); // Reset profile if no visionary is provided
    }
  }, [visionary, profileRedux]);


  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
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

  const fetchVisionaries = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("profileId", visionary)
        .single();

      if (error) {
        console.error("Error fetching visionary:", error);
        return;
      }

      if (data) {
        setProfile(data as any);
      }
    } catch (err) {
      console.error("Unexpected error fetching visionary:", err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("service")
        .select("*")
        .eq("profileId", visionary || profileRedux.profileId);

      if (visionary) {
        query = query.eq("visibility", "PUBLIC");
      }

      const { data, error } = await query;

      if (error) {
        setError(error);
      } else {
        const servicesWithRatings = (data || []).map(service => {
          const reviews = service.reviews || [];
          const avg = reviews.length > 0 ? (reviews.reduce((sum: any, r: any) => sum + r, 0) / reviews.length).toFixed(1) : "0.0";
          return {
            ...service,
            averageRating: parseFloat(avg),
          };
        });
        setServices(servicesWithRatings);
      }
    } catch (err) {
      console.error("Unexpected error fetching services:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile.profileId) {
      fetchServices();
    }
  }, [profile.profileId]);

  if (loading)
    return (
      <div>
        <Spin />
      </div>
    );
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="service-section-profilevisionary">
      <div className="serviceProfileElementsMainCont">
        <div className="serviceProfileElementsMainCont-left">
          <h1 className="service-title">Service Details</h1>
          {visionary !== profile.profileId && <AddService />}
        </div>
        {services.length > 0 ? (
          <div className="service-list">
            {paginatedServices.map((service: any) => {
              const truncatedDescription = service?.description?.length > 100
                ? service.description.slice(0, 100) + "......"
                : service?.description;
              const truncatedTitle = service?.name?.length > 50
                ? service.name.slice(0, 50) + "......"
                : service?.name;
              return (
                <div key={service.id} className="service-card" style={{ position: 'relative' }}>
                  <div className="header-btns">
                    {
                      service.visibility === 'PRIVATE' && profileRedux.profileId === service.profileId && (
                        <div style={{
                          backgroundColor: '#ff4d4f',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          zIndex: 1
                        }}>
                          Private
                        </div>
                      )
                    }
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
                      <Button className="visibility-btn" type="text" icon={<IoEllipsisHorizontalSharp />} size="small" />
                    </Dropdown>
                    {/* Private Service Tag - Only visible to service owner */}
                  </div>
                  {
                    service.video && (
                      <div className="service-video">
                        <video controls width="326">
                          <source src={service.video} type="video/mp4" width="326" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    )
                  }
                  <div className="service-content">
                    <Link className="service-link" href={`/service-details/${service.id}`}>
                      <span className="service-name">{truncatedTitle}</span>
                      <p style={{ wordWrap: "break-word" }} className="service-description">{truncatedDescription}</p>
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
                    {visionary !== profile.profileId &&
                      <div>
                        <span style={{ display: "flex", justifyContent: "end" }}>
                          <ActionButton onClick={() => showModal(service)} >Edit Services</ActionButton>
                        </span>
                      </div>
                    }
                  </div>

                  {/* <div className="service-timestamp">
                <small>Created at: {new Date(service.created_at).toLocaleString()}</small>
                <br />
                <small>Updated at: {new Date(service.updated_at).toLocaleString()}</small>
              </div> */}
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
              // pageSize={cardsPerPage}
              defaultCurrent={currentPage}
            />
          )}

      </div>

      {/* Single EditModal instance outside the map */}
      {
        selectedService && (
          <EditModal
            service={selectedService}
            visible={visible}
            handleCancel={handleCancel}
            fetchServices={fetchServices}
          />
        )
      }
    </div >
  );
}

export default ServiceSection;
