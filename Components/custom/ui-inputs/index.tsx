"use client";
import { Input, InputProps } from "antd";
import "./style.css";
// import PhoneInput, { PhoneInputProps } from "react-phone-input-2";
export function UIInput(
  props: InputProps & { isSearch?: boolean } & {
    setIsSearchApplied?: (value: boolean) => void;
    onSearch?: (value: string) => void;
  } & {
    onSearchInvoice?: (value: string) => void;
  }
) {
  const { isSearch, setIsSearchApplied, onSearchInvoice, ...restProps } = props;
  return isSearch ? (
    <div className="maindevicon">
    <Input.Search
      {...props}
      classNames={{ input: "heyyyy" }}
      placeholder={props?.placeholder ?? "Search"}
      onSearch={(value) => {
        if (props.onSearchInvoice) {
          props.onSearchInvoice(value);
        } else if (props.onSearch) props.onSearch(value)
      }}
      onChange={(e) => {
        if (props.onSearchInvoice) {
          props.onSearchInvoice(e.target.value);
        }
        setIsSearchApplied && setIsSearchApplied!(e.target.value.trim() === "" ? false : true);
      }}
      enterButton
    />
    </div>
  ) : (
    <Input
      {...restProps}
      style={{ height: "50px", paddingRight: "0px" }}
      classNames={{ input: "heyyyy" }}
      autoComplete="new-password"
    />
  );
}

export function UIInputPassword(props: InputProps) {
  return (
    <Input.Password
      {...props}
      style={{ height: "50px" }}
      autoComplete="new-password"
    />
  ); // Set autoComplete to off
}
// export function CustomPhoneInput(props: PhoneInputProps) {
//   return (
//     <PhoneInput
//       {...props}
//       inputClass="ant-input-wrapper"
//       inputStyle={{ height: "50px", width: "100%", borderRadius: "10px" }}
//     />
//   );
// }
