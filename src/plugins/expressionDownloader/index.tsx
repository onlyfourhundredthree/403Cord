/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { GuildSticker } from "@vencord/discord-types";
import { StickerFormatType } from "@vencord/discord-types/enums";
import { Constants, FluxDispatcher, Menu, RestAPI, StickersStore, Toasts } from "@webpack/common";
import { Promisable } from "type-fest";

interface Sticker extends GuildSticker {
    t: "Sticker";
}

interface Emoji {
    t: "Emoji";
    id: string;
    name: string;
    isAnimated: boolean;
}

type Data = Emoji | Sticker;

const StickerExtMap = {
    [StickerFormatType.PNG]: "png",
    [StickerFormatType.APNG]: "apng",
    [StickerFormatType.LOTTIE]: "json",
    [StickerFormatType.GIF]: "gif"
} as const;

function getUrl(data: Data, size: number) {
    if (data.t === "Emoji") {
        const ext = data.isAnimated ? "gif" : "png";
        return `${location.protocol}//${window.GLOBAL_ENV.CDN_HOST}/emojis/${data.id}.${ext}?size=${size}&quality=lossless`;
    }

    return `${window.GLOBAL_ENV.MEDIA_PROXY_ENDPOINT}/stickers/${data.id}.${StickerExtMap[data.format_type]}?size=${size}&quality=lossless`;
}

function getFileExtension(data: Data): string {
    if (data.t === "Emoji") {
        return data.isAnimated ? "gif" : "png";
    }
    return StickerExtMap[data.format_type] ?? "png";
}

async function fetchSticker(id: string) {
    const cached = StickersStore.getStickerById(id);
    if (cached) return cached;

    const { body } = await RestAPI.get({
        url: Constants.Endpoints.STICKER(id)
    });

    FluxDispatcher.dispatch({
        type: "STICKER_FETCH_SUCCESS",
        sticker: body
    });

    return body as Sticker;
}

async function doDownload(data: Data) {
    try {
        const url = getUrl(data, 4096);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);

        const blob = await res.blob();
        const ext = getFileExtension(data);
        const fileName = `${data.name}.${ext}`;

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 100);

        Toasts.show({
            message: `${data.name}.${ext} başarıyla indirildi!`,
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId()
        });
    } catch (e: any) {
        console.error("[ExpressionDownloader]", "İndirme hatası:", data.name, e);
        Toasts.show({
            message: `İndirme başarısız: ${e.message ?? "Bilinmeyen hata"}`,
            type: Toasts.Type.FAILURE,
            id: Toasts.genId()
        });
    }
}

function isGifUrl(url: string) {
    const u = new URL(url);
    return u.pathname.endsWith(".gif") || u.searchParams.get("animated") === "true";
}

function buildMenuItem(type: "Emoji" | "Sticker", fetchData: () => Promisable<Omit<Sticker | Emoji, "t">>) {
    return (
        <Menu.MenuItem
            id="expression-downloader"
            key="expression-downloader"
            label={`İndir: ${type}`}
            action={async () => {
                const res = await fetchData();
                const data = { t: type, ...res } as Sticker | Emoji;
                doDownload(data);
            }}
        />
    );
}

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { favoriteableId, itemHref, itemSrc, favoriteableType } = props ?? {};

    if (!favoriteableId) return;

    const menuItem = (() => {
        switch (favoriteableType) {
            case "emoji":
                const match = props.message.content.match(RegExp(`<a?:(\\w+)(?:~\\d+)?:${favoriteableId}>|https://cdn\\.discordapp\\.com/emojis/${favoriteableId}\\.`));
                const reaction = props.message.reactions.find(reaction => reaction.emoji.id === favoriteableId);
                if (!match && !reaction) return;
                const name = (match && match[1]) ?? reaction?.emoji.name ?? "emoji";

                return buildMenuItem("Emoji", () => ({
                    id: favoriteableId,
                    name,
                    isAnimated: isGifUrl(itemHref ?? itemSrc)
                }));
            case "sticker":
                const sticker = props.message.stickerItems.find(s => s.id === favoriteableId);
                if (sticker?.format_type === 3 /* LOTTIE */) return;

                return buildMenuItem("Sticker", () => fetchSticker(favoriteableId));
        }
    })();

    if (menuItem)
        findGroupChildrenByChildId("copy-link", children)?.push(menuItem);
};

const expressionPickerPatch: NavContextMenuPatchCallback = (children, props: { target: HTMLElement; }) => {
    const { id, name, type } = props?.target?.dataset ?? {};
    if (!id) return;

    if (type === "emoji" && name) {
        const firstChild = props.target.firstChild as HTMLImageElement;

        children.push(buildMenuItem("Emoji", () => ({
            id,
            name,
            isAnimated: firstChild && isGifUrl(firstChild.src)
        })));
    } else if (type === "sticker" && !props.target.className?.includes("lottieCanvas")) {
        children.push(buildMenuItem("Sticker", () => fetchSticker(id)));
    }
};

export default definePlugin({
    name: "ExpressionDownloader",
    description: "Emoji ve Sticker'ları sağ tıklayarak direkt PNG/GIF olarak bilgisayarınıza indirin",
    tags: ["EmojiDownloader", "StickerDownloader", "Download"],
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    contextMenus: {
        "message": messageContextMenuPatch,
        "expression-picker": expressionPickerPatch
    }
});
