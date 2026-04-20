/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { sendMessage } from "@utils/discord";
import definePlugin from "@utils/types";
import { Menu, SelectedChannelStore } from "@webpack/common";
import { applyPalette, GIFEncoder, quantize } from "gifenc";

const imageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
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

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message } = props;
    if (!message) return;

    const seen = new Set<string>();
    const images: string[] = [];

    const addImage = (url: string) => {
        try {
            const key = new URL(url).pathname;
            if (!seen.has(key)) {
                seen.add(key);
                images.push(url);
            }
        } catch { /* geçersiz URL */ }
    };

    for (const attachment of message.attachments ?? []) {
        if (attachment.content_type?.startsWith("image/") && !attachment.content_type.includes("gif")) {
            addImage(attachment.url);
        }
    }

    for (const embed of message.embeds ?? []) {
        if (embed.image?.url && !embed.image.url.includes(".gif")) {
            addImage(embed.image.url);
        } else if (embed.type === "image" && embed.url && !embed.url.includes(".gif")) {
            addImage(embed.url);
        }
    }

    if (images.length === 0) return;

    children.push(
        <Menu.MenuGroup id="vc-image-to-gif-message">
            {images.length === 1 ? (
                <Menu.MenuItem
                    id="convert-to-gif-message"
                    label="Görselden Gif"
                    action={() => convertToGifAndSend(images[0])}
                />
            ) : (
                <Menu.MenuItem
                    id="convert-to-gif-message-multiple"
                    label="Görselden Gif"
                >
                    {images.map((url, i) => (
                        <Menu.MenuItem
                            key={i}
                            id={`convert-to-gif-message-${i}`}
                            label={`Görsel ${i + 1}`}
                            action={() => convertToGifAndSend(url)}
                        />
                    ))}
                </Menu.MenuItem>
            )}
        </Menu.MenuGroup>
    );
};

async function uploadFile(uint8Array: Uint8Array): Promise<string> {
    // Native helper'ı dene (Electron tarafı, CORS yok)
    const helper = (VencordNative as any).pluginHelpers?.ImageToGif;
    if (helper?.uploadFile) {
        return await helper.uploadFile(uint8Array);
    }

    // Tarayıcı fallback: 0x0.st
    const formData = new FormData();
    formData.append("file", new Blob([uint8Array as any], { type: "image/gif" }), "image.gif");

    const response = await fetch("https://0x0.st", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) throw new Error(`Yükleme hatası: ${response.status}`);
    return (await response.text()).trim();
}

let isSending = false;
async function convertToGifAndSend(url: string) {
    if (isSending) return;
    isSending = true;
    let objUrl: string | null = null;
    try {
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

        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);

        const gif = GIFEncoder();
        gif.writeFrame(index, canvas.width, canvas.height, { palette });
        gif.finish();

        const uint8Array = gif.bytesView();
        const fileUrl = await uploadFile(uint8Array);

        const channelId = SelectedChannelStore.getChannelId();
        if (channelId) {
            sendMessage(channelId, { content: fileUrl });
        }

    } catch (err: any) {
        console.error("[ImageToGif]", err);
    } finally {
        if (objUrl) URL.revokeObjectURL(objUrl);
        isSending = false;
    }
}

export default definePlugin({
    name: "ImageToGif",
    description: "Görseli GIF'e dönüştürüp kalıcı bir linke yükler ve mevcut kanala mesaj olarak gönderir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    contextMenus: {
        "image-context": imageContextMenuPatch,
        "message": messageContextMenuPatch
    }
});
