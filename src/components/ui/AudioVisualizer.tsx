import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    isPlaying: boolean;
    barCount?: number;
    className?: string;
    color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
    isPlaying,
    barCount = 16,
    className = "",
    color = "rgb(168, 85, 247)" // purple-500 default
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let heights = Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / barCount - 2;

            for (let i = 0; i < barCount; i++) {
                if (isPlaying) {
                    const targetHeight = Math.random() * 0.85 + 0.15;
                    heights[i] += (targetHeight - heights[i]) * 0.2;
                } else {
                    heights[i] += (0.05 - heights[i]) * 0.1;
                }

                const h = heights[i] * canvas.height;
                const x = i * (barWidth + 2);
                const y = canvas.height - h;

                const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'rgba(236, 72, 153, 0.9)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, h, 2);
                ctx.fill();
            }

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, barCount, color]);

    return (
        <canvas
            ref={canvasRef}
            width={barCount * 6}
            height={24}
            className={`inline-block ${className}`}
        />
    );
};
