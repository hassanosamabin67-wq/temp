"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useSidebarContext } from "./sidebar-context";
import { FiMenu, FiChevronUp } from "react-icons/fi";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FC } from 'react';
import { Button } from "antd";
import { NAV_DATA, NAV_DATA_CLIENT } from "./data";
import { ProfileWithOwnership } from "@/types/userInterface";

const Sidebar: FC<{ profile: ProfileWithOwnership }> = ({ profile }) => {
    const pathname = usePathname();
    const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const sidebarData = profile.isClient ? NAV_DATA_CLIENT : NAV_DATA;

    const toggleExpanded = (title: string) => {
        setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    };

    useEffect(() => {
        sidebarData.some((section) => {
            return section.items.some((item) => {
                if (item.items && item.items.length > 0) {
                    return item.items.some((subItem) => {
                        if (subItem.url === pathname) {
                            if (!expandedItems.includes(item.title)) {
                                toggleExpanded(item.title);
                            }
                            return true;
                        }
                        return false;
                    });
                }
                return false;
            });
        });
    }, [pathname]);

    const isItemActive = (item: any) => {
        if (item.items && item.items.length > 0) {
            return item.items.some(({ url }: any) => url === pathname);
        }
        return pathname === item.url;
    };

    return (
        <>
            {isMobile && isOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {isMobile && (
                <Button
                    icon={<FiMenu />}
                    onClick={toggleSidebar}
                    className={styles.toggleSidebarBtn}
                />
            )}

            {isMobile && isOpen && (
                <Button
                    icon={<FaArrowLeftLong />}
                    onClick={toggleSidebar}
                    className={styles.toggleSidebarBtn}
                />
            )}

            <aside
                className={`${styles.sidebar} ${isMobile ? styles.mobile : styles.desktop} ${isOpen ? styles.open : styles.closed}`}
                aria-label="Main navigation"
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <div className={styles.sidebarContent}>
                    <div className={styles.navWrapper}>
                        {sidebarData.map((section) => (
                            <div key={section.label} className={styles.section}>
                                <span className={styles.sectionLabel}>{section.label}</span>
                                <nav role="navigation" aria-label={section.label}>
                                    <ul className={styles.menuList}>
                                        {section.items.map((item) => (
                                            <li key={item.title}>
                                                {item.items && item.items.length > 0 ? (
                                                    <div>
                                                        <button
                                                            className={`${styles.menuItem} ${styles.menuButton} ${isItemActive(item) ? styles.menuActiveLink : ""}`}
                                                            onClick={() => toggleExpanded(item.title)}
                                                        >
                                                            {/* <span className={styles.menuIcon}>
                                                                {item.icon && <item.icon />}
                                                            </span> */}
                                                            <span>{item.title}</span>
                                                            <FiChevronUp
                                                                className={`${styles.chevronIcon} ${expandedItems.includes(item.title)
                                                                    ? styles.chevronExpanded
                                                                    : styles.chevronCollapsed
                                                                    }`}
                                                            />
                                                        </button>

                                                        {expandedItems.includes(item.title) && (
                                                            <ul className={styles.subMenuList}>
                                                                {item.items.map((subItem) => (
                                                                    <li key={subItem.title}>
                                                                        <Link
                                                                            href={subItem.url}
                                                                            className={`${styles.subMenuItem} ${styles.subMenuLink} ${pathname === subItem.url
                                                                                ? styles.subMenuActiveLink
                                                                                : ""
                                                                                }`}
                                                                            onClick={() => isMobile && toggleSidebar()}
                                                                        >
                                                                            <span>{subItem.title}</span>
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Link
                                                        href={item.url || `/${item.title.toLowerCase().split(" ").join("-")}`}
                                                        className={`${styles.menuItem} ${styles.menuLinkUrl} ${pathname === (item.url || `/${item.title.toLowerCase().split(" ").join("-")}`)
                                                            ? styles.menuActiveLinkUrl
                                                            : ""
                                                            }`}
                                                        onClick={() => isMobile && toggleSidebar()}
                                                    >
                                                        {/* <span className={styles.menuIcon}>
                                                            {item.icon && <item.icon />}
                                                        </span> */}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default Sidebar;