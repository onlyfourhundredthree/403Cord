/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const logger = new Logger("BackgroundOptimizer");

const pluginSettings = definePluginSettings({
    level: {
        type: OptionType.SELECT,
        description: "Optimizasyon Seviyesi",
        options: [
            { value: 0, label: "Hafif (Sadece CSS Animasyonları ve GIF'ler durur)" },
            { value: 1, label: "Orta (Gereksiz Veri Akışı engellenir)" },
            { value: 2, label: "Agresif (Timer'lar yavaşlatılır, daha çok veri engellenir)" },
            { value: 3, label: "Ultra (Tam Dondurma - Görsel işlemler kapatılır)" }
        ],
        default: 1
    }
});

// İzin verilen, asla bloklanmayacak çekirdek eventler (Ses bağlantısı kopmasın diye)
const CRITICAL_EVENTS = [
    "VOICE_STATE_UPDATES",
    "VOICE_SERVER_UPDATE",
    "MESSAGE_CREATE",
    "RTC_CONNECTION_STATE",
    "RTC_CONNECTION_PING"
];

// Orta modda yok edilecek eventler (Gereksiz render ve RAM tüketiciler)
const IGNORED_EVENTS_MEDIUM = [
    "TYPING_START",
    "PRESENCE_UPDATES",
    "MESSAGE_REACTION_ADD",
    "MESSAGE_REACTION_REMOVE"
];

// Agresif modda fazladan yok edilecek eventler
const IGNORED_EVENTS_AGGRESSIVE = [
    ...IGNORED_EVENTS_MEDIUM,
    "USER_UPDATE",
    "GUILD_MEMBER_UPDATE",
    "CHANNEL_UPDATES",
    "SESSIONS_REPLACE"
];

let isHidden = false;
let styleNode: HTMLStyleElement | null = null;
let originalDispatch: any = null;
let originalRaf: any = null;

let currentLevel = 1;

export default definePlugin({
    name: "BackgroundOptimizer",
    description: "Discord arka plandayken gereksiz animasyonları ve veri akışını dondurarak ciddi oranda CPU ve RAM tasarrufu sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    tags: ["performance", "ram", "cpu", "optimizer", "freeze"],

    settings: pluginSettings,

    start() {
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        // Eğer başlarken zaten arkadaysa hemen uygula
        if (document.visibilityState === "hidden") {
            this.applyOptimizations();
        }
    },

    stop() {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        this.removeOptimizations();
    },

    handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
            this.applyOptimizations();
        } else {
            this.removeOptimizations();
        }
    },

    applyOptimizations() {
        if (isHidden) return;
        isHidden = true;
        currentLevel = this.settings.store.level ?? 1;

        logger.info(`Arka plan optimizasyonu devreye girdi (Seviye: ${currentLevel})`);

        // Seviye 0 ve Üzeri: CSS Animasyonlarını Dondur
        if (currentLevel >= 0) {
            styleNode = document.createElement("style");
            styleNode.id = "background-optimizer-css";
            styleNode.innerHTML = `
                * {
                    animation-play-state: paused !important;
                    transition: none !important;
                }
                .gif, .apng, video {
                    visibility: hidden !important;
                }
                [class*="spoilerContainer-"] [class*="spoilerInnerContainer-"] {
                    filter: blur(44px) !important;
                    transition: none !important;
                }
            `;
            document.head.appendChild(styleNode);
        }

        // Seviye 1 ve Üzeri: Gereksiz Flux Akışını Kes
        if (currentLevel >= 1) {
            const eventsToDrop = currentLevel >= 2 ? IGNORED_EVENTS_AGGRESSIVE : IGNORED_EVENTS_MEDIUM;
            originalDispatch = FluxDispatcher.dispatch;

            FluxDispatcher.dispatch = function (event: any, ...args: any[]) {
                if (isHidden && event && event.type) {
                    if (eventsToDrop.includes(event.type) && !CRITICAL_EVENTS.includes(event.type)) {
                        // Event'i yut ve devam etme
                        return;
                    }
                }
                return originalDispatch.apply(this, [event, ...args]);
            };
        }

        // Seviye 2 ve Üzeri: RAF (requestAnimationFrame) Yavaşlatma
        if (currentLevel >= 2) {
            originalRaf = window.requestAnimationFrame;
            window.requestAnimationFrame = function (callback: FrameRequestCallback) {
                if (isHidden) {
                    if (currentLevel === 3) return 0; // Ultra: Frame akışını tamamen kes

                    // Agresif modda 60FPS yerine 1 saniyede (1000ms) 1 kareye düşür
                    return setTimeout(() => callback(performance.now()), 1000) as unknown as number;
                }
                return originalRaf.call(window, callback);
            };
        }
    },

    removeOptimizations() {
        if (!isHidden) return;
        isHidden = false;

        logger.info("Arka plan optimizasyonları devreden çıkarıldı.");

        // Durdurulmuş CSS kurallarını kaldır
        if (styleNode) {
            styleNode.remove();
            styleNode = null;
        }

        // FluxDispatcher'ı eski haline getir
        if (originalDispatch) {
            FluxDispatcher.dispatch = originalDispatch;
            originalDispatch = null;
        }

        // requestAnimationFrame'i eski haline getir
        if (originalRaf) {
            window.requestAnimationFrame = originalRaf;
            originalRaf = null;
        }
    }
});
