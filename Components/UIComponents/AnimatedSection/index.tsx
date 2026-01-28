'use client'
import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';

interface AnimatedSectionProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export default function AnimatedSection({
    children,
    className = '',
    delay = 0,
}: AnimatedSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: `${delay}s` }}
            className={`${styles.container} ${isVisible ? styles.visible : styles.hidden
                } ${className}`}
        >
            {children}
        </div>
    );
}