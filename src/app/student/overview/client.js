'use client'

import React from 'react'
import { Line } from 'react-chartjs-2'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
} from 'chart.js'

// Plugin tùy chỉnh: vẽ đường kẻ dọc tại vị trí tooltip đang active
const verticalLinePlugin = {
    id: 'verticalLinePlugin',
    afterDraw: (chart) => {
        if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
            const ctx = chart.ctx
            ctx.save()
            const activePoint = chart.tooltip._active[0]
            const x = activePoint.element.x
            const topY = chart.scales.y.top
            const bottomY = chart.scales.y.bottom
            ctx.beginPath()
            ctx.moveTo(x, topY)
            ctx.lineTo(x, bottomY)
            ctx.lineWidth = 1
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)' // điều chỉnh màu sắc & độ mờ theo ý muốn
            ctx.stroke()
            ctx.restore()
        }
    },
}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    verticalLinePlugin
)

export function ReusableLineChart({ labels, dataPoints, color }) {
    const data = {
        labels,
        datasets: [
            {
                data: dataPoints,
                fill: false,
                borderColor: `${color}`,
                tension: 0.1,
                borderWidth: 2,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false, // cho phép biểu đồ chiếm đủ container
        interaction: {
            mode: 'index',
            intersect: false, // tooltip hiển thị ngay cả khi không chạm trực tiếp vào điểm dữ liệu
        },
        hover: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            x: {
                grid: {
                    display: false, // ẩn đường kẻ cột mặc định
                },
                offset: false,
            },
            y: {
                grid: {
                    display: true,  // vẫn hiển thị đường kẻ dòng
                    drawBorder: false,
                },
                ticks: {
                    stepSize: 15,   // khoảng cách giữa các giá trị là 15
                    beginAtZero: true,
                    padding: 5,
                    autoSkipPadding: 0,
                },
            },
        },
        plugins: {
            legend: {
                display: false, // ẩn chú thích
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                padding: 10,
                callbacks: {
                    title: (tooltipItems) => {
                        if (tooltipItems.length > 0) {
                            return `Ngày: ${tooltipItems[0].label}`
                        }
                        return ''
                    },
                    label: (tooltipItem) => {
                        return `Số lượng học sinh: ${tooltipItem.formattedValue}`
                    },
                },
            },
        },
    }

    return (
        <div style={{ position: 'relative', width: '100%', height: '200px' }}>
            <Line data={data} options={options} />
        </div>
    )
}
