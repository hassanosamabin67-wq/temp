import { BASE_URL, BASE_URL_CLIENT } from "@/utils/constants/navigations";

export interface NavItem {
    title: string;
    url: string;
    items?: NavItem[];
}

export interface NavSection {
    label: string;
    items: NavItem[];
}

export const NAV_DATA: NavSection[] = [
    {
        label: "MAIN MENU",
        items: [
            {
                title: "Profile",
                url: "/profile-visionary",
                items: [
                    {
                        title: "Overview",
                        url: `/${BASE_URL}/overview`,
                    },
                    {
                        title: "My Profile",
                        url: `/${BASE_URL}`,
                    }
                ]
            },
            {
                title: "Orders",
                url: `/${BASE_URL}/orders`,
                items: []
            },
            {
                title: "Projects",
                url: `/${BASE_URL}/projects`,
                items: []
            },
            {
                title: "Collab Rooms",
                url: `/${BASE_URL}/collab-room`,
                items: []
            },
            {
                title: "Earnings & Payments",
                url: `/${BASE_URL}/earnings`,
                items: []
            },
            {
                title: "Add Management",
                url: `/${BASE_URL}/ads`,
                items: []
            },
            {
                title: "Subscription Management",
                url: `/${BASE_URL}/subscription-management`,
                items: []
            },
            {
                title: "My Subscriptions",
                url: `/${BASE_URL}/my-subscription`,
                items: []
            },
            {
                title: "Analytics & Insights",
                url: `/${BASE_URL}/analytics`,
                items: []
            },
            {
                title: "Profile Setting",
                url: `/${BASE_URL}/setting`,
                items: []
            }
        ],
    },
];

export const NAV_DATA_CLIENT: NavSection[] = [
    {
        label: "MAIN MENU",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard/client",
                items: [
                    {
                        title: "Overview",
                        url: `/${BASE_URL_CLIENT}/overview`,
                    },
                    {
                        title: "Profile",
                        url: `/${BASE_URL_CLIENT}`,
                    }
                ]
            },
            {
                title: "Orders",
                url: `/${BASE_URL_CLIENT}/orders`,
                items: []
            },
            {
                title: "Projects",
                url: `/${BASE_URL_CLIENT}/projects`,
                items: []
            },
            {
                title: "Payments",
                url: `/${BASE_URL_CLIENT}/payments`,
                items: []
            },
            {
                title: "Messages",
                url: `/${BASE_URL_CLIENT}/messages`,
                items: []
            },
            {
                title: "Subscription Management",
                url: `/${BASE_URL_CLIENT}/subscription-management`,
                items: []
            },
            {
                title: "My Subscriptions",
                url: `/${BASE_URL_CLIENT}/my-subscription`,
                items: []
            },
            {
                title: "Collab Rooms",
                url: `/${BASE_URL_CLIENT}/collab-rooms`,
                items: []
            },
            {
                title: "My Network",
                url: `/${BASE_URL_CLIENT}/my-network`,
                items: []
            },
            {
                title: "Settings",
                url: `/${BASE_URL_CLIENT}/settings`,
                items: []
            },
        ]
    }
]