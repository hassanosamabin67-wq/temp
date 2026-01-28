"use client";
import { useIsMobile } from "@/hooks/profileDashboard/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
    data: {
        date: string;
        impressions: number;
    }[];
};

const Chart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});

export function AdImpressionChart({ data }: PropsType) {
    const isMobile = useIsMobile();

    // Transform data for ApexCharts
    const chartData = data.map(item => ({
        x: item.date,
        y: item.impressions
    }));

    const options: ApexOptions = {
        legend: {
            show: false,
        },
        colors: ["#1890ff"],
        chart: {
            height: 310,
            type: "area",
            toolbar: {
                show: false,
            },
            fontFamily: "inherit",
        },
        fill: {
            type: "gradient",
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
            x: {
                format: "MMM dd, yyyy",
            },
        },
        xaxis: {
            type: "datetime",
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                datetimeFormatter: {
                    year: 'yyyy',
                    month: 'MMM',
                    day: 'dd MMM',
                    hour: 'HH:mm'
                }
            }
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return Math.round(value).toString();
                }
            }
        }
    };

    return (
        <div style={{ width: '100%', padding: '20px 0' }}>
            <Chart
                options={options}
                series={[
                    {
                        name: "Impressions",
                        data: chartData,
                    },
                ]}
                type="area"
                height={300}
            />
        </div>
    );
}

