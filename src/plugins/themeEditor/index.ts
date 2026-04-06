/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

function getImg(val: string) {
    if (!val || val === "transparent" || val === "none") return val || "none";
    if (val.startsWith("url(")) return val;
    return `url('${val}')`;
}

function updateTheme() {
    const elId = "-vencord-custom-theme-editor";
    let el = document.getElementById(elId);
    if (!el) {
        el = document.createElement("style");
        el.id = elId;
        document.head.appendChild(el);
    }

    const imports: string[] = [];

    // Ozel CSS kurali: @import satirlari her zaman en ustte olmak zorundadir!
    if (settings.store.fontQuicksand) imports.push("@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');");
    if (settings.store.themeFrostedGlass) imports.push("@import url('https://raw.githubusercontent.com/DiscordStyles/FrostedGlass/deploy/FrostedGlass.theme.css');");
    if (settings.store.themeWindowsTitlebar) imports.push("@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');");
    if (settings.store.themeRadialStatus) imports.push("@import url('https://raw.githubusercontent.com/DiscordStyles/RadialStatus/deploy/RadialStatus.theme.css');");

    const rootBlock = `
:root {
  --background-image: ${getImg(settings.store.backgroundImage)};
  --background-image-blur: ${settings.store.backgroundImageBlur};
  --background-image-size: ${settings.store.backgroundImageSize};
  --background-image-position: ${settings.store.backgroundImagePosition};
  --popout-modal-image: ${getImg(settings.store.popoutModalImage)};
  --popout-modal-blur: ${settings.store.popoutModalBlur};
  --popout-modal-size: ${settings.store.popoutModalSize};
  --popout-modal-position: ${settings.store.popoutModalPosition};
  --home-button-image: ${getImg(settings.store.homeButtonImage)};
  --home-button-size: ${settings.store.homeButtonSize};
  --home-button-position: ${settings.store.homeButtonPosition};
  --serverlist-brightness: ${settings.store.serverlistBrightness};
  --left-brightness: ${settings.store.leftBrightness};
  --middle-brightness: ${settings.store.middleBrightness};
  --right-brightness: ${settings.store.rightBrightness};
  --popout-modal-brightness: ${settings.store.popoutModalBrightness};
  --gradient-primary: ${settings.store.gradientPrimary};
  --gradient-secondary: ${settings.store.gradientSecondary};
  --link-colour: ${settings.store.linkColour};
  --scrollbar-colour: ${settings.store.scrollbarColour};
  --gradient-direction: ${settings.store.gradientDirection};
  --font: ${settings.store.font};
  --window-padding: ${settings.store.windowPadding};
  --window-roundness: ${settings.store.windowRoundness};
  --update-notice-1: ${settings.store.updateNotice1};
  --columns: ${settings.store.columns};
  --guildgap: ${settings.store.guildgap};
  --aligndms: ${settings.store.aligndms};
  --rs-small-spacing: ${settings.store.rsSmallSpacing};
  --rs-medium-spacing: ${settings.store.rsMediumSpacing};
  --rs-large-spacing: ${settings.store.rsLargeSpacing};
  --rs-small-width: ${settings.store.rsSmallWidth};
  --rs-medium-width: ${settings.store.rsMediumWidth};
  --rs-large-width: ${settings.store.rsLargeWidth};
  --rs-avatar-shape: ${settings.store.rsAvatarShape};
  --rs-online-color: ${settings.store.rsOnlineColor};
  --rs-idle-color: ${settings.store.rsIdleColor};
  --rs-dnd-color: ${settings.store.rsDndColor};
  --rs-offline-color: ${settings.store.rsOfflineColor};
  --rs-streaming-color: ${settings.store.rsStreamingColor};
  --rs-phone-visible: ${settings.store.rsPhoneVisible};
}
`;

    // Tum stringi guvenli sekilde tek parca birlestiriyoruz
    el.innerHTML = imports.join("\n") + rootBlock;
}

export const settings = definePluginSettings({
    // --- TEMA AÇMA / KAPATMA BUTONLARI ---
    fontQuicksand: { type: OptionType.BOOLEAN, description: "Quicksand Font Kullan", default: true, onChange: () => updateTheme() },
    themeFrostedGlass: { type: OptionType.BOOLEAN, description: "Frosted Glass Aktifleştir", default: true, onChange: () => updateTheme() },
    themeWindowsTitlebar: { type: OptionType.BOOLEAN, description: "Windows Uyumlu Üst Bar", default: true, onChange: () => updateTheme() },
    themeRadialStatus: { type: OptionType.BOOLEAN, description: "Yuvarlak Durum Çizgileri", default: true, onChange: () => updateTheme() },

    // --- DEĞİŞKENLER (VARIABLES) ---
    backgroundImage: { type: OptionType.STRING, description: "Arkaplan Görseli URL", default: "https://images3.alphacoders.com/120/thumb-1920-1209094.jpg", onChange: () => updateTheme() },
    backgroundImageBlur: { type: OptionType.STRING, description: "Arkaplan Bulanıklığı (px)", default: "0px", onChange: () => updateTheme() },
    backgroundImageSize: {
        type: OptionType.SELECT,
        description: "Arkaplan Boyutu",
        options: [
            { label: "Cover (Ekranı Kapla)", value: "cover", default: true },
            { label: "Contain (Sığdır)", value: "contain" },
            { label: "Auto (Orijinal Boyut)", value: "auto" },
            { label: "100% 100% (Tam Uzat)", value: "100% 100%" }
        ],
        onChange: () => updateTheme()
    },
    backgroundImagePosition: {
        type: OptionType.SELECT,
        description: "Arkaplan Pozisyonu",
        options: [
            { label: "Merkez (Center)", value: "center", default: true },
            { label: "Üst (Top)", value: "top" },
            { label: "Alt (Bottom)", value: "bottom" },
            { label: "Sol (Left)", value: "left" },
            { label: "Sağ (Right)", value: "right" }
        ],
        onChange: () => updateTheme()
    },
    popoutModalImage: { type: OptionType.STRING, description: "Popout Modal Görseli URL", default: "transparent", onChange: () => updateTheme() },
    popoutModalBlur: { type: OptionType.STRING, description: "Popout Modal Bulanıklığı", default: "0px", onChange: () => updateTheme() },
    popoutModalSize: {
        type: OptionType.SELECT,
        description: "Popout Modal Boyutu",
        options: [
            { label: "Cover (Ekranı Kapla)", value: "cover", default: true },
            { label: "Contain (Sığdır)", value: "contain" },
            { label: "Auto (Orijinal Boyut)", value: "auto" }
        ],
        onChange: () => updateTheme()
    },
    popoutModalPosition: {
        type: OptionType.SELECT,
        description: "Popout Modal Pozisyonu",
        options: [
            { label: "Merkez (Center)", value: "center", default: true },
            { label: "Üst (Top)", value: "top" },
            { label: "Alt (Bottom)", value: "bottom" },
            { label: "Sol (Left)", value: "left" },
            { label: "Sağ (Right)", value: "right" }
        ],
        onChange: () => updateTheme()
    },
    homeButtonImage: { type: OptionType.STRING, description: "Ana Sayfa Buton Görseli URL", default: "https://i.imgur.com/rAzycBK.png", onChange: () => updateTheme() },
    homeButtonSize: {
        type: OptionType.SELECT,
        description: "Ana Sayfa Buton Boyutu",
        options: [
            { label: "Cover (Ekranı Kapla)", value: "cover", default: true },
            { label: "Contain (Sığdır)", value: "contain" },
            { label: "Auto (Orijinal Boyut)", value: "auto" }
        ],
        onChange: () => updateTheme()
    },
    homeButtonPosition: {
        type: OptionType.SELECT,
        description: "Ana Sayfa Buton Pozisyonu",
        options: [
            { label: "Merkez (Center)", value: "center", default: true },
            { label: "Üst (Top)", value: "top" },
            { label: "Alt (Bottom)", value: "bottom" },
            { label: "Sol (Left)", value: "left" },
            { label: "Sağ (Right)", value: "right" }
        ],
        onChange: () => updateTheme()
    },
    serverlistBrightness: { type: OptionType.STRING, description: "Sunucu Listesi Parlaklığı", default: "0.6", onChange: () => updateTheme() },
    leftBrightness: { type: OptionType.STRING, description: "Sol Panel Parlaklığı", default: "0.6", onChange: () => updateTheme() },
    middleBrightness: { type: OptionType.STRING, description: "Orta Alan Parlaklığı", default: "0.6", onChange: () => updateTheme() },
    rightBrightness: { type: OptionType.STRING, description: "Sağ Panel Parlaklığı", default: "0", onChange: () => updateTheme() },
    popoutModalBrightness: { type: OptionType.STRING, description: "Popout Modal Parlaklığı", default: "0.6", onChange: () => updateTheme() },
    gradientPrimary: { type: OptionType.STRING, description: "Birincil Gradyan Rengi", default: "219, 219, 164", onChange: () => updateTheme() },
    gradientSecondary: { type: OptionType.STRING, description: "İkincil Gradyan Rengi", default: "14, 163, 232", onChange: () => updateTheme() },
    linkColour: { type: OptionType.STRING, description: "Bağlantı (Link) Rengi", default: "#88f7ff", onChange: () => updateTheme() },
    scrollbarColour: { type: OptionType.STRING, description: "Kaydırma Çubuğu Rengi", default: "rgba(255,255,255,0.05)", onChange: () => updateTheme() },
    gradientDirection: { type: OptionType.STRING, description: "Gradyan Yönü", default: "320deg", onChange: () => updateTheme() },
    font: { type: OptionType.STRING, description: "Yazı Tipi (Font)", default: "Quicksand", onChange: () => updateTheme() },
    windowPadding: { type: OptionType.STRING, description: "Pencere İç Boşluğu (Padding)", default: "0px", onChange: () => updateTheme() },
    windowRoundness: { type: OptionType.STRING, description: "Pencere Köşe Yuvarlaklığı", default: "0px", onChange: () => updateTheme() },
    updateNotice1: { type: OptionType.STRING, description: "Güncelleme Uyarısı (Genelde none)", default: "none", onChange: () => updateTheme() },
    columns: { type: OptionType.STRING, description: "Sunucu Listesi Sütun Sayısı", default: "2", onChange: () => updateTheme() },
    guildgap: { type: OptionType.STRING, description: "Sunucular Arası Boşluk", default: "2", onChange: () => updateTheme() },
    aligndms: { type: OptionType.STRING, description: "DM Hizalaması", default: "0", onChange: () => updateTheme() },
    rsSmallSpacing: { type: OptionType.STRING, description: "RadialStatus Küçük Boşluk", default: "0px", onChange: () => updateTheme() },
    rsMediumSpacing: { type: OptionType.STRING, description: "RadialStatus Orta Boşluk", default: "0px", onChange: () => updateTheme() },
    rsLargeSpacing: { type: OptionType.STRING, description: "RadialStatus Büyük Boşluk", default: "0px", onChange: () => updateTheme() },
    rsSmallWidth: { type: OptionType.STRING, description: "RadialStatus Küçük Kalınlık", default: "2.5px", onChange: () => updateTheme() },
    rsMediumWidth: { type: OptionType.STRING, description: "RadialStatus Orta Kalınlık", default: "2.5px", onChange: () => updateTheme() },
    rsLargeWidth: { type: OptionType.STRING, description: "RadialStatus Büyük Kalınlık", default: "2px", onChange: () => updateTheme() },
    rsAvatarShape: { type: OptionType.STRING, description: "Avatar Şekli", default: "50%", onChange: () => updateTheme() },
    rsOnlineColor: { type: OptionType.STRING, description: "Çevrimiçi Durum Rengi", default: "#1ED883", onChange: () => updateTheme() },
    rsIdleColor: { type: OptionType.STRING, description: "Boşta Durum Rengi", default: "#EE9A0E", onChange: () => updateTheme() },
    rsDndColor: { type: OptionType.STRING, description: "Rahatsız Etmeyin Rengi", default: "#F12222", onChange: () => updateTheme() },
    rsOfflineColor: { type: OptionType.STRING, description: "Çevrimdışı Durum Rengi", default: "#636b75", onChange: () => updateTheme() },
    rsStreamingColor: { type: OptionType.STRING, description: "Yayında Durum Rengi", default: "#6E29E4", onChange: () => updateTheme() },
    rsPhoneVisible: { type: OptionType.STRING, description: "Telefon Görünürlüğü (block/none)", default: "block", onChange: () => updateTheme() }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "Kullanıcıların genel Discord temasını diledikleri gibi özelleştirebildiği gelişmiş tema eklentisi.",
    authors: [Devs.Toji, Devs.Aki],
    settings,
    start() {
        updateTheme();
    },
    stop() {
        const el = document.getElementById("-vencord-custom-theme-editor");
        if (el) el.remove();
    }
});
