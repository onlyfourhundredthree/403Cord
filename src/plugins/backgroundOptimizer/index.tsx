/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

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
            { label: "Ultra - Maximum performans (ses hariç her şey)", value: "ultra", default: false }
        ]
    },
    gcInterval: {
        type: OptionType.NUMBER,
        description: "Garbage collection aralığı (saniye, 0 = kapalı)",
        default: 30,
        ...makeRange(0, 300, 10)
    },
    freezeDelay: {
        type: OptionType.NUMBER,
        description: "Donma gecikmesi (saniye, 0 = hemen)",
        default: 0,...makeRange(0, 60, 5)
    },
    keepVoiceConnected: {
        type: OptionType.BOOLEAN,
        description: "Ses bağlantısını canlı tut",
        default: true
    },
    showStatusIndicator: {
        type: OptionType.BOOLEAN,
        description: "Optimizasyon aktif göstergeci",
        default: true
    }
});

// Mode'a göre bloke edilecek event'ler
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
let originalSetInterval: typeof setInterval | null = null;
let originalSetTimeout: typeof setTimeout | null = null;
let originalRAF: typeof requestAnimationFrame | null = null;

let isBackground = false;
let styleElement: HTMLStyleElement | null = null;
let statusElement: HTMLDivElement | null = null;
let gcIntervalId: ReturnType<typeof setInterval> | null = null;
let freezeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const activeIntervals = new Map<ReturnType<typeof setInterval>, { fn: TimerHandler; delay: number }>();
const activeTimeouts = new Map<ReturnType<typeof setTimeout>, { fn: TimerHandler; delay: number }>();
const activeRAFs = new Set<number>();
const pendingEvents = new Map<string, any[]>();

function createStyle() {
    if (styleElement) return;

    const { mode } = settings.store;
    const isAggressive = mode === "aggressive" || mode === "ultra";
    const isUltra = mode === "ultra";

    styleElement = document.createElement("style");
    styleElement.id = "vc-bg-optimizer";
    styleElement.textContent = `
        ${isAggressive ? `
        /* Animasyonları durdur */
        *, *::before, *::after {
            animation-play-state: paused !important;
            animation-duration: 0.001s !important;
            animation-delay: -0.001s !important;
            transition-duration: 0.001s !important;
            transition-delay: -0.001s !important;
        }
        ` : ""}
        
        ${isUltra ? `
        /* Render optimizasyonları */
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
        
        /* Voice elementlerini koru */
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
}

function removeStyle() {
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }
}

function createStatusIndicator() {
    if (!settings.store.showStatusIndicator || statusElement) return;

    statusElement = document.createElement("div");
    statusElement.id = "vc-bg-optimizer-status";
    statusElement.style.cssText = `
        position: fixed;
        top: 4px;
        right: 4px;
        background: linear-gradient(135deg, #5865F2, #57F287);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        z-index: 999999;
        pointer-events: none;
        font-family: var(--font-primary);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    statusElement.textContent = "⚡ Optimize";
    document.body.appendChild(statusElement);
}

function removeStatusIndicator() {
    if (statusElement) {
        statusElement.remove();
        statusElement = null;
    }
}

function shouldBlockEvent(type: string): boolean {
    if (!isBackground) return false;

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

    // Event'i buffer'a al
    if (!pendingEvents.has(event.type)) {
        pendingEvents.set(event.type, []);
    }
    pendingEvents.get(event.type)!.push(event);

    return;
}

function processPendingEvents() {
    pendingEvents.forEach((events, _type) => {
        events.forEach(event => {
            originalDispatch?.call(FluxDispatcher, event);
        });
    });
    pendingEvents.clear();
}

// Interval patch
function patchInterval() {
    if (originalSetInterval) return;

    originalSetInterval = window.setInterval;
    (window as any).setInterval = function (fn: any, delay?: number) {
        const id = (originalSetInterval as any).call(window, fn, delay);

        if (isBackground && settings.store.mode !== "light") {
            const fnStr = typeof fn === "function" ? fn.toString() : String(fn);
            const isVoiceRelated = fnStr.includes("voice") || fnStr.includes("audio") || fnStr.includes("call") || fnStr.includes("rtc");

            if (!isVoiceRelated) {
                activeIntervals.set(id, { fn, delay: delay || 0 });
                clearInterval(id);
            }
        }

        return id;
    };
}

function unpatchInterval() {
    if (originalSetInterval) {
        (window as any).setInterval = originalSetInterval;
        originalSetInterval = null;
    }
}

// Timeout patch
function patchTimeout() {
    if (originalSetTimeout) return;

    originalSetTimeout = window.setTimeout;
    (window as any).setTimeout = function (fn: any, delay?: number) {
        const id = (originalSetTimeout as any).call(window, fn, delay);

        if (isBackground && settings.store.mode === "ultra") {
            const fnStr = typeof fn === "function" ? fn.toString() : String(fn);
            const isVoiceRelated = fnStr.includes("voice") || fnStr.includes("audio") || fnStr.includes("call");

            if (!isVoiceRelated) {
                activeTimeouts.set(id, { fn, delay: delay || 0 });
                clearTimeout(id);
            }
        }

        return id;
    };
}

function unpatchTimeout() {
    if (originalSetTimeout) {
        (window as any).setTimeout = originalSetTimeout;
        originalSetTimeout = null;
    }
}

// RAF patch
let rafPatched = false;

function patchRAF() {
    if (rafPatched || settings.store.mode !== "ultra") return;

    originalRAF = window.requestAnimationFrame;
    (window as any).requestAnimationFrame = function (callback: FrameRequestCallback): number {
        const id = originalRAF!.call(window, callback);

        if (isBackground) {
            activeRAFs.add(id);
            cancelAnimationFrame(id);
            return id;
        }

        return id;
    };

    rafPatched = true;
}

function unpatchRAF() {
    if (originalRAF) {
        (window as any).requestAnimationFrame = originalRAF;
        originalRAF = null;
        rafPatched = false;
    }
}

function restoreIntervals() {
    activeIntervals.forEach(({ fn, delay }, _id) => {
        (originalSetInterval as any)?.call(window, fn, delay);
    });
    activeIntervals.clear();
}

function restoreTimeouts() {
    activeTimeouts.forEach(({ fn, delay }, _id) => {
        (originalSetTimeout as any)?.call(window, fn, delay);
    });
    activeTimeouts.clear();
}

function restoreRAFs() {
    activeRAFs.forEach(id => cancelAnimationFrame(id));
    activeRAFs.clear();
}

function triggerGC() {
    if (typeof (window as any).gc === "function") {
        (window as any).gc();
        logger.debug("GC triggered");
    }
}

function freezeDOM() {
    if (settings.store.mode !== "ultra") return;

    const appMount = document.getElementById("app-mount");
    if (appMount) {
        appMount.style.setProperty("opacity", "0.01", "important");
    }

    document.body.querySelectorAll(":not([class*='voice']):not([class*='call']):not([class*='audio'])").forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.setProperty("visibility", "hidden", "important");
        }
    });
}

function unfreezeDOM() {
    const appMount = document.getElementById("app-mount");
    if (appMount) {
        appMount.style.removeProperty("opacity");
    }

    document.body.querySelectorAll("[style*='visibility: hidden']").forEach(el => {
        if (el instanceof HTMLElement) {
            el.style.removeProperty("visibility");
        }
    });
}

function startBackgroundOptimization() {
    isBackground = true;
    const start = performance.now();
    const { mode } = settings.store;

    // CSS
    createStyle();
    document.head.appendChild(styleElement!);
    createStatusIndicator();

    // Patch'leri aktifleştir
    patchInterval();
    patchTimeout();
    patchRAF();

    // GC
    if (settings.store.gcInterval > 0 && !gcIntervalId) {
        gcIntervalId = setInterval(() => {
            if (isBackground) triggerGC();
        }, settings.store.gcInterval * 1000);
    }

    // Freeze delay
    if (settings.store.freezeDelay > 0) {
        freezeTimeoutId = setTimeout(() => {
            if (isBackground) freezeDOM();
        }, settings.store.freezeDelay * 1000);
    } else if (mode === "ultra") {
        freezeDOM();
    }

    const duration = performance.now() - start;
    logger.info(`Background optimization started (${mode} mode, ${duration.toFixed(2)}ms)`);
}

function stopBackgroundOptimization() {
    isBackground = false;
    const start = performance.now();

    // CSS'i kaldır
    removeStyle();
    removeStatusIndicator();

    // GC interval'i durdur
    if (gcIntervalId) {
        clearInterval(gcIntervalId);
        gcIntervalId = null;
    }

    // Freeze timeout'u temizle
    if (freezeTimeoutId) {
        clearTimeout(freezeTimeoutId);
        freezeTimeoutId = null;
    }

    // Bekleyen event'leri işle
    processPendingEvents();

    // Intervals/Timeouts/RAFs'ı geri yükle
    restoreIntervals();
    restoreTimeouts();
    restoreRAFs();

    // DOM'u geri aç
    unfreezeDOM();

    const duration = performance.now() - start;
    logger.info(`Background optimization stopped (${duration.toFixed(2)}ms)`);
}

function handleVisibilityChange() {
    const { hidden } = document;
    logger.debug(`Visibility changed: ${hidden ? "hidden" : "visible"}`);

    if (hidden) {
        startBackgroundOptimization();
    } else {
        stopBackgroundOptimization();
    }
}

export default definePlugin({
    name: "BackgroundOptimizer",
    description: "Discord arka plandayken RAM/CPU/GPU kullanımını minimize eder. Ses ve kısayollar çalışmaya devam eder.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    start() {
        // Flux'u patch'le
        originalDispatch = FluxDispatcher.dispatch.bind(FluxDispatcher);
        FluxDispatcher.dispatch = patchedDispatch as typeof FluxDispatcher.dispatch;

        // Visibility listener
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Başlangıç durumu
        if (document.hidden) {
            startBackgroundOptimization();
        }

        logger.info("BackgroundOptimizer loaded");
    },

    stop() {
        stopBackgroundOptimization();

        // Patch'leri kaldır
        if (originalDispatch) {
            FluxDispatcher.dispatch = originalDispatch;
        }

        unpatchInterval();
        unpatchTimeout();
        unpatchRAF();

        document.removeEventListener("visibilitychange", handleVisibilityChange);

        logger.info("BackgroundOptimizer unloaded");
    }
});
