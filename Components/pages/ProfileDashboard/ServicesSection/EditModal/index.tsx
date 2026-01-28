import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Select, Typography, Space, Radio, InputNumber, Upload, Image, Checkbox, Tag, Card, Switch } from "antd";
import { PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { UIFormItem } from "@/Components/custom";
import { supabase } from "@/config/supabase";
import { useAppSelector } from "@/store";
import { useNotification } from "@/Components/custom/custom-notification";
import { menuData } from "@/utils/services";
import ProfileVideo from "../uploadVideo";
import styles from './sytle.module.css'

const { Title, Text } = Typography;
const { Option } = Select;

interface SelectedDay {
    day: string;
    startTime: string;
    endTime: string;
}

interface AddOn {
    id: string;
    name: string;
    description: string;
    price: number;
    enabled: boolean;
}

interface PricingPackage {
    title: string;
    description: string;
    serviceDeliveryTime: string;
    revision: number;
    price: number | null;
    addOns: AddOn[];
}

const EditModal = ({ service, visible, handleCancel }: any) => {
    const profile = useAppSelector((state) => state.auth);
    const { notify } = useNotification();
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [profileVideoUrl, setProfileVideoUrl] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedDays, setSelectedDays] = useState<SelectedDay[]>([]);
    const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
    const [tags, setTags] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [price, setPrice] = useState<{ priceType: string; value: number | null }>({
        priceType: "hourly",
        value: null,
    });
    const [form] = Form.useForm();
    const defaultAddOns: Record<string, AddOn[]> = {
        essential: [
            { id: "fast-delivery-1", name: "Fast Delivery (24h)", description: "Get your service delivered in 24 hours", price: 10, enabled: false },
            { id: "extra-revision-1", name: "Extra Revision", description: "Get 1 additional revision", price: 5, enabled: false },
        ],
        enhanced: [
            { id: "fast-delivery-2", name: "Fast Delivery (12h)", description: "Get your service delivered in 12 hours", price: 20, enabled: false },
            { id: "priority-support", name: "Priority Support", description: "Get priority customer support", price: 10, enabled: false },
        ],
        exclusive: [
            { id: "fast-delivery-3", name: "Express Delivery (6h)", description: "Get your service delivered in 6 hours", price: 50, enabled: false },
            { id: "unlimited-revisions", name: "Unlimited Revisions", description: "Get unlimited revisions for 30 days", price: 40, enabled: false }
        ],
    };

    const [pricingPackages, setPricingPackages] = useState<Record<string, PricingPackage>>({
        essential: { title: "", description: "", price: null, serviceDeliveryTime: "", revision: 0, addOns: [...defaultAddOns.essential] },
        enhanced: { title: "", description: "", price: null, serviceDeliveryTime: "", revision: 0, addOns: [...defaultAddOns.enhanced] },
        exclusive: { title: "", description: "", price: null, serviceDeliveryTime: "", revision: 0, addOns: [...defaultAddOns.exclusive] },
    });

    const availableDays = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];

    const timeOptions = [
        "12:00 AM", "1:00 AM", "2:00 AM", "3:00 AM", "4:00 AM", "5:00 AM",
        "6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
        "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM", "11:00 PM",
    ];

    useEffect(() => {
        if (visible && service) {
            const selectedCategory: any = menuData.find(
                (category) => category.category === service.category
            );
            const childCats = selectedCategory?.subcategories?.flatMap((subcat: any) => subcat.childCategories) || [];
            setSubcategories(childCats);

            // Parse JSON strings if they are strings, otherwise use as-is
            const parseTags = (tags: any) => {
                if (typeof tags === 'string') {
                    try {
                        return JSON.parse(tags);
                    } catch (error) {
                        console.error('Error parsing tags:', error);
                        return [];
                    }
                }
                return Array.isArray(tags) ? tags : [];
            };

            const parseAvailability = (availability: any) => {
                if (typeof availability === 'string') {
                    try {
                        return JSON.parse(availability);
                    } catch (error) {
                        console.error('Error parsing availability:', error);
                        return [];
                    }
                }
                return Array.isArray(availability) ? availability : [];
            };

            const parseFaqs = (faqs: any) => {
                if (typeof faqs === 'string') {
                    try {
                        return JSON.parse(faqs);
                    } catch (error) {
                        console.error('Error parsing faqs:', error);
                        return [{ question: "", answer: "" }];
                    }
                }
                return Array.isArray(faqs) && faqs.length > 0 ? faqs : [{ question: "", answer: "" }];
            };

            // Initialize all state variables with proper parsing
            setProfileVideoUrl(service.video || "");
            setSelectedImage(service.file || null);
            setSelectedDays(parseAvailability(service.availability));
            setFaqs(parseFaqs(service.faqs));
            setTags(parseTags(service.tags));
            setPrice({
                priceType: service.priceType || "fixed",
                value: service.price ? parseFloat(service.price) : null,
            });

            // Parse pricing packages (new model)
            const parsePricingPackages = (pp: any) => {
                let list: any[] = [];
                if (typeof pp === 'string') {
                    try { list = JSON.parse(pp) || []; } catch (_) { list = []; }
                } else if (Array.isArray(pp)) {
                    list = pp;
                }
                const byKey: any = { ...pricingPackages };
                list.forEach((pkg: any) => {
                    const key = pkg.key || (pkg.label?.toLowerCase());
                    if (!key) return;
                    byKey[key] = {
                        title: pkg.title || "",
                        description: pkg.description || "",
                        serviceDeliveryTime: pkg.serviceDeliveryTime || "",
                        revision: Number(pkg.revision) || 0,
                        price: pkg.price ?? null,
                        addOns: (pkg.addOns && Array.isArray(pkg.addOns)) ? pkg.addOns.map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            description: a.description,
                            price: Number(a.price) || 0,
                            enabled: true,
                        })) : [...(defaultAddOns[key] || [])],
                    };
                });
                setPricingPackages(byKey);
            };
            parsePricingPackages(service.pricing_packages);

            form.setFieldsValue({
                name: service.name,
                service_tagline: service.service_tagline,
                description: service.description,
                category: service.category,
                subcategory: service.subcategory,
                show_portfolio: Boolean(service.show_portfolio),
                terms: service.terms,
            });
        }
    }, [visible, service, form]);

    const handleCategoryChange = (value: string) => {
        const selectedCategory: any = menuData.find(
            (category) => category.category === value
        );

        const childCats = selectedCategory?.subcategories?.flatMap((subcat: any) => subcat.childCategories) || [];

        setSubcategories(childCats);
        form.setFieldsValue({ subcategory: undefined });
    };

    // Tags management
    const addTag = (e?: React.KeyboardEvent) => {
        if (e) {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event bubbling
        }

        if (inputValue.trim() && !tags.includes(inputValue)) {
            if (tags.length < 5) {
                setTags([...tags, inputValue.trim()]);
                setInputValue("");
            } else {
                notify({ type: "warning", message: "You can only add up to 5 tags." });
            }
        }
    };

    const removeTag = (removedTag: string) => {
        setTags(tags.filter((tag) => tag !== removedTag));
    };

    const updatePackageField = (packageKey: string, field: keyof PricingPackage, value: any) => {
        setPricingPackages(prev => ({
            ...prev,
            [packageKey]: {
                ...prev[packageKey],
                [field]: value
            }
        }));
    };

    const toggleAddOn = (packageKey: string, addOnId: string) => {
        setPricingPackages(prev => ({
            ...prev,
            [packageKey]: {
                ...prev[packageKey],
                addOns: prev[packageKey].addOns.map(addOn =>
                    addOn.id === addOnId ? { ...addOn, enabled: !addOn.enabled } : addOn
                )
            }
        }));
    };

    // FAQ management
    const addFaq = () => {
        setFaqs([...faqs, { question: "", answer: "" }]);
    };

    const removeFaq = (index: number) => {
        const newFaqs = faqs.filter((_: any, i: number) => i !== index);
        setFaqs(newFaqs);
    };

    // Availability management
    const handleCheckboxChange = (day: string) => {
        setSelectedDays((prevDays: any) => {
            if (prevDays.some((d: { day: any }) => d.day === day)) {
                return prevDays.filter((d: { day: any }) => d.day !== day);
            } else {
                return [...prevDays, { day, startTime: "", endTime: "" }];
            }
        });
    };

    const handleTimeChange = (day: string, field: string, value: any) => {
        setSelectedDays((prevDays: any) =>
            prevDays.map((d: { day: string }) =>
                d.day === day ? { ...d, [field]: value } : d
            )
        );
    };

    const getFilteredEndTimes = (startTime: any) => {
        const startIndex = timeOptions.indexOf(startTime);
        if (startIndex === -1) return [];
        return [...timeOptions.slice(startIndex + 1), ...timeOptions.slice(0, startIndex + 1)];
    };

    // Image upload
    const handleImageUpload = async (file: any) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (e.target?.result) {
                const fileName = `${file?.file.name}-${Date.now()}`;
                const { data, error } = await supabase.storage
                    .from("profile")
                    .upload(
                        `${profile?.profileId}/${fileName}`,
                        file.file.originFileObj,
                        {
                            cacheControl: "3600",
                            upsert: false,
                            contentType: file.file.type,
                        }
                    );

                if (error) {
                    notify({
                        message: "Image upload failed",
                        type: "error",
                    });
                    console.error(error);
                    return;
                }

                const publicUrl =
                    process.env.NEXT_PUBLIC_SUPABASE_URL +
                    "/storage/v1/object/public/profile/" +
                    data.path;

                setSelectedImage(publicUrl);
            }
        };
        reader.readAsDataURL(file.file.originFileObj);
        return false;
    };

    const handleSubmit = async (values: any) => {
        console.log(values, "values");

        const updatedService = {
            ...values,
            video: profileVideoUrl,
            file: selectedImage,
            availability: selectedDays,
            faqs,
            tags,
            pricing_packages: Object.entries(pricingPackages).map(([key, pkg]) => ({
                key,
                label: key.charAt(0).toUpperCase() + key.slice(1),
                title: pkg.title?.trim(),
                serviceDeliveryTime: pkg.serviceDeliveryTime,
                revision: pkg.revision,
                description: pkg.description?.trim(),
                price: pkg.price,
                addOns: pkg.addOns.filter(a => a.enabled)
            })),
        };

        const { data, error } = await supabase
            .from("service")
            .update(updatedService)
            .eq("id", service.id)
            .select("*");

        if (error) {
            console.error('Update Failed:', error);
            notify({
                type: "error",
                message: "Failed to update service. Please try again.",
            });
            return;
        }

        console.log(data, "data");
        notify({ type: "success", message: "Service updated successfully!" });
        handleCancel(); // optionally close modal after update
    };

    return (
        <Modal
            title={<Title level={4} style={{ marginBottom: 0 }}>Edit Service</Title>}
            open={visible}
            onCancel={handleCancel}
            footer={null}
            centered
            className={styles.editServiceModal}
        >
            <Text type="secondary">
                Fill in the details below to edit your service.
            </Text>
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    name="edit_service_form"
                    style={{ marginTop: 20 }}
                >
                    <Form.Item
                        name="name"
                        label={<Text strong>Service Name</Text>}
                        rules={[{ required: true, message: "Please enter the service name!" }]}
                    >
                        <Input placeholder="Enter service name" />
                    </Form.Item>

                    <Form.Item
                        name="service_tagline"
                        label={<Text strong>Service Tagline</Text>}
                        rules={[{ required: true, message: "Please enter a short service tagline!" }]}
                    >
                        <Input placeholder="Enter a Short Service Tagline" />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label={<Text strong>Description</Text>}
                    >
                        <Input.TextArea placeholder="Enter description" rows={4} />
                    </Form.Item>

                    <UIFormItem
                        label={<Text strong>Category</Text>}
                        name="category"
                        rules={[{ required: true, message: "Please select a category" }]}
                    >
                        <Select
                            placeholder="Select a category"
                            onChange={handleCategoryChange}
                        >
                            {menuData.map((category) => (
                                <Option key={category.id} value={category.category}>
                                    {category.category}
                                </Option>
                            ))}
                        </Select>
                    </UIFormItem>

                    <UIFormItem
                        label={<Text strong>Subcategory</Text>}
                        name="subcategory"
                        rules={[{ required: true, message: "Please select a subcategory" }]}
                    >
                        <Select placeholder="Select a subcategory">
                            {subcategories.map((subcategory: any) => (
                                <Option key={subcategory.id} value={subcategory.name}>
                                    {subcategory.name}
                                </Option>
                            ))}
                        </Select>
                    </UIFormItem>

                    <Form.Item name="video" label={<Text strong>Video</Text>}>
                        <ProfileVideo
                            profileVideoUrl={profileVideoUrl}
                            setProfileVideoUrl={setProfileVideoUrl}
                        />
                    </Form.Item>

                    {/* Pricing Packages (new model) */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                            <Text strong>All three pricing packages are required</Text>
                        </div>
                        {Object.entries(pricingPackages).map(([key, pkg]) => (
                            <Card key={key} size="small" title={
                                <span style={{ textTransform: "capitalize", fontWeight: 600 }}>
                                    {key} Package
                                </span>
                            }
                                style={{ marginBottom: 16 }}
                            >
                                <div style={{ display: "grid", gap: 12 }}>
                                    <Form.Item label={<Text strong>Title</Text>} required style={{ marginBottom: 8 }}>
                                        <Input
                                            placeholder={`Enter ${key} package title`}
                                            value={pkg.title}
                                            onChange={(e) => updatePackageField(key, "title", e.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>Description</Text>} required style={{ marginBottom: 8 }}>
                                        <Input.TextArea
                                            rows={2}
                                            placeholder={`Describe what's included in ${key} package`}
                                            value={pkg.description}
                                            onChange={(e) => updatePackageField(key, "description", e.target.value)}
                                        />
                                    </Form.Item>

                                    <Form.Item label={<Text strong>Price</Text>} required style={{ marginBottom: 8 }}>
                                        <InputNumber
                                            addonBefore="$"
                                            min={0}
                                            style={{ width: "100%" }}
                                            placeholder="Enter price in USD"
                                            value={pkg.price ?? undefined}
                                            onChange={(v) => updatePackageField(key, "price", v ?? null)}
                                        />
                                    </Form.Item>

                                    <div style={{ display: "grid", gridTemplateColumns: "50% 49%", gap: 8, alignItems: "center" }}>
                                        <Form.Item label={<Text strong>Delivery Time</Text>} required style={{ marginBottom: 8 }}>
                                            <Select
                                                placeholder="Delivery Time"
                                                allowClear
                                                value={pkg.serviceDeliveryTime}
                                                onChange={(v) => updatePackageField(key, "serviceDeliveryTime", v)}
                                            >
                                                <Option value="24 Hours">24 Hours</Option>
                                                <Option value="3 Days">3 Days</Option>
                                                <Option value="7 Days">7 Days</Option>
                                                <Option value="14+ Days">14+ Days</Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item label={<Text strong>Revisions</Text>} required style={{ marginBottom: 8 }}>
                                            <InputNumber
                                                min={0}
                                                placeholder="Enter the number of revisions"
                                                value={pkg.revision}
                                                style={{ width: "100%" }}
                                                onChange={(n) => updatePackageField(key, "revision", n ?? 0)}
                                            />
                                        </Form.Item>
                                    </div>

                                    <div>
                                        <Text strong style={{ display: "block", marginBottom: 8 }}>Add-ons (Optional)</Text>
                                        <div style={{ display: "grid", gap: 8 }}>
                                            {pkg.addOns.map((addOn) => (
                                                <div
                                                    key={addOn.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "8px 12px",
                                                        border: "1px solid #f0f0f0",
                                                        borderRadius: 6,
                                                        backgroundColor: addOn.enabled ? "#f6ffed" : "#fafafa",
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 500, marginBottom: 2 }}>
                                                            {addOn.name} (+${addOn.price})
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "#666" }}>
                                                            {addOn.description}
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        size="small"
                                                        checked={addOn.enabled}
                                                        onChange={() => toggleAddOn(key, addOn.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <Form.Item label={<Text strong>Show Portfolio Sample</Text>} name="show_portfolio" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    {/* Tags */}
                    <Form.Item label={<Text strong>Tags</Text>}>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onPressEnter={(e) => {
                                e.preventDefault();
                                addTag(e);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addTag(e);
                                }
                            }}
                            placeholder="Enter a tag and press Enter"
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 15 }}>
                            {tags.map((tag) => (
                                <Tag
                                    key={tag}
                                    closable
                                    onClose={() => removeTag(tag)}
                                    style={{ fontSize: "14px", padding: "4px 8px" }}
                                >
                                    {tag}
                                </Tag>
                            ))}
                        </div>
                    </Form.Item>

                    {/* Availability */}
                    <Form.Item label={<Text strong>Availability</Text>}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginBottom: 20 }}>
                            {availableDays.map((day, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "30% 70%",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <Checkbox
                                        checked={selectedDays.some((d: { day: any }) => d.day === day)}
                                        onChange={() => handleCheckboxChange(day)}
                                    >
                                        {day}
                                    </Checkbox>
                                    {selectedDays.some((d: { day: any }) => d.day === day) && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <Select
                                                placeholder="Start Time"
                                                value={selectedDays.find((d: { day: any }) => d.day === day)?.startTime}
                                                onChange={(value) => handleTimeChange(day, "startTime", value)}
                                                style={{ width: "100%" }}
                                            >
                                                {timeOptions.map((time) => (
                                                    <Option key={time} value={time}>
                                                        {time}
                                                    </Option>
                                                ))}
                                            </Select>
                                            <Select
                                                placeholder="End Time"
                                                value={selectedDays.find((d: { day: any }) => d.day === day)?.endTime}
                                                onChange={(value) => handleTimeChange(day, "endTime", value)}
                                                style={{ width: "100%" }}
                                                disabled={!selectedDays.find((d: { day: any }) => d.day === day)?.startTime}
                                            >
                                                {getFilteredEndTimes(
                                                    selectedDays.find((d: { day: any }) => d.day === day)?.startTime
                                                ).map((time) => (
                                                    <Option key={time} value={time}>
                                                        {time}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Form.Item>

                    {/* FAQs */}
                    <Form.Item label={<Text strong>Frequently Asked Questions</Text>}>
                        {faqs.map((faq: any, index: number) => (
                            <Space key={index} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                                <Input
                                    placeholder="Enter question"
                                    value={faq.question}
                                    onChange={(e) => {
                                        const newFaqs = [...faqs];
                                        newFaqs[index].question = e.target.value;
                                        setFaqs(newFaqs);
                                    }}
                                />
                                <Input
                                    placeholder="Enter answer"
                                    value={faq.answer}
                                    onChange={(e) => {
                                        const newFaqs = [...faqs];
                                        newFaqs[index].answer = e.target.value;
                                        setFaqs(newFaqs);
                                    }}
                                />
                                <Button type="link" onClick={() => removeFaq(index)}>
                                    Remove
                                </Button>
                            </Space>
                        ))}
                        <Button type="dashed" onClick={() => addFaq()} icon={<PlusOutlined />}>
                            Add More FAQ
                        </Button>
                    </Form.Item>

                    {/* Image Upload */}
                    <Form.Item label={<Text strong>Service Image</Text>}>
                        <div style={{ margin: "0 0 25px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {selectedImage && (
                                <div style={{ marginTop: 10 }}>
                                    <Image width={200} src={selectedImage} alt="Selected Image" />
                                </div>
                            )}
                            <div style={{ width: "100%", display: "flex", justifyContent: "end" }}>
                                <Upload
                                    accept="image/*"
                                    showUploadList={false}
                                    onChange={handleImageUpload}
                                >
                                    <Button type="primary" icon={<UploadOutlined />}>
                                        Upload Image
                                    </Button>
                                </Upload>
                            </div>
                        </div>
                    </Form.Item>

                    <Space style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <Button onClick={handleCancel}>Cancel</Button>
                        <Button type="primary" htmlType="submit">Submit</Button>
                    </Space>
                </Form>
        </Modal>
    );
};

export default EditModal;