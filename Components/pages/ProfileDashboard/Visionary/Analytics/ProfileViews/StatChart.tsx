"use client";
import { useIsMobile } from "@/hooks/profileDashboard/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import styles from './style.module.css'

type PropsType = {
    data: {
        views: { x: unknown; y: number }[];
        clicks: { x: unknown; y: number }[];
    };
};

const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

export function StatChart({ data }: PropsType) {
    const isMobile = useIsMobile();

    const options: ApexOptions = {
        legend: {
            show: false,
        },
        colors: ["#5750F1", "#0ABEF9"],
        chart: {
            height: 310,
            type: "area",
            toolbar: {
                show: false,
            },
            fontFamily: "inherit",
        },
        fill: {
            gradient: {
                opacityFrom: 0.55,
                opacityTo: 0,
            },
        },
        responsive: [
            {
                breakpoint: 1024,
                options: {
                    chart: {
                        height: 300,
                    },
                },
            },
            {
                breakpoint: 1366,
                options: {
                    chart: {
                        height: 320,
                    },
                },
            },
        ],
        stroke: {
            curve: "smooth",
            width: isMobile ? 2 : 3,
        },
        grid: {
            strokeDashArray: 5,
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        tooltip: {
            marker: {
                show: true,
            },
        },
        xaxis: {
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
    };

    return (
        <div className={styles.cartDiv}>
            <Chart
                options={options}
                series={[
                    {
                        name: "Views",
                        data: data.views,
                    },
                    {
                        name: "Clicks",
                        data: data.clicks,
                    },
                ]}
                type="area"
                height={300}
            />
        </div>
    );
}