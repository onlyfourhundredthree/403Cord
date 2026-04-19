/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import { ImageIcon } from "@components/Icons";
import { openImageModal } from "@utils/discord";
import { MediaModalItem, openMediaModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { GuildMemberStore, IconUtils, Menu } from "@webpack/common";

const settings = definePluginSettings({
    format: {
        type: OptionType.SELECT,
        description: "Choose the image format to use for non animated images.",
        options: [
            { label: "webp", value: "webp" },
            { label: "png", value: "png", default: true },
            { label: "jpg", value: "jpg" }
        ]
    },
    imgSize: {
        type: OptionType.SELECT,
        description: "The image size to use",
        options: ["128", "256", "512", "1024", "2048", "4096"].map(n => ({ label: n, value: n, default: n === "2048" }))
    }
});

function buildUrl(url: string) {
    const u = new URL(url, window.location.href);
    const format = u.searchParams.get("animated") === "true" ? "gif" : settings.store.format;
    u.searchParams.set("size", settings.store.imgSize);
    u.pathname = u.pathname.replace(/\.(png|jpe?g|webp)$/, `.${format}`);
    return u.toString();
}

const openAvatar = (url: string) => openImage(url, 512, 512);
const openBanner = (url: string) => openImage(url, 1024);

function openImage(url: string, width: number, height?: number) {
    const finalUrl = buildUrl(url);
    const u = new URL(finalUrl);
    u.searchParams.set("size", "4096");
    openImageModal({ url: finalUrl, original: u.toString(), width, height });
}

function openGallery(avatarUrl: string | null, bannerUrl: string | null) {
    const items: MediaModalItem[] = [];

    if (avatarUrl) {
        const url = buildUrl(avatarUrl);
        const u = new URL(url);
        u.searchParams.set("size", "4096");
        items.push({ url, original: u.toString(), type: "IMAGE", width: 512, height: 512, alt: "Avatar" });
    }

    if (bannerUrl) {
        const url = buildUrl(bannerUrl);
        const u = new URL(url);
        u.searchParams.set("size", "4096");
        items.push({ url, original: u.toString(), type: "IMAGE", width: 1024, height: 340, alt: "Banner" });
    }

    if (items.length === 0) return;

    openMediaModal({ items, startingIndex: 0 });
}

function injectProfileButton() {
    const btnRows = document.querySelectorAll<HTMLElement>('[class*="profileButtons_"]');
    for (const row of btnRows) {
        if (row.querySelector(".vc-viewicons-btn")) continue;

        const profileEl = row.closest('[class*="inner_"]') || row.closest('[class*="profileBody_"]')?.parentElement;
        if (!profileEl) continue;

        const avatarImg = profileEl.querySelector<HTMLImageElement>('img[class*="avatar_"][src*="cdn.discordapp.com"]');
        const bannerEl = profileEl.querySelector<HTMLElement>('[class*="banner_"]');

        const bannerStyle = bannerEl?.style.backgroundImage || "";
        const bannerMatch = bannerStyle.match(/url\(["']?(.+?)["']?\)/);
        const bannerUrl = bannerMatch?.[1] || null;
        const avatarUrl = avatarImg?.src || null;

        if (!avatarUrl && !bannerUrl) continue;

        // Discord'un kendi buton sınıflarını aynı satırdaki mevcut butondan al
        const existingBtn = row.querySelector<HTMLElement>("button[data-mana-component]");
        if (!existingBtn) continue;

        // Sınıf isimlerini Discord'un butonundan çıkar
        const btnClasses = existingBtn.className;
        const wrapperDiv = existingBtn.querySelector<HTMLElement>('[class*="buttonChildrenWrapper"]');
        const innerDiv = existingBtn.querySelector<HTMLElement>('[class*="buttonChildren"]');
        const iconEl = existingBtn.querySelector<HTMLElement>('[class*="icon_"]');

        const wrapper = document.createElement("span");
        const btn = document.createElement("button");
        btn.setAttribute("data-mana-component", "button");
        btn.setAttribute("role", "button");
        btn.setAttribute("type", "button");
        btn.setAttribute("aria-label", "Görselleri Görüntüle");
        btn.className = btnClasses + " vc-viewicons-btn";

        const childWrapper = document.createElement("div");
        childWrapper.className = wrapperDiv?.className || "";
        const childInner = document.createElement("div");
        childInner.className = innerDiv?.className || "";

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("fill", "currentColor");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("role", "img");
        if (iconEl) svg.setAttribute("class", iconEl.className);
        svg.innerHTML = '<path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2m0-2v-1.59l3-3 1.29 1.29c.39.39 1.02.39 1.41 0l5.29-5.29 3 3V19h-14ZM19 5v5.59L16.71 8.3a.996.996 0 0 0-1.41 0l-5.29 5.29-1.29-1.29a.996.996 0 0 0-1.41 0l-2.29 2.29V5h14Z"></path><path d="M8.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3"></path>';

        childInner.appendChild(svg);
        childWrapper.appendChild(childInner);
        btn.appendChild(childWrapper);

        btn.onclick = e => {
            e.stopPropagation();
            openGallery(avatarUrl, bannerUrl);
        };
        wrapper.appendChild(btn);
        row.appendChild(wrapper);
    }
}

export default definePlugin({
    name: "ViewIcons",
    description: "Kullanıcı profiline tek butonla Avatar ve Banner'ı görüntüleyebileceğiniz bir galeri ekler. Sağ tıkla erişim de sağlar.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    dependencies: ["DynamicImageModalAPI"],
    settings,

    openAvatar,
    openBanner,

    obs: null as MutationObserver | null,

    start() {
        injectProfileButton();
        this.obs = new MutationObserver(() => injectProfileButton());
        this.obs.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        this.obs?.disconnect();
        this.obs = null;
        document.querySelectorAll(".vc-viewicons-btn").forEach(e => e.remove());
    },

    patches: [
        // Banners — tıklanabilir yap
        {
            find: 'backgroundColor:"COMPLETE"',
            replacement: {
                match: /(overflow:"visible",.{0,125}?!1\),)style:{(?=.+?backgroundImage:null!=(\i)\?`url\(\$\{\2\}\))/,
                replace: (_, rest, bannerSrc) => `${rest}onClick:()=>$self.openBanner(${bannerSrc}),style:{cursor:"pointer",`
            }
        }
    ],

    contextMenus: {
        "user-context": (children, { user, guildId }) => {
            if (!user) return;
            const memberAvatar = GuildMemberStore.getMember(guildId!, user.id)?.avatar || null;
            children.splice(-1, 0, (
                <Menu.MenuGroup>
                    <Menu.MenuItem id="view-avatar" label="Avatarı Görüntüle" action={() => openAvatar(IconUtils.getUserAvatarURL(user, true))} icon={ImageIcon} />
                    {memberAvatar && (
                        <Menu.MenuItem id="view-server-avatar" label="Sunucu Avatarını Görüntüle" action={() => openAvatar(IconUtils.getGuildMemberAvatarURLSimple({ userId: user.id, avatar: memberAvatar, guildId: guildId!, canAnimate: true }))} icon={ImageIcon} />
                    )}
                </Menu.MenuGroup>
            ));
        }
    }
});
