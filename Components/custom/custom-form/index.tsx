"use client";
import { Form, FormItemProps, FormProps } from "antd";
import React, { ReactNode } from "react";

interface CustomFormProps extends FormProps {
  children: ReactNode;
}

export function UIForm(props: CustomFormProps) {
  return (
    <Form layout="vertical" autoComplete="new-password" {...props}>
      {props.children}
    </Form>
  );
}
export function UIFormItem(props: FormItemProps) {
  return <Form.Item {...props}>{props.children}</Form.Item>;
}
