"use client"
import { useAppSelector } from "@/store";
import { categories, categoriesContent, menuData } from "@/utils/services";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Card, Descriptions, Divider } from "antd";

function Profile() {
    const user = useAppSelector((state) => state.auth!);

    // Find the category title from categoriesContent using the user's category id
    const categoryTitle = menuData.find(cat => cat.id === user?.category)?.category || "Not specified";
    // Find subcategory title from menuData using the user's subcategory id
    const subcategoryTitle = menuData.find(menu => menu.subcategories.some(sub => sub.id === user?.subcategory))?.subcategories.find(sub => sub.id === user?.subcategory)?.name || "Not specified";

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
            <Card bordered={false}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                    <Avatar size={100} icon={<UserOutlined />} src={user?.profileImage} style={{ marginRight: 20 }} />
                    <div>
                        <h2>{user?.firstName} {user?.lastName}</h2>
                        <p>{user?.email}</p>
                    </div>
                </div>
                <Divider />
                <Descriptions title="User Info" column={2} layout="horizontal" bordered>
                    <Descriptions.Item label="Title">{user?.title}</Descriptions.Item>
                    <Descriptions.Item label="Category">{categoryTitle}</Descriptions.Item>
                    <Descriptions.Item label="Sub Category">{subcategoryTitle}</Descriptions.Item>
                    <Descriptions.Item label="Country">{user?.country}</Descriptions.Item>
                    <Descriptions.Item label="Joined Date">{user?.createdAt}</Descriptions.Item>
                    <Descriptions.Item label="Company Name">{user?.companyName}</Descriptions.Item>
                    <Descriptions.Item label="Experience Level">{user?.experienceLevel}</Descriptions.Item>
                    <Descriptions.Item label="Hourly Rate">${user?.hourlyRate}</Descriptions.Item>
                    <Descriptions.Item label="Roles">{user?.roles?.join(", ")}</Descriptions.Item>
                    <Descriptions.Item label="Website">{user?.website}</Descriptions.Item>
                    <Descriptions.Item label="Gender">{user?.gender}</Descriptions.Item>
                    <Descriptions.Item label="Date of Birth">{user?.dob ? user.dob.toLocaleDateString() : 'N/A'}</Descriptions.Item>
                </Descriptions>
            </Card>
        </div>
    );
}

export default Profile;
