/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { fetchBuffer, fetchJson } from "@main/utils/http";
import { IpcEvents } from "@shared/IpcEvents";
import { ipcMain } from "electron";
import { rename, writeFile } from "fs/promises";
import { join } from "path";

import gitHash from "~git-hash";
import gitRemote from "~git-remote";

import { serializeErrors } from "./common";

const RAW_PACKAGE_JSON = `https://raw.githubusercontent.com/${gitRemote}/main/package.json`;
let PendingUpdateUrl: string | null = null;

async function checkIsOutdated() {
    try {
        const pkg = await fetchJson<any>(RAW_PACKAGE_JSON);
        const latestHash = "v" + pkg.version;
        if (latestHash !== gitHash) {
            return {
                hash: latestHash,
                version: pkg.version
            };
        }
        return null;
    } catch {
        return null;
    }
}

async function calculateGitChanges() {
    const update = await checkIsOutdated();
    if (!update) return [];

    return [{
        hash: update.hash,
        author: "403Cord",
        message: `Yeni Güncelleme Mevcut! (v${update.version})`
    }];
}

async function fetchUpdates() {
    const update = await checkIsOutdated();
    if (!update) return false;

    PendingUpdateUrl = `https://github.com/${gitRemote}/releases/latest/download/403Cord.asar`;

    return true;
}

async function applyUpdates() {
    if (!PendingUpdateUrl) return false;

    const contents = await fetchBuffer(PendingUpdateUrl);
    const isInsideAsar = __dirname.endsWith(".asar");
    const asarPath = isInsideAsar ? __dirname : join(__dirname, "..", "403Cord.asar");

    try {
        await rename(asarPath, asarPath + ".old");
    } catch (e) { }

    await writeFile(asarPath, contents);
    PendingUpdateUrl = null;
    return true;
}

ipcMain.handle(IpcEvents.GET_REPO, serializeErrors(() => `https://github.com/${gitRemote}`));
ipcMain.handle(IpcEvents.GET_UPDATES, serializeErrors(calculateGitChanges));
ipcMain.handle(IpcEvents.UPDATE, serializeErrors(fetchUpdates));
ipcMain.handle(IpcEvents.BUILD, serializeErrors(applyUpdates));
