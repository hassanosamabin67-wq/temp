"use client";

import { Popover, PopoverProps } from "antd";
import React, { ReactNode } from "react";

type CustomPopoverProps = PopoverProps & {
  content: ReactNode; // Content to display inside the popover
  title?: ReactNode; // Optional title for the popover
  children: ReactNode; // The component to trigger the popover
};

const CustomPopover: React.FC<CustomPopoverProps> = ({
  content,
  title,
  trigger = "hover",
  placement = "top",
  children,
  ...props
}) => {
  return (
    <Popover content={content} title={title} trigger={trigger} placement={placement} {...props}>
      {children}
    </Popover>
  );
};

export default CustomPopover;
