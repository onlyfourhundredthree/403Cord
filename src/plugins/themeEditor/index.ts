import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";

function updateTheme() {
    const elId = "-vencord-custom-theme-editor";
    let el = document.getElementById(elId);
    if (!el) {
        el = document.createElement("style");
        el.id = elId;
        document.head.appendChild(el);
    }

    el.innerHTML = `
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@100;300;400;500;700&display=swap');
@import url('https://discordstyles.github.io/FrostedGlass/dist/FrostedGlass.css');
@import url('https://discordstyles.github.io/Addons/windows-titlebar.css');
@import url('https://mwittrien.github.io/BetterDiscordAddons/Themes/ServerColumns/ServerColumns.css');
@import url('https://discordstyles.github.io/RadialStatus/dist/RadialStatus.css');
@import url('https://nyri4.github.io/Discolored/main.css');

:root {
  --background-image: ${settings.store.backgroundImage};
  --background-image-blur: ${settings.store.backgroundImageBlur};
  --background-image-size: ${settings.store.backgroundImageSize};
  --background-image-position: ${settings.store.backgroundImagePosition};
  --popout-modal-image: ${settings.store.popoutModalImage};
  --popout-modal-blur: ${settings.store.popoutModalBlur};
  --popout-modal-size: ${settings.store.popoutModalSize};
  --popout-modal-position: ${settings.store.popoutModalPosition};
  --home-button-image: ${settings.store.homeButtonImage};
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
}

export const settings = definePluginSettings({
    backgroundImage: { type: OptionType.STRING, description: "Arkaplan Görseli (Background Image)", default: "url('https://i.imgur.com/OHStaWu.png')", onChange: updateTheme },
    backgroundImageBlur: { type: OptionType.STRING, description: "Arkaplan Bulanıklığı (Image Blur)", default: "0px", onChange: updateTheme },
    backgroundImageSize: { type: OptionType.STRING, description: "Arkaplan Boyutu (Image Size)", default: "cover", onChange: updateTheme },
    backgroundImagePosition: { type: OptionType.STRING, description: "Arkaplan Pozisyonu (Image Position)", default: "center", onChange: updateTheme },
    popoutModalImage: { type: OptionType.STRING, description: "Popout Modal Görseli", default: "transparent", onChange: updateTheme },
    popoutModalBlur: { type: OptionType.STRING, description: "Popout Modal Bulanıklığı", default: "0px", onChange: updateTheme },
    popoutModalSize: { type: OptionType.STRING, description: "Popout Modal Boyutu", default: "cover", onChange: updateTheme },
    popoutModalPosition: { type: OptionType.STRING, description: "Popout Modal Pozisyonu", default: "center", onChange: updateTheme },
    homeButtonImage: { type: OptionType.STRING, description: "Ana Sayfa Buton Görseli", default: "url('https://i.imgur.com/rAzycBK.png')", onChange: updateTheme },
    homeButtonSize: { type: OptionType.STRING, description: "Ana Sayfa Buton Boyutu", default: "cover", onChange: updateTheme },
    homeButtonPosition: { type: OptionType.STRING, description: "Ana Sayfa Buton Pozisyonu", default: "center", onChange: updateTheme },
    serverlistBrightness: { type: OptionType.STRING, description: "Sunucu Listesi Parlaklığı", default: "0.6", onChange: updateTheme },
    leftBrightness: { type: OptionType.STRING, description: "Sol Panel Parlaklığı", default: "0.6", onChange: updateTheme },
    middleBrightness: { type: OptionType.STRING, description: "Orta Alan Parlaklığı", default: "0.6", onChange: updateTheme },
    rightBrightness: { type: OptionType.STRING, description: "Sağ Panel Parlaklığı", default: "0", onChange: updateTheme },
    popoutModalBrightness: { type: OptionType.STRING, description: "Popout Modal Parlaklığı", default: "0.6", onChange: updateTheme },
    gradientPrimary: { type: OptionType.STRING, description: "Birincil Gradyan Rengi", default: "219, 219, 164", onChange: updateTheme },
    gradientSecondary: { type: OptionType.STRING, description: "İkincil Gradyan Rengi", default: "14, 163, 232", onChange: updateTheme },
    linkColour: { type: OptionType.STRING, description: "Bağlantı (Link) Rengi", default: "#88f7ff", onChange: updateTheme },
    scrollbarColour: { type: OptionType.STRING, description: "Kaydırma Çubuğu Rengi", default: "rgba(255,255,255,0.05)", onChange: updateTheme },
    gradientDirection: { type: OptionType.STRING, description: "Gradyan Yönü", default: "320deg", onChange: updateTheme },
    font: { type: OptionType.STRING, description: "Yazı Tipi (Font)", default: "Quicksand", onChange: updateTheme },
    windowPadding: { type: OptionType.STRING, description: "Pencere İç Boşluğu (Padding)", default: "0px", onChange: updateTheme },
    windowRoundness: { type: OptionType.STRING, description: "Pencere Köşe Yuvarlaklığı", default: "0px", onChange: updateTheme },
    updateNotice1: { type: OptionType.STRING, description: "Güncelleme Uyarısı (Genelde none)", default: "none", onChange: updateTheme },
    columns: { type: OptionType.STRING, description: "Sunucu Listesi Sütun Sayısı", default: "2", onChange: updateTheme },
    guildgap: { type: OptionType.STRING, description: "Sunucular Arası Boşluk", default: "2", onChange: updateTheme },
    aligndms: { type: OptionType.STRING, description: "DM Hizalaması", default: "0", onChange: updateTheme },
    rsSmallSpacing: { type: OptionType.STRING, description: "RadialStatus Küçük Boşluk", default: "0px", onChange: updateTheme },
    rsMediumSpacing: { type: OptionType.STRING, description: "RadialStatus Orta Boşluk", default: "0px", onChange: updateTheme },
    rsLargeSpacing: { type: OptionType.STRING, description: "RadialStatus Büyük Boşluk", default: "0px", onChange: updateTheme },
    rsSmallWidth: { type: OptionType.STRING, description: "RadialStatus Küçük Kalınlık", default: "2.5px", onChange: updateTheme },
    rsMediumWidth: { type: OptionType.STRING, description: "RadialStatus Orta Kalınlık", default: "2.5px", onChange: updateTheme },
    rsLargeWidth: { type: OptionType.STRING, description: "RadialStatus Büyük Kalınlık", default: "2px", onChange: updateTheme },
    rsAvatarShape: { type: OptionType.STRING, description: "Avatar Şekli", default: "50%", onChange: updateTheme },
    rsOnlineColor: { type: OptionType.STRING, description: "Çevrimiçi Durum Rengi", default: "#1ED883", onChange: updateTheme },
    rsIdleColor: { type: OptionType.STRING, description: "Boşta Durum Rengi", default: "#EE9A0E", onChange: updateTheme },
    rsDndColor: { type: OptionType.STRING, description: "Rahatsız Etmeyin Rengi", default: "#F12222", onChange: updateTheme },
    rsOfflineColor: { type: OptionType.STRING, description: "Çevrimdışı Durum Rengi", default: "#636b75", onChange: updateTheme },
    rsStreamingColor: { type: OptionType.STRING, description: "Yayında Durum Rengi", default: "#6E29E4", onChange: updateTheme },
    rsPhoneVisible: { type: OptionType.STRING, description: "Telefon Görünürlüğü (block/none)", default: "block", onChange: updateTheme }
});

export default definePlugin({
    name: "Tema Düzenleyici",
    description: "Kullanıcıların genel Discord temasını diledikleri gibi özelleştirebildiği gelişmiş tema eklentisi.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,
    start() {
        updateTheme();
    },
    stop() {
        const el = document.getElementById("-vencord-custom-theme-editor");
        if (el) el.remove();
    }
});
