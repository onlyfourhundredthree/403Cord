/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function PermissionDeniedIcon() {
    return (
        <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
        >
            <g>
                <title>Denied</title>
                <path fill="var(--status-danger)" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4.2C16.3 4.2 19.8 7.7 19.8 12C19.8 13.6 19.3 15.1 18.5 16.4L7.6 5.5C8.9 4.7 10.4 4.2 12 4.2ZM12 19.8C7.7 19.8 4.2 16.3 4.2 12C4.2 10.4 4.7 8.9 5.5 7.6L16.4 18.5C15.1 19.3 13.6 19.8 12 19.8Z" />
            </g>
        </svg>
    );
}

export function PermissionAllowedIcon() {
    return (
        <svg
            height="24"
            width="24"
            viewBox="0 0 24 24"
        >
            <title>Allowed</title>
            <path fill="var(--status-positive)" d="M8.99991 16.17L4.82991 12L3.40991 13.41L8.99991 19L20.9999 7.00003L19.5899 5.59003L8.99991 16.17ZZ" />
        </svg>
    );
}

export function PermissionDefaultIcon() {
    return (
        <svg
            height="24"
            width="24"
            viewBox="0 0 16 16"
        >
            <g>
                <title>Not overwritten</title>
                <polygon fill="var(--text-default)" points="12 2.32 10.513 2 4 13.68 5.487 14" />
            </g>
        </svg>
    );
}
