/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React, ReactDOM, useRef, useState } from "@webpack/common";

const CloseIcon = ({ size = 24 }: { size?: number; }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

interface PortableContainerProps {
    title: string;
    id: string;
    onClose: () => void;
    children: React.ReactNode;
    defaultX?: number;
    defaultY?: number;
    defaultWidth?: number;
    defaultHeight?: number;
}

export function PortableContainer({ title, id, onClose, children, defaultX = 100, defaultY = 100, defaultWidth = 240, defaultHeight = 600 }: PortableContainerProps) {
    const [pos, setPos] = useState({ x: defaultX, y: defaultY });
    const [size] = useState({ width: defaultWidth, height: defaultHeight });
    const dragging = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        dragging.current = true;
        startPos.current = { x: pos.x, y: pos.y };
        startMouse.current = { x: e.clientX, y: e.clientY };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        setPos({
            x: startPos.current.x + (e.clientX - startMouse.current.x),
            y: startPos.current.y + (e.clientY - startMouse.current.y)
        });
    };

    const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    return ReactDOM.createPortal(
        <div
            className="vc-portable-container"
            id={`vc-portable-${id}`}
            style={{
                left: pos.x,
                top: pos.y,
                width: size.width,
                height: size.height
            }}
        >
            <div className="vc-portable-header" onMouseDown={handleMouseDown}>
                <span className="vc-portable-title">{title}</span>
                <div className="vc-portable-close" onClick={onClose}>
                    <CloseIcon size={20} />
                </div>
            </div>
            <div className="vc-portable-content">
                {children}
            </div>
        </div>,
        document.body
    );
}
