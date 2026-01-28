import React, { useState } from 'react';
import { Button, DatePicker, Form, Input, Select } from 'antd';
import dayjs from 'dayjs';

interface Task {
    taskName: string;
    priority: 'Top Priority' | 'Medium Priority' | 'Low Priority';
    deadline: dayjs.Dayjs;
}

const TaskManager: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [form] = Form.useForm();

    const priorityColors: Record<Task['priority'], string> = {
        'Top Priority': 'red',
        'Medium Priority': '#5AC8FA',
        'Low Priority': 'green'
    };

    const addTask = (values: Task) => {
        setTasks([...tasks, values]);
        form.resetFields();
    };

    return (
        <div className='container'>
            <h2>Task Manager</h2>
            <div style={{ border: '1px solid #e3e3e3', padding: 30, borderRadius: 8, margin: "15px 0" }}>
                <div style={{ borderBottom: '1px solid #e3e3e3', marginBottom: 20 }}>
                    <span style={{ fontSize: 20, fontWeight: 500, marginBottom: 10, display: "block" }}>Add Task</span>
                    <Form form={form} onFinish={addTask} style={{ display: "grid", alignItems: 'center', gap: 10, gridTemplateColumns: '25% 18% 15% 10%' }}>
                        <Form.Item name="taskName" rules={[{ required: true, message: 'Please enter a task' }]}>
                            <Input placeholder='Enter task...' />
                        </Form.Item>
                        <Form.Item name="priority" rules={[{ required: true, message: 'Please select priority' }]}>
                            <Select placeholder="Priority">
                                <Select.Option value="Top Priority">Top Priority</Select.Option>
                                <Select.Option value="Medium Priority">Medium Priority</Select.Option>
                                <Select.Option value="Low Priority">Low Priority</Select.Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="deadline" rules={[{ required: true, message: 'Please select deadline' }]}>
                            <DatePicker placeholder='Deadline' />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">Add Task</Button>
                        </Form.Item>
                    </Form>
                </div>

                <div>
                    <span style={{ fontSize: 20, fontWeight: 500, marginBottom: 10, display: "block" }}>Upcoming Tasks</span>
                    <div style={{ border: "1px solid #e3e3e3", padding: "12px 20px", borderRadius: 8, textAlign: "center" }}>
                        <div style={{ display: 'grid', gridTemplateColumns: "repeat(4, 1fr)", padding: 10, fontSize: 16 }}>
                            <span style={{ borderRight: '1px solid #e3e3e3', marginRight: 15 }}>Task Name</span>
                            <span style={{ borderRight: '1px solid #e3e3e3', marginRight: 15 }}>Priority</span>
                            <span style={{ borderRight: '1px solid #e3e3e3', marginRight: 15 }}>Deadline</span>
                            <span>Action</span>
                        </div>
                        {tasks.map((task, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid #e3e3e3", padding: 10, fontSize: 13, alignItems: "center" }}>
                                <span>{task.taskName}</span>
                                <span style={{ color: priorityColors[task.priority] }}>{task.priority}</span>
                                <span>{task.deadline.format('MM/DD/YYYY')}</span>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Button color='default' variant='outlined'>Completed</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskManager;