import { CSSProperties, useEffect, useState } from 'react';
import { Collapse, CollapseProps, Empty, Spin, theme } from 'antd';
import { supabase } from '@/config/supabase';
import { useAppSelector } from '@/store';
import dayjs from 'dayjs';

const Contracts = () => {
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const profile = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const handleFetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("order")
        .select("*")
        .eq("client_id", profile.profileId);

      if (error) {
        console.error("Error fetching order: ", error);
        return;
      }

      if (data) {
        const grouped = data.filter(o => o.status === "Accepted");
        setActiveOrders(grouped);
      }

    } catch (err) {
      console.error("Unexpected Error: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!profile.profileId) return;
    handleFetchOrders();
  }, []);

  const { token } = theme.useToken();

  const panelStyle: CSSProperties = {
    marginBottom: 20,
    background: token.colorFillAlter,
    borderRadius: token.borderRadiusLG,
    border: "none",
    fontSize: 17,
  };

  const contractData: CollapseProps['items'] = activeOrders.map((order, index) => ({
    key: order.id || index.toString(),
    label: order.title || `Contract #${index + 1}`,
    children: (
      <div style={{ fontWeight: "normal" }}>
        <p style={{ fontSize: 14 }}>{order.description}</p>
        <div style={{ fontSize: 12, color: "gray", marginTop: 5 }}>
          <span>{dayjs(order.start_datetime).format("MMMM D, YYYY") || 'Unknown Date'}-</span>
          <span>{dayjs(order.end_datetime).format("MMMM D, YYYY") || 'Unknown Date'}</span>
        </div>
      </div>
    ),
    style: panelStyle,
  }));

  if (loading) {
    return (
      <div className="container">
        <Spin size='large' />
      </div>
    );
  }

  return (
    <div className="container">
      <span className="heading">Active Contracts</span>
      {activeOrders.length > 0 ? (
        <Collapse
          bordered={false}
          style={{ background: token.colorBgContainer }}
          items={contractData}
        />
      ) : (
        <Empty description="No active contracts found" />
      )}
    </div>
  );
};

export default Contracts;