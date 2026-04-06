/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";

export const CircleIcon = React.memo(function CircleIcon({ className }: { className?: string; }) {
    return (
        <svg viewBox="0 0 24 24" className={className}>
            <circle
                cx="12"
                cy="12"
                r="8"
            />
        </svg>
    );
});
