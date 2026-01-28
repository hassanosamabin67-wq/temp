import { Form, Input, Button, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React from 'react';
import { DatePicker } from 'antd';

const DynamicFieldSet = ({ name, label }: any) => {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <>
          {fields.map((field: any) => (
            <Space key={field.key} style={{ display: "block", marginBottom: 15, borderBottom: "1px solid #ddd" }} align="baseline">
              <Form.Item
                {...field}
                name={[field.name, 'title']}
                fieldKey={[field.fieldKey, 'title']}
                rules={[{ required: true, message: 'Please input title' }]}
              >
                <Input placeholder="Title" />
              </Form.Item>
              <Form.Item
                {...field}
                name={[field.name, 'details']}
                fieldKey={[field.fieldKey, 'details']}
                rules={[{ required: true, message: 'Please input details' }]}
              >
                <Input.TextArea autoSize={{ minRows: 4 }} placeholder="Details" />
              </Form.Item>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <Form.Item
                    {...field}
                    name={[field.name, 'from']}
                    fieldKey={[field.fieldKey, 'from']}
                    rules={[{ required: true, message: 'Please select start date' }]}
                  >
                    <DatePicker format="YYYY-MM-DD" />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    name={[field.name, 'to']}
                    fieldKey={[field.fieldKey, 'to']}
                  >
                    <DatePicker format="YYYY-MM-DD" />
                  </Form.Item>
                </div>
                <MinusCircleOutlined style={{ marginBottom: 15, fontSize: 20 }} onClick={() => remove(field.name)} />
              </div>
            </Space>
          ))}
          <Form.Item>
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
              Add {label}
            </Button>
          </Form.Item>
        </>
      )}
    </Form.List>
  );
};

export default DynamicFieldSet;
