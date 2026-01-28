import React, { FC } from "react";
import { Checkbox } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";

interface CustomCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const UICheckbox: FC<CustomCheckboxProps> = ({
  label,
  checked,
  onChange,
}) => {
  const handleChange = (event: CheckboxChangeEvent) => {
    onChange(event.target.checked);
  };

  return (
    <Checkbox checked={checked} onChange={handleChange}>
      {label}
    </Checkbox>
  );
};

export default UICheckbox;
