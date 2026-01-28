import React, { useState } from "react";
import { Modal, Button, Form, Input, DatePicker, Empty } from 'antd';
import { EditFilled, PlusSquareOutlined } from "@ant-design/icons";
import "./style.css";
import dayjs from 'dayjs';
import { useDispatch, useSelector } from "react-redux";
import { setAuthData } from "@/store/slices/auth-slice";
import { RootState, useAppSelector } from "@/store";
import { supabase } from "@/config/supabase";
import { useSearchParams } from "next/navigation";

type ExperienceKeys = "experience" | "certifications" | "workshops" | "mentorships"

interface ContentCardProps {
  cardTitle: string;
  details: any;
  categoryKey: ExperienceKeys;
}

const formatDate = (date: any) => dayjs(date).format('MMM YYYY');

export const ExperienceForm = ({ visible, onCreate, onCancel, cardTitle }: any) => {
  const [form] = Form.useForm();
  return (
    <Modal
      open={visible}
      title={`Add/Edit ${cardTitle}`}
      okText="Save"
      cancelText="Cancel"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            form.resetFields();
            onCreate(values);
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{ modifier: 'public' }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input the title!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="details"
          label="Details"
          rules={[{ required: true, message: 'Please input the details!' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="from"
          label="From"
          rules={[{ required: true, message: 'Please select the start date!' }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
        <Form.Item
          name="to"
          label="To"
          rules={[{ required: true, message: 'Please select the end date!' }]}
        >
          <DatePicker format="YYYY-MM-DD" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ContentCard: React.FC<ContentCardProps> = ({ cardTitle, details, categoryKey }) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch()
  const authState = useSelector((state: RootState) => state.auth);
  const searchParams = useSearchParams();
  const visionary = searchParams.get('visionary');

  const onCreate = async (values: any) => {
    console.log("Received values of form: ", values);
    setVisible(false);

    const updatedAuthState = {
      ...authState,
      [categoryKey]: [...(authState[categoryKey] || []), values],
    };

    try {
      const { data, error } = await supabase
        .from("users")
        .update({ [categoryKey]: updatedAuthState[categoryKey] }) // Updating only the relevant field
        .eq("profileId", authState.profileId)
        .select();

      if (error) {
        console.error("Error updating Supabase:", error);
      } else {
        console.log("Updated data:", data);
        dispatch(setAuthData(updatedAuthState));
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  return (
    <div className="card-container">
      <div className="card-header">
        <h2>{cardTitle}</h2>
        {!visionary && <PlusSquareOutlined onClick={() => setVisible(true)} />}
      </div>
      <div style={{ maxHeight: "230px", overflow: "auto" }}>
        {Array.isArray(details) ? details.map((data: any, index: number) => (
          <div key={index} className="card-detail">
            <div className="card-detail-header">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2>{data.title}</h2>
                {!visionary && <span><EditFilled /></span>}
              </div>
              <h4>
                {formatDate(data.from)} - {formatDate(data.to)}
              </h4>
            </div>
            <div className="card-detail-body">
              {data.details}
            </div>
          </div>
        )) : <Empty />}
      </div>
      <ExperienceForm
        visible={visible}
        onCreate={onCreate}
        onCancel={() => setVisible(false)}
        cardTitle={cardTitle}
      />
    </div>
  );
};

export default ContentCard;
