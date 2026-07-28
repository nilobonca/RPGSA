import { useState, useEffect, useCallback, useRef } from 'react';
import { PanInfo, useMotionValue } from 'framer-motion';
import { useCanvasGlobalStore } from '@/store/canvasStore';

interface Size {
    width: number;
    height: number;
}

interface Position {
    x: number;
    y: number;
}

interface UseViewportResizeProps {
    menuId?: string;
    initialSize: Size;
    initialPosition: Position;
    minWidth: number;
    minHeight: number;
    margin?: number;
}

export const useViewportResize = ({ menuId, initialSize, initialPosition, minWidth, minHeight, margin = 20 }: UseViewportResizeProps) => {
    const [size, setSize] = useState<Size>(initialSize);
    const [position, setPosition] = useState<Position>(initialPosition);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const width = useMotionValue(initialSize.width);
    const height = useMotionValue(initialSize.height);

    // Sync MotionValues if initialSize or external size change happens
    useEffect(() => {
        width.set(size.width);
        height.set(size.height);
    }, [size.width, size.height, width, height]);

    // Refs to always have latest values inside event handlers
    const sizeRef = useRef(size);
    const positionRef = useRef(position);
    const relativePosRef = useRef({ x: 0, y: 0 });

    // Helper to calculate ratio from absolute position
    const calculateRatio = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: 0, y: 0 };
        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;
        return {
            x: availableWidth > 0 ? Math.min(Math.max((pos.x - margin) / availableWidth, 0), 1) : 0,
            y: availableHeight > 0 ? Math.min(Math.max((pos.y - margin) / availableHeight, 0), 1) : 0,
        };
    }, [margin]);

    // Helper to calculate absolute position from ratio
    const calculateAbsolute = useCallback((ratio: { x: number, y: number }, currentSize: Size) => {
        if (typeof window === 'undefined') return { x: margin, y: margin };
        const availableWidth = window.innerWidth - currentSize.width - margin * 2;
        const availableHeight = window.innerHeight - currentSize.height - margin * 2;
        return {
            x: margin + (availableWidth > 0 ? ratio.x * availableWidth : 0),
            y: margin + (availableHeight > 0 ? ratio.y * availableHeight : 0),
        };
    }, [margin]);

    // Clamp position so menu never leaves the viewport
    const clampPosition = useCallback((pos: Position, currentSize: Size) => {
        if (typeof window === 'undefined') return pos;
        const maxX = window.innerWidth - currentSize.width - margin;
        const maxY = window.innerHeight - currentSize.height - margin;
        return {
            x: Math.min(Math.max(margin, pos.x), Math.max(margin, maxX)),
            y: Math.min(Math.max(margin, pos.y), Math.max(margin, maxY)),
        };
    }, [margin]);

    // Restore saved position/size on initial mount if menuId is provided, or calculate right side default
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = menuId ? useCanvasGlobalStore.getState().menuPositions[menuId] : undefined;
            if (saved && saved.x !== undefined && saved.y !== undefined) {
                const targetSize = (saved.width && saved.height) ? { width: saved.width, height: saved.height } : sizeRef.current;
                const clamped = clampPosition({ x: saved.x, y: saved.y }, targetSize);
                setPosition(clamped);
                positionRef.current = clamped;
                if (saved.width && saved.height) {
                    setSize(targetSize);
                    sizeRef.current = targetSize;
                }
            } else if (initialPosition.x >= 500 || menuId === 'activePlayers' || menuId === 'pin' || menuId === 'listeners' || menuId === 'soundboard') {
                const rightX = Math.max(margin, window.innerWidth - sizeRef.current.width - margin);
                const clamped = clampPosition({ x: rightX, y: initialPosition.y || 100 }, sizeRef.current);
                setPosition(clamped);
                positionRef.current = clamped;
            }
        }
    }, [menuId, clampPosition, initialPosition.x, initialPosition.y, margin]);

    // Sync refs and relative position
    useEffect(() => {
        setIsMounted(true);
        // Guarantee the menu is fully within bounds on initial mount
        const clamped = clampPosition(positionRef.current, sizeRef.current);
        if (clamped.x !== positionRef.current.x || clamped.y !== positionRef.current.y) {
            setPosition(clamped);
            positionRef.current = clamped;
        }
    }, [clampPosition]);

    useEffect(() => {
        sizeRef.current = size;
        positionRef.current = position;
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            relativePosRef.current = calculateRatio(position, size);
        }
    }, [size, position, calculateRatio]);

    // Re-clamp on window resize
    useEffect(() => {
        if (!isMounted) return;
        const handleResize = () => {
            const isNowDesktop = window.innerWidth >= 768;
            setIsDesktop(isNowDesktop);
            if (isNowDesktop) {
                const currentSize = sizeRef.current;
                const newWidth = Math.min(Math.max(currentSize.width, minWidth), window.innerWidth - margin * 2);
                const newHeight = Math.min(Math.max(currentSize.height, minHeight), window.innerHeight - margin * 2);
                const newSize = { width: newWidth, height: newHeight };
                if (newWidth !== currentSize.width || newHeight !== currentSize.height) {
                    setSize(newSize);
                }
                const newPos = calculateAbsolute(relativePosRef.current, newSize);
                setPosition(clampPosition(newPos, newSize));
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMounted, minWidth, minHeight, margin, clampPosition, calculateAbsolute]);

    // Helper to start header drag cleanly without text selection or stutter
    const startDragHeader = useCallback((e: React.PointerEvent, dragControls: any) => {
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
        if (e.cancelable) e.preventDefault();
        dragControls.start(e);
    }, []);

    // After drag ends, sync React state with where framer-motion left the element and save to store
    const onDragEnd = (event: unknown, info: PanInfo) => {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        const newX = positionRef.current.x + x.get();
        const newY = positionRef.current.y + y.get();
        const clamped = clampPosition({ x: newX, y: newY }, sizeRef.current);
        setPosition(clamped);
        x.set(0);
        y.set(0);
        if (menuId) {
            useCanvasGlobalStore.getState().setMenuPosition(menuId, {
                x: clamped.x,
                y: clamped.y,
                width: sizeRef.current.width,
                height: sizeRef.current.height
            });
        }
    };

    // Centralised resize handler — enforces minWidth/minHeight AND viewport bounds and saves to store
    const handleResizeStart = useCallback((e: React.PointerEvent | React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.getSelection()?.removeAllRanges();
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = sizeRef.current.width;
        const startHeight = sizeRef.current.height;

        let rAF: number;
        const handlePointerMove = (moveEvent: PointerEvent | MouseEvent) => {
            if (rAF) cancelAnimationFrame(rAF);
            rAF = requestAnimationFrame(() => {
                const pos = positionRef.current;
                const maxWidth = typeof window !== 'undefined' ? window.innerWidth - pos.x - margin : Infinity;
                const maxHeight = typeof window !== 'undefined' ? window.innerHeight - pos.y - margin : Infinity;
                const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + (moveEvent.clientX - startX)));
                const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + (moveEvent.clientY - startY)));
                
                width.set(newWidth);
                height.set(newHeight);
            });
        };

        const handlePointerUp = () => {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            if (rAF) cancelAnimationFrame(rAF);
            // Commit final size to React state on drag end and store
            const finalW = width.get();
            const finalH = height.get();
            setSize({ width: finalW, height: finalH });
            if (menuId) {
                useCanvasGlobalStore.getState().setMenuPosition(menuId, {
                    x: positionRef.current.x,
                    y: positionRef.current.y,
                    width: finalW,
                    height: finalH
                });
            }
            document.removeEventListener('pointermove', handlePointerMove as any);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('mousemove', handlePointerMove as any);
            document.removeEventListener('mouseup', handlePointerUp);
        };

        document.addEventListener('pointermove', handlePointerMove as any);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('mousemove', handlePointerMove as any);
        document.addEventListener('mouseup', handlePointerUp);
    }, [margin, minWidth, minHeight, menuId]);

    // Calculate exact constraints based on current position and size
    const constraintRef = {
        left: typeof window !== 'undefined' ? margin - position.x : 0,
        right: typeof window !== 'undefined' ? window.innerWidth - size.width - margin - position.x : 0,
        top: typeof window !== 'undefined' ? margin - position.y : 0,
        bottom: typeof window !== 'undefined' ? window.innerHeight - size.height - margin - position.y : 0
    };

    return { size, setSize, position, setPosition, onDragEnd, isDesktop, handleResizeStart, constraintRef, x, y, width, height, startDragHeader };
};
