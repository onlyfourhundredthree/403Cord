/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { fetchBuffer, fetchJson } from "@main/utils/http";
import { IpcEvents } from "@shared/IpcEvents";
import { VENCORD_USER_AGENT } from "@shared/vencordUserAgent";
import { ipcMain } from "electron";
import { rename, writeFile } from "fs/promises";
import { join } from "path";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { serializeErrors } from "./common";

const API_BASE = `https://api.github.com/repos/${gitRemote}`;
let PendingUpdates = [] as [string, string][];

async function githubGet<T = any>(endpoint: string) {
    return fetchJson<T>(API_BASE + endpoint, {
        headers: {
            Accept: "application/vnd.github+json",
            // "All API requests MUST include a valid User-Agent header.
            // Requests with no User-Agent header will be rejected."
            "User-Agent": VENCORD_USER_AGENT
        }
    });
}

async function calculateGitChanges() {
    const isOutdated = await fetchUpdates();
    if (!isOutdated) return [];

    const data = await githubGet("/releases/latest");

    return [{
        hash: data.tag_name,
        author: "403Cord",
        message: data.name || "Yeni Güncelleme Mevcut!"
    }];
}

async function fetchUpdates() {
    const data = await githubGet("/releases/latest");

    const hash = data.tag_name;
    if (hash === gitHash)
        return false;

    data.assets.forEach(({ name, browser_download_url }) => {
        if (name === "403Cord.asar") {
            PendingUpdates.push([name, browser_download_url]);
        }
    });

    return true;
}

async function applyUpdates() {
    const asarUrl = PendingUpdates.find(p => p[0] === "403Cord.asar")?.[1];
    if (asarUrl) {
        const contents = await fetchBuffer(asarUrl);
        // __dirname inside an asar is /.../403Cord.asar/. We want the actual asar file path.
        const isInsideAsar = __dirname.endsWith(".asar");
        const asarPath = isInsideAsar ? __dirname : join(__dirname, "..", "403Cord.asar");

        try {
            await rename(asarPath, asarPath + ".old");
        } catch (e) { }

        await writeFile(asarPath, contents);
    }

    PendingUpdates = [];
    return true;
}

ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(() => `https://github.com/${gitRemote}`));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(fetchUpdates));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(applyUpdates));
