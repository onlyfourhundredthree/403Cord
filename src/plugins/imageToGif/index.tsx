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

const messageContextMenuPatch: NavContextMenuPatchCallback = (children, props) => {
    const { message } = props;
    if (!message) return;

    const images: string[] = [];

    for (const attachment of message.attachments ?? []) {
        if (attachment.content_type?.startsWith("image/") && !attachment.content_type.includes("gif")) {
            images.push(attachment.url);
        }
    }

    for (const embed of message.embeds ?? []) {
        if (embed.image?.url && !embed.image.url.includes(".gif")) {
            images.push(embed.image.url);
        } else if (embed.type === "image" && embed.url && !embed.url.includes(".gif")) {
            images.push(embed.url);
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

async function uploadToCatbox(uint8Array: Uint8Array): Promise<string> {
    const helper = (VencordNative as any).pluginHelpers["Görselden Gif"];
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

        const catboxUrl = await uploadToCatbox(uint8Array);

        const channelId = SelectedChannelStore.getChannelId();
        if (channelId) {
            sendMessage(channelId, { content: catboxUrl });
        }

    } catch (err: any) {
        console.error(err);
    } finally {
        if (objUrl) URL.revokeObjectURL(objUrl);
    }
}

export default definePlugin({
    name: "Görselden Gif",
    description: "Görseli GIF'e dönüştürüp Catbox'a yükler ve mevcut kanala mesaj olarak gönderir.",
    authors: [{ name: "antigravity", id: 0n }],
    contextMenus: {
        "image-context": imageContextMenuPatch,
        "message": messageContextMenuPatch
    }
});
