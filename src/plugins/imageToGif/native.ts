/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";
import { request } from "https";

export async function uploadFile(_: IpcMainInvokeEvent, buffer: Uint8Array) {
    return new Promise<string>((resolve, reject) => {
        const boundary = "----vencord-boundary-" + Date.now();

        const header = [
            `--${boundary}`,
            'Content-Disposition: form-data; name="file"; filename="image.gif"',
            "Content-Type: image/gif",
            "",
            "",
        ].join("\r\n");

        const footer = `\r\n--${boundary}--\r\n`;

        const req = request("https://0x0.st", {
            method: "POST",
            headers: {
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "User-Agent": "Vencord (https://vencord.dev)"
            }
        }, res => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                if (res.statusCode !== 200) reject(new Error(`Upload error: ${res.statusCode} ${data}`));
                else resolve(data.trim());
            });
        });

        req.on("error", reject);

        req.write(header);
        req.write(Buffer.from(buffer));
        req.write(footer);
        req.end();
    });
}
