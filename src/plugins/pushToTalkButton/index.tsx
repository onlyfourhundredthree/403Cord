/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { FluxDispatcher, MediaEngineStore,Menu } from "@webpack/common";

function MicIcon() {
    return (
        <svg role="img" width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
    );
}

function PTTIcon() {
    return (
        <svg role="img" width="18" height="18" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
    );
}

function togglePTT() {
    const currentMode = MediaEngineStore.getMode();
    const isPTT = currentMode === "PUSH_TO_TALK";
    const newMode: "PUSH_TO_TALK" | "VOICE_ACTIVITY" = isPTT ? "VOICE_ACTIVITY" : "PUSH_TO_TALK";

    const modeOptions = MediaEngineStore.getModeOptions();
    const mediaEngine = MediaEngineStore.getMediaEngine();

    const inputModeOptions = {
        vadThreshold: modeOptions?.threshold ?? -60,
        vadAutoThreshold: modeOptions?.autoThreshold ?? true,
        vadLeading: modeOptions?.vadLeading ?? 5,
        vadTrailing: modeOptions?.vadTrailing ?? 25,
        pttReleaseDelay: modeOptions?.delay ?? 20,
        shortcut: modeOptions?.shortcut ?? []
    };

    FluxDispatcher.dispatch({
        type: "AUDIO_SET_MODE",
        mode: newMode,
        modeOptions: inputModeOptions
    });

    const connections = mediaEngine?.connections;
    if (connections && connections.size > 0) {
        connections.forEach((conn: any) => {
            conn.setInputMode(newMode, inputModeOptions);
        });
    }
}

const audioDeviceContextPatch: NavContextMenuPatchCallback = children => {
    const voiceMode = MediaEngineStore.getMode();
    const modeOptions = MediaEngineStore.getModeOptions();

    const isPTT = voiceMode === "PUSH_TO_TALK";
    const shortcut = modeOptions?.shortcut?.[0] || "Tuş Atanmamış";
    const delay = modeOptions?.delay ?? 20;

    const lastGroupIndex = children.length - 1;

    children.splice(
        lastGroupIndex,
        0,
        <Menu.MenuSeparator key="ptt-separator" />,
        <Menu.MenuItem
            key="ptt-toggle"
            id="ptt-toggle"
            label={isPTT ? "Ses Etkinliği Moduna Geç" : "Bas Konuş Moduna Geç"}
            icon={isPTT ? MicIcon : PTTIcon}
            action={togglePTT}
        />
    );

    if (isPTT) {
        children.splice(
            lastGroupIndex + 2,
            0,
            <Menu.MenuItem
                key="ptt-info"
                id="ptt-info"
                label={`Bas Konuş: ${shortcut} (${delay}ms gecikme)`}
                disabled
            />
        );
    }
};

export default definePlugin({
    name: "Bas Konuşumu Geri Ver",
    description: "Mikrofonunuza sağ tıkladığınızda açılan ayar penceresine eski bas konuş ayarını getirir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],

    contextMenus: {
        "audio-device-context": audioDeviceContextPatch
    }
});
