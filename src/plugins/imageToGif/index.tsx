/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { showNotification } from "@api/Notifications";
import definePlugin from "@utils/types";
import { Menu,MessageActions, SelectedChannelStore } from "@webpack/common";
import { applyPalette, GIFEncoder, quantize } from "gifenc";

const imageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    // Only show if we have a src and it's not a link to another page
    if (!props.src || props.href) return;

    children.push(
        <Menu.MenuGroup id="vc-image-to-gif">
            <Menu.MenuItem
                id="convert-to-gif"
                label="Görselden Gif"
                action={() => convertToGifAndSend(props.src)}
            />
        </Menu.MenuGroup>
    );
};

async function uploadToCatbox(uint8Array: Uint8Array): Promise<string> {
    const helper = (VencordNative as any).pluginHelpers.ImageToGif;
    if (helper?.uploadToCatbox) {
        return await helper.uploadToCatbox(uint8Array);
    }

    // Fallback if native is not available (e.g. web or not rebuilt)
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", new Blob([uint8Array as any], { type: "image/gif" }), "image.gif");

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) throw new Error("Görsel Catbox'a yüklenemedi.");
    return (await response.text()).trim();
}

async function convertToGifAndSend(url: string) {
    let objUrl: string | null = null;
    try {
        showNotification({
            title: "Görselden Gif",
            body: "Görsel indiriliyor ve işleniyor...",
        });

        const response = await fetch(url);
        if (!response.ok) throw new Error("Görsel indirilemedi.");

        const buffer = await response.arrayBuffer();
        const img = new Image();
        objUrl = URL.createObjectURL(new Blob([buffer]));
        img.src = objUrl;

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("Görsel yüklenemedi."));
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        // Quantize and create palette
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);

        // Encode to GIF
        const gif = GIFEncoder();
        gif.writeFrame(index, canvas.width, canvas.height, { palette });
        gif.finish();

        const uint8Array = gif.bytesView();

        showNotification({
            title: "Görselden Gif",
            body: "Siteye yükleniyor (Catbox)...",
        });

        const catboxUrl = await uploadToCatbox(uint8Array);

        const channelId = SelectedChannelStore.getChannelId();
        if (channelId) {
            MessageActions.sendMessage(channelId, { content: catboxUrl });
            showNotification({
                title: "Başarılı!",
                body: "GIF oluşturuldu ve kanala gönderildi. Artık gife sağ tıklayıp favorileyebilirsin.",
                image: catboxUrl
            });
        } else {
            showNotification({
                title: "Hata",
                body: "Kanal bulunamadı, GIF gönderilemedi.",
            });
        }

    } catch (err: any) {
        showNotification({
            title: "Görselden Gif Hatası",
            body: err.message,
        });
        console.error(err);
    } finally {
        if (objUrl) URL.revokeObjectURL(objUrl);
    }
}

export default definePlugin({
    name: "ImageToGif",
    description: "Görseli GIF'e dönüştürüp Catbox'a yükler ve mevcut kanala mesaj olarak gönderir.",
    authors: [{ name: "antigravity", id: 0n }],
    contextMenus: {
        "image-context": imageContextMenuPatch
    }
});
