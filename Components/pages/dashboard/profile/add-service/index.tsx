import React, { useState } from "react";
import { Modal, Form, Input, Button, Select, Typography, Space, Radio, Upload, Image, Checkbox, InputNumber, Tag, Card, Switch } from "antd";
import { PlusOutlined, UploadOutlined, InfoCircleOutlined } from "@ant-design/icons";
import ProfileVideo from "../profileContent/uploadVideo";
import { supabase } from "@/config/supabase";
import { useAppSelector } from "@/store";
import { UIFormItem } from "@/Components/custom";
import { useNotification } from "@/Components/custom/custom-notification";
import { menuData } from "@/utils/services";
import './style.css'
import ActionButton from "@/Components/UIComponents/ActionBtn";

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

function AddService() {
  const profile = useAppSelector((state) => state.auth);
  const [visible, setVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [profileVideoUrl, setProfileVideoUrl] = useState("");
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const availableDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedDays, setSelectedDays] = useState<SelectedDay[]>([]);
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }]);
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [serviceFormData, SetServiceFormData] = useState<any>({
    name: "",
    service_tagline: "",
    description: "",
    category: undefined,
    subcategory: undefined,
    show_portfolio: false,
    video: "",
    availability: [],
    faqs: [],
    tags: [],
    file: "",
    terms: false,
  });

  // Default add-ons for each package type
  const defaultAddOns: Record<string, AddOn[]> = {
    essential: [
      { id: "fast-delivery-1", name: "Fast Delivery (24h)", description: "Get your service delivered in 24 hours", price: 10, enabled: false },
      { id: "extra-revision-1", name: "Extra Revision", description: "Get 1 additional revision", price: 5, enabled: false },
    ],
    enhanced: [
      { id: "fast-delivery-2", name: "Fast Delivery (12h)", description: "Get your service delivered in 12 hours", price: 20, enabled: false },
      // { id: "extra-revision-2", name: "Extra Revisions (2x)", description: "Get 2 additional revisions", price: 15, enabled: false },
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

  const { notify } = useNotification();

  const addTag = () => {
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

  const timeOptions = [
    "12:00 AM",
    "1:00 AM",
    "2:00 AM",
    "3:00 AM",
    "4:00 AM",
    "5:00 AM",
    "6:00 AM",
    "7:00 AM",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
    "10:00 PM",
    "11:00 PM",
  ];

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

  const showModal = () => setVisible(true);
  const handleCancel = () => setVisible(false);

  const addFaq = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFaq = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(newFaqs);
  };

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

  const handleCategoryChange = (value: string) => {
    SetServiceFormData({ ...serviceFormData, category: value });

    const selectedCategory: any = menuData.find(
      (category) => category.category === value
    );

    const childCats = selectedCategory?.subcategories?.flatMap((subcat: any) => subcat.childCategories) || [];

    setSubcategories(childCats);
    form.setFieldsValue({ subcategory: undefined });
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

  // Validation function for pricing packages
  const validatePricingPackages = () => {
    const packages = Object.entries(pricingPackages);
    for (const [key, pkg] of packages) {
      if (!pkg.title?.trim()) {
        throw new Error(`Please enter title for ${key} package`);
      }
      if (!pkg.description?.trim()) {
        throw new Error(`Please enter description for ${key} package`);
      }
      if (pkg.price === null || pkg.price === undefined || pkg.price < 0) {
        throw new Error(`Please enter valid price for ${key} package`);
      }
    }
    return true;
  };

  const handleOk = async () => {
    try {
      setConfirmLoading(true);

      const values = await form.validateFields();

      // Validate all pricing packages
      validatePricingPackages();

      const payload = {
        ...serviceFormData,
        ...values,
        profileId: profile.profileId,
        video: profileVideoUrl,
        file: selectedImage,
        availability: selectedDays,
        faqs,
        tags,
        visibility: "PUBLIC",
        pricing_packages: Object.entries(pricingPackages)
          .map(([key, pkg]) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            title: pkg.title?.trim(),
            serviceDeliveryTime: pkg.serviceDeliveryTime,
            revision: pkg.revision,
            description: pkg.description?.trim(),
            price: pkg.price,
            addOns: pkg.addOns.filter(addOn => addOn.enabled)
          }))
      };

      const { error } = await supabase.from("service").insert([payload]);

      if (error) {
        console.error("Insert failed:", error);
        notify({
          type: "error",
          message: "Failed to add service. Please try again.",
        });
      } else {
        notify({ type: "success", message: "Service added successfully!" });
        form.resetFields();
        SetServiceFormData({
          name: "",
          description: "",
          service_tagline: "",
          category: undefined,
          subcategory: undefined,
          video: "",
          availability: [],
          show_portfolio: false,
          faqs: [],
          tags: [],
          file: "",
          terms: false,
        });
        setPricingPackages({
          essential: { title: "", description: "", serviceDeliveryTime: "", revision: 0, price: null, addOns: [...defaultAddOns.essential] },
          enhanced: { title: "", description: "", serviceDeliveryTime: "", revision: 0, price: null, addOns: [...defaultAddOns.enhanced] },
          exclusive: { title: "", description: "", serviceDeliveryTime: "", revision: 0, price: null, addOns: [...defaultAddOns.exclusive] },
        });
        setSelectedDays([]);
        setTags([]);
        setFaqs([{ question: "", answer: "" }]);
        setSelectedImage(null);
        setProfileVideoUrl("");
        setVisible(false);
      }
    } catch (err: any) {
      console.error("Validation failed:", err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const steps = [
    {
      title: "First",
      content: (
        <>
          <Form.Item
            name="name"
            rules={[
              { required: true, message: "Please enter the service name!" },
            ]}
          >
            <Input
              onChange={(e) =>
                SetServiceFormData({ ...serviceFormData, name: e.target.value })
              }
              placeholder="Enter service name"
            />
          </Form.Item>
          <Form.Item
            name="service_tagline"
            rules={[
              { required: true, message: "Please enter a short service tagline!" },
            ]}
          >
            <Input
              onChange={(e) =>
                SetServiceFormData({ ...serviceFormData, service_tagline: e.target.value })
              }
              placeholder="Enter a Short Service Tagline" />
          </Form.Item>
          <Form.Item name="description">
            <Input.TextArea
              onChange={(e) =>
                SetServiceFormData({
                  ...serviceFormData,
                  description: e.target.value,
                })
              }
              placeholder="Enter description"
              rows={4}
            />
          </Form.Item>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50% 49%",
              gap: 8,
              alignItems: "center",
            }}
          >
            <UIFormItem
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
              name="subcategory"
              rules={[
                { required: true, message: "Please select a subcategory" },
              ]}
            >
              <Select
                placeholder="Select a subcategory"
                onChange={(value) =>
                  SetServiceFormData({ ...serviceFormData, subcategory: value })
                }
              >
                {subcategories.map((subcategory: any) => (
                  <Option key={subcategory.id} value={subcategory.name}>
                    {subcategory.name}
                  </Option>
                ))}
              </Select>
            </UIFormItem>
          </div>
          <Form.Item name="video">
            <ProfileVideo
              profileVideoUrl={profileVideoUrl}
              setProfileVideoUrl={setProfileVideoUrl}
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: "Second",
      content: (
        <>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <InfoCircleOutlined style={{ color: "#1890ff", marginRight: 8 }} />
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
                  <Form.Item label="Title" required style={{ marginBottom: 8 }}>
                    <Input
                      placeholder={`Enter ${key} package title`}
                      value={pkg.title}
                      onChange={(e) => updatePackageField(key, "title", e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="Description" required style={{ marginBottom: 8 }}>
                    <Input.TextArea
                      rows={2}
                      placeholder={`Describe what's included in ${key} package`}
                      value={pkg.description}
                      onChange={(e) => updatePackageField(key, "description", e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item label="Price" required style={{ marginBottom: 8 }}>
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
                    <Form.Item label="Delivery Time" required style={{ marginBottom: 8 }}>
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

                    <Form.Item label="Revisions" required style={{ marginBottom: 8 }}>
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

          <Form.Item label="Show Portfolio Sample">
            <Switch
              checked={serviceFormData.show_portfolio}
              onChange={(checked) =>
                SetServiceFormData({
                  ...serviceFormData,
                  show_portfolio: checked,
                })
              }
            />
          </Form.Item>

          <Form.Item name="Tags">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onPressEnter={addTag}
              placeholder="Enter a tag and press Enter"
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 15,
              }}
            >
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

          <Form.Item name="availability">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "8px",
                marginBottom: 20,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Availability:
              </span>
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
                  <Checkbox onChange={() => handleCheckboxChange(day)}>
                    {day}
                  </Checkbox>
                  {selectedDays.some((d: { day: any }) => d.day === day) && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <Select
                        placeholder="Start Time"
                        onChange={(value) =>
                          handleTimeChange(day, "startTime", value)
                        }
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
                        onChange={(value) =>
                          handleTimeChange(day, "endTime", value)
                        }
                        style={{ width: "100%" }}
                        disabled={
                          !selectedDays.find((d: { day: any }) => d.day === day)
                            ?.startTime
                        }
                      >
                        {getFilteredEndTimes(
                          selectedDays.find((d: { day: any }) => d.day === day)
                            ?.startTime
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
        </>
      ),
    },
    {
      title: "second Last",
      content: (
        <>
          <Form.Item name="faqs" label="Frequently Asked Questions">
            {faqs.map((faq, index) => (
              <Space
                key={index}
                style={{ display: "flex", marginBottom: 8 }}
                align="baseline"
              >
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

            <Button
              type="dashed"
              onClick={() => addFaq()}
              icon={<PlusOutlined />}
            >
              Add More FAQ
            </Button>
          </Form.Item>
        </>
      ),
    },
    {
      title: "last",
      content: (
        <Form.Item name="file">
          <div
            style={{
              margin: "0 0 25px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {selectedImage && (
              <div style={{ marginTop: 10 }}>
                <Image width={200} src={selectedImage} alt="Selected Image" />
              </div>
            )}
            <div
              style={{ width: "100%", display: "flex", justifyContent: "end" }}
            >
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
      ),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();

      // If on pricing step, validate all packages
      if (currentStep === 1) {
        validatePricingPackages();
      }

      setCurrentStep(currentStep + 1);
    } catch (err: any) {
      notify({
        type: "error",
        message: err.message || "Please fill all required fields correctly.",
      });
    }
  };

  const prev = () => setCurrentStep(currentStep - 1);

  return (
    <>
      <ActionButton icon={<PlusOutlined />} onClick={showModal}>
        Add Service
      </ActionButton>
      <Modal
        title={
          <Title level={4} style={{ marginBottom: 0 }}>
            Add New Service
          </Title>
        }
        open={visible}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        footer={null}
        centered
        className="add-service-modal"
      >
        <Text type="secondary">
          Fill in the details below to add your service.
        </Text>
        <div className="add-modal-div">
          <Form
            form={form}
            layout="vertical"
            name="add_service_form"
            style={{ marginTop: 20 }}
          >
            {steps[currentStep].content}
          </Form>

          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
            }}
          >
            <Button onClick={handleCancel}>Cancel</Button>
            <div>
              {currentStep > 0 && (
                <Button style={{ margin: "0 10px 0 0" }} onClick={() => prev()}>
                  Previous
                </Button>
              )}

              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={() => next()}>
                  Next
                </Button>
              )}

              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  onClick={handleOk}
                  htmlType="submit"
                  disabled={!profileVideoUrl}
                  loading={confirmLoading}
                >
                  Done
                </Button>
              )}
            </div>
          </Space>
        </div>
      </Modal>
    </>
  );
}

export default AddService;