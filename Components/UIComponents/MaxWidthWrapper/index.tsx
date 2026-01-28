import React, { HTMLAttributes, CSSProperties } from 'react';
import styles from './MaxWidthWrapper.module.css';
import { cn } from '@/utils/classNames';

interface MaxWidthWrapperProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  maxWidth?: number;
  withPadding?: boolean;
}


const MaxWidthWrapper = ({
  className,
  children,
  maxWidth = 1340,
  withPadding = true,
  style,
  ...props
}: MaxWidthWrapperProps) => {
  const wrapperStyles: CSSProperties = {
    maxWidth: `${maxWidth}px`,
    ...style,
  };

  return (
    <div
      className={cn(
        styles.wrapper,
        { [styles.padding]: withPadding },
        className
      )}
      style={wrapperStyles}
      {...props}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;