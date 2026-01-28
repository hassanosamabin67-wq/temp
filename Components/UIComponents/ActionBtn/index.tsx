import { FC, ReactNode } from 'react'
import { Button, ButtonProps } from 'antd'
import styles from './styles.module.css'
import clsx from 'clsx';

interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
    text?: ReactNode;
    children?: ReactNode;
}

const ActionButton: FC<ActionButtonProps> = ({
    text,
    children,
    className,
    ...restProps
}) => {
    return (
        <Button
            className={clsx(styles.actionBtn, className)}
            {...restProps}
        >
            {children ?? text}
        </Button>
    )
}

export default ActionButton