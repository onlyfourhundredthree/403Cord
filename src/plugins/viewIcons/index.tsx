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

        const btn = document.createElement("button");
        btn.className = "vc-viewicons-btn";
        btn.title = "Görselleri Görüntüle";
        btn.innerHTML = "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><path d=\"M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V5h14v14zm-7-2l-4-5 1.5-2 2.5 3 3.5-4.5 1.5 2L12 17z\"/></svg>";
        btn.onclick = e => {
            e.stopPropagation();
            openGallery(avatarUrl, bannerUrl);
        };

        row.appendChild(btn);
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
