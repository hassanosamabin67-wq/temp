import { Button, Modal, Typography, DatePicker, TimePicker, Form } from 'antd'
import React, { FC, useState } from 'react'
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useNotification } from '@/Components/custom/custom-notification';

const { Title, Text } = Typography;

type modalProps = {
    open: boolean;
    onSubmit: (nextCallDate: Date, nextCallTime: Date) => void;
    onClose: () => void;
}

const SetNextCallModal: FC<modalProps> = ({ open, onClose, onSubmit }) => {
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedTime, setSelectedTime] = useState<Dayjs | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [form] = Form.useForm();
    const { notify } = useNotification()

    const handleSubmit = async () => {
        try {
            setSubmitLoading(true)
            if (!selectedDate || !selectedTime) {
                notify({ type: "error", message: 'Please select both date and time for the next call' })
                return;
            }

            const callDate = selectedDate.toDate();
            const callTime = selectedTime.toDate();

            const combinedDateTime = selectedDate
                .hour(selectedTime.hour())
                .minute(selectedTime.minute())
                .second(0);

            if (combinedDateTime.isBefore(dayjs())) {
                notify({ type: "error", message: 'Please select a future date and time' })
                return;
            }

            await onSubmit(callDate, callTime);
            handleClose();
        } catch (error) {
            console.error("Unexpected error:", error)
        } finally {
            setSubmitLoading(false)
        }
    };

    const handleClose = () => {
        setSelectedDate(null);
        setSelectedTime(null);
        form.resetFields();
        onClose();
    };

    const disabledDate = (current: Dayjs) => {
        return current && current <= dayjs().startOf('day');
    };

    const disabledTime = () => {
        if (!selectedDate) return {};

        if (selectedDate.isSame(dayjs(), 'day')) {
            const now = dayjs();
            return {
                disabledHours: () => {
                    const hours = [];
                    for (let i = 0; i < now.hour(); i++) {
                        hours.push(i);
                    }
                    return hours;
                },
                disabledMinutes: (selectedHour: number) => {
                    if (selectedHour === now.hour()) {
                        const minutes = [];
                        for (let i = 0; i <= now.minute(); i++) {
                            minutes.push(i);
                        }
                        return minutes;
                    }
                    return [];
                }
            };
        }
        return {};
    };

    return (
        <Modal
            title={
                <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                    Schedule Next Call
                </Title>
            }
            open={open}
            onCancel={handleClose}
            footer={null}
            centered
            width={450}
            destroyOnClose
        >
            <div style={{ padding: '20px 0' }}>
                <Text type="secondary" style={{ fontSize: '14px', marginBottom: '20px', display: 'block' }}>
                    Select the date and time for your next session
                </Text>

                <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
                    <Form.Item
                        label={
                            <span style={{ fontWeight: 500 }}>
                                <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Select Date
                            </span>
                        }
                        required
                    >
                        <DatePicker
                            value={selectedDate}
                            onChange={(date) => setSelectedDate(date)}
                            style={{ width: '100%', height: '40px' }}
                            placeholder="Choose a date"
                            disabledDate={disabledDate}
                            format="dddd, MMMM D, YYYY"
                            showNow={false}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span style={{ fontWeight: 500 }}>
                                <ClockCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                                Select Time
                            </span>
                        }
                        required
                    >
                        <TimePicker
                            value={selectedTime}
                            onChange={(time) => setSelectedTime(time)}
                            style={{ width: '100%', height: '40px' }}
                            placeholder="Choose a time"
                            format="h:mm A"
                            use12Hours
                            disabledTime={disabledTime}
                        />
                    </Form.Item>

                    {selectedDate && selectedTime && (
                        <div style={{
                            background: '#f6ffed',
                            border: '1px solid #b7eb8f',
                            borderRadius: '6px',
                            padding: '12px',
                            marginTop: '16px'
                        }}>
                            <Text style={{ color: '#389e0d', fontWeight: 500 }}>
                                Schedule next session for: {' '}
                                {selectedDate
                                    .hour(selectedTime.hour())
                                    .minute(selectedTime.minute())
                                    .format('dddd, MMMM D, YYYY at h:mm A')
                                }
                            </Text>
                        </div>
                    )}
                </Form>

                <div style={{
                    marginTop: '30px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <Button
                        onClick={handleClose}
                        size="large"
                        style={{ minWidth: '100px' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSubmit}
                        size="large"
                        style={{ minWidth: '100px' }}
                        disabled={!selectedDate || !selectedTime}
                        loading={submitLoading}
                    >
                        Schedule Session
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default SetNextCallModal