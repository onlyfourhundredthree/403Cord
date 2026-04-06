/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Logger } from "@utils/Logger";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { FluxDispatcher, useRef, useState } from "@webpack/common";
import type { PropsWithChildren } from "react";

const logger = new Logger("BackgroundOptimizer");

const settings = definePluginSettings({
    mode: {
        type: OptionType.SELECT,
        description: "Optimizasyon seviyesi",
        default: "aggressive",
        options: [
            { label: "Hafif - Sadece animasyonlar", value: "light", default: false },
            { label: "Orta - Animasyon + Event filtreleme", value: "medium", default: false },
            { label: "Agresif - Tüm optimizasyonlar", value: "aggressive", default: true },
            { label: "Ultra - Maximum performans", value: "ultra", default: false }
        ]
    },
    gcInterval: {
        type: OptionType.NUMBER,
        description: "Garbage collection aralığı (saniye, 0 = kapalı)",
        default: 30,
        ...makeRange(0, 300, 10)
    },
    keepVoiceConnected: {
        type: OptionType.BOOLEAN,
        description: "Ses bağlantısını canlı tut",
        default: true
    }
});

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_BOTTOM,", 'position:"bottom"');

const BLOCKED_EVENTS_BY_MODE: Record<string, string[]> = {
    light: [],
    medium: ["TYPING_START", "TYPING_STOP", "MESSAGE_CREATE", "MESSAGE_DELETE", "MESSAGE_UPDATE", "PRESENCE_UPDATE"],
    aggressive: [
        "GUILD_CREATE", "GUILD_DELETE", "GUILD_UPDATE",
        "CHANNEL_CREATE", "CHANNEL_DELETE", "CHANNEL_UPDATE",
        "MESSAGE_CREATE", "MESSAGE_DELETE", "MESSAGE_UPDATE",
        "MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE",
        "TYPING_START", "TYPING_STOP",
        "PRESENCE_UPDATE",
        "USER_UPDATE",
        "RELATIONSHIP_ADD", "RELATIONSHIP_REMOVE", "RELATIONSHIP_UPDATE",
        "GUILD_MEMBER_LIST_UPDATE",
        "CHANNEL_UNREAD_UPDATE",
        "MESSAGE_ACK"
    ],
    ultra: [
        "GUILD_CREATE", "GUILD_DELETE", "GUILD_UPDATE", "GUILD_BAN_ADD", "GUILD_BAN_REMOVE",
        "GUILD_EMOJIS_UPDATE", "GUILD_INTEGRATIONS_UPDATE",
        "CHANNEL_CREATE", "CHANNEL_DELETE", "CHANNEL_UPDATE", "CHANNEL_PINS_ACK", "CHANNEL_PINS_UPDATE",
        "MESSAGE_CREATE", "MESSAGE_DELETE", "MESSAGE_UPDATE",
        "MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE", "MESSAGE_REACTION_REMOVE_ALL",
        "MESSAGE_ACK", "MESSAGE_DELETE_BULK",
        "TYPING_START", "TYPING_STOP",
        "PRESENCE_UPDATE", "PRESENCES_REPLACE",
        "USER_UPDATE", "USER_GUILD_SETTINGS_UPDATE",
        "RELATIONSHIP_ADD", "RELATIONSHIP_REMOVE", "RELATIONSHIP_UPDATE",
        "GUILD_MEMBER_LIST_UPDATE", "GUILD_MEMBER_ADD", "GUILD_MEMBER_REMOVE", "GUILD_MEMBER_UPDATE",
        "CHANNEL_UNREAD_UPDATE", "GUILD_UNREAD_UPDATE",
        "SESSIONS_REPLACE",
        "USER_NOTE_UPDATE",
        "MESSAGE_POLL_RESULT",
        "ACTIVITY_INVITE", "ACTIVITY_JOIN", "ACTIVITY_LEAVE",
        "STREAM_CREATE", "STREAM_DELETE", "STREAM_UPDATE",
        "THREAD_CREATE", "THREAD_DELETE", "THREAD_UPDATE", "THREAD_LIST_SYNC",
        "THREAD_MEMBER_UPDATE", "THREAD_MEMBERS_UPDATE"
    ]
};

const KEEP_ALIVE_EVENTS = [
    "VOICE_STATE_UPDATE",
    "VOICE_SERVER_UPDATE",
    "SPEAKING",
    "RTC_CONNECTION_STATE",
    "RTC_CONNECTION_QUALITY",
    "MEDIA_SESSION_CONNECT",
    "MEDIA_SESSION_DISCONNECT"
];

let originalDispatch: typeof FluxDispatcher.dispatch | null = null;
let isOptimized = false;
let styleElement: HTMLStyleElement | null = null;
let gcIntervalId: ReturnType<typeof setInterval> | null = null;

function createStyle() {
    if (styleElement) return;

    const { mode } = settings.store;
    const isAggressive = mode === "aggressive" || mode === "ultra";
    const isUltra = mode === "ultra";

    styleElement = document.createElement("style");
    styleElement.id = "vc-bg-optimizer";
    styleElement.textContent = `
        ${isAggressive ? `
        *, *::before, *::after {
            animation-play-state: paused !important;
            animation-duration: 0.001s !important;
            animation-delay: -0.001s !important;
            transition-duration: 0.001s !important;
            transition-delay: -0.001s !important;
        }
        ` : ""}
        
        ${isUltra ? `
        body > *:not(#app-mount) {
            display: none !important;
        }
        
        #app-mount {
            opacity: 0.01 !important;
        }
        
        [class*="voice"], [class*="call"], [class*="audio"], [class*="Video"],
        [aria-label*="Voice"], [aria-label*="Call"], [aria-label*="Audio"] {
            opacity: 1 !important;
            display: block !important;
            visibility: visible !important;
        }
        ` : ""}
        
        [class*="voice"], [class*="call"], [class*="audio"],
        [class*="Voice"], [class*="Call"], [class*="Audio"],
        [aria-label*="Voice"], [aria-label*="Call"], [aria-label*="Audio"] {
            animation-play-state: running !important;
            animation-duration: initial !important;
            transition-duration: initial !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
    `;
    document.head.appendChild(styleElement);
}

function removeStyle() {
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }
}

function shouldBlockEvent(type: string): boolean {
    if (!isOptimized) return false;

    const { mode } = settings.store;
    const blocked = BLOCKED_EVENTS_BY_MODE[mode] || [];

    if (settings.store.keepVoiceConnected && KEEP_ALIVE_EVENTS.includes(type)) {
        return false;
    }

    return blocked.includes(type);
}

function patchedDispatch(event: { type: string; [key: string]: unknown }) {
    if (!shouldBlockEvent(event.type)) {
        return originalDispatch?.call(FluxDispatcher, event);
    }
    return;
}

function triggerGC() {
    if (typeof (window as any).gc === "function") {
        (window as any).gc();
        logger.debug("GC triggered");
    }
}

function startOptimization() {
    isOptimized = true;
    createStyle();

    if (!originalDispatch) {
        originalDispatch = FluxDispatcher.dispatch.bind(FluxDispatcher);
        FluxDispatcher.dispatch = patchedDispatch as typeof FluxDispatcher.dispatch;
    }

    if (settings.store.gcInterval > 0 && !gcIntervalId) {
        gcIntervalId = setInterval(() => {
            if (isOptimized) triggerGC();
        }, settings.store.gcInterval * 1000);
    }

    logger.info(`Optimization started (${settings.store.mode} mode)`);
}

function stopOptimization() {
    isOptimized = false;
    removeStyle();

    if (gcIntervalId) {
        clearInterval(gcIntervalId);
        gcIntervalId = null;
    }

    logger.info("Optimization stopped");
}

function OptimizeIcon({ isActive }: { isActive: boolean }) {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24}>
            <path
                fill={isActive ? "#57F287" : "#B5BACF"}
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            />
        </svg>
    );
}

function OptimizeButton() {
    const buttonRef = useRef(null);
    const [, forceUpdate] = useState({});

    const toggle = () => {
        if (isOptimized) {
            stopOptimization();
        } else {
            startOptimization();
        }
        forceUpdate({});
    };

    return (
        <HeaderBarIcon
            ref={buttonRef}
            className="vc-optimize-btn"
            onClick={toggle}
            tooltip={isOptimized ? "Optimizasyonu Kapat" : "Optimizasyonu Aç"}
            icon={() => <OptimizeIcon isActive={isOptimized} />}
            selected={isOptimized}
        />
    );
}

export default definePlugin({
    name: "BackgroundOptimizer",
    description: "Performans optimizasyonu - Toolbar butonuna tıklayarak aç/kapat",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,(?=\{children:\[)/,
                replace: "$self.TrailingWrapper,"
            }
        }
    ],

    TrailingWrapper({ children }: PropsWithChildren) {
        return (
            <>
                {children}
                <ErrorBoundary key="vc-optimize" noop>
                    <OptimizeButton />
                </ErrorBoundary>
            </>
        );
    },

    start() {
        logger.info("BackgroundOptimizer loaded - Click toolbar button to toggle");
    },

    stop() {
        stopOptimization();
        if (originalDispatch) {
            FluxDispatcher.dispatch = originalDispatch;
            originalDispatch = null;
        }
        logger.info("BackgroundOptimizer unloaded");
    }
});
