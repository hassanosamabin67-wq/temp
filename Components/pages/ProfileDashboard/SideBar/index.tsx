"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./style.module.css";
import { useSidebarContext } from "./sidebar-context";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { FaArrowLeftLong } from "react-icons/fa6";
import { FC } from 'react';
import { Button } from "antd";
import { NAV_DATA, NAV_DATA_CLIENT } from "./data";
import { ProfileWithOwnership } from "@/types/userInterface";
import {
    LayoutDashboard,
    ShoppingBag,
    Briefcase,
    CreditCard,
    MessageSquare,
    Calendar,
    CheckCircle,
    Users,
    Settings,
    BarChart,
    Tv,
    Layout,
    User,
    Menu,
} from 'lucide-react';

const getIcon = (title: string) => {
    switch (title) {
        case "Profile":
        case "Dashboard": return LayoutDashboard;
        case "Orders": return ShoppingBag;
        case "Projects": return Briefcase;
        case "Collab Rooms": return Users;
        case "Earnings & Payments":
        case "Payments": return CreditCard;
        case "Messages": return MessageSquare;
        case "Subscription Management": return Calendar;
        case "My Subscriptions": return CheckCircle;
        case "Analytics & Insights": return BarChart;
        case "Add Management": return Tv;
        case "My Network": return Users;
        case "Profile Setting":
        case "Settings": return Settings;
        case "My Profile": return User;
        case "Overview": return LayoutDashboard;
        default: return Layout;
    }
};

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
                    icon={<Menu size={20} />}
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
                                        {section.items.map((item) => {
                                            const Icon = getIcon(item.title);
                                            return (
                                                <li key={item.title}>
                                                    {item.items && item.items.length > 0 ? (
                                                        <div>
                                                            <button
                                                                className={`${styles.menuItem} ${styles.menuButton} ${isItemActive(item) ? styles.menuActiveLink : ""}`}
                                                                onClick={() => toggleExpanded(item.title)}
                                                            >
                                                                <div className={styles.menuItemContent}>
                                                                    <Icon size={20} />
                                                                    <span>{item.title}</span>
                                                                </div>
                                                                <FiChevronUp
                                                                    className={`${styles.chevronIcon} ${expandedItems.includes(item.title)
                                                                        ? styles.chevronExpanded
                                                                        : styles.chevronCollapsed
                                                                        }`}
                                                                />
                                                            </button>

                                                            {expandedItems.includes(item.title) && (
                                                                <ul className={styles.subMenuList}>
                                                                    {item.items.map((subItem) => {
                                                                        const SubIcon = getIcon(subItem.title);
                                                                        return (
                                                                            <li key={subItem.title}>
                                                                                <Link
                                                                                    href={subItem.url}
                                                                                    className={`${styles.subMenuItem} ${styles.subMenuLink} ${pathname === subItem.url
                                                                                        ? styles.subMenuActiveLink
                                                                                        : ""
                                                                                        }`}
                                                                                    onClick={() => isMobile && toggleSidebar()}
                                                                                >
                                                                                    <div className={styles.subMenuItemContent}>
                                                                                        <SubIcon size={16} />
                                                                                        <span>{subItem.title}</span>
                                                                                    </div>
                                                                                </Link>
                                                                            </li>
                                                                        );
                                                                    })}
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
                                                            <div className={styles.menuItemContent}>
                                                                <Icon size={20} />
                                                                <span>{item.title}</span>
                                                            </div>
                                                        </Link>
                                                    )}
                                                </li>
                                            );
                                        })}
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
