/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { OpenExternalIcon as PopoutIcon } from "@components/Icons";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { PortableContainer } from "./PortableContainer";

const state = {
    activePopouts: new Set<string>()
};

export const settings = definePluginSettings({
    popouts: {
        type: OptionType.STRING,
        default: "[]",
        description: "Popped out panels state",
        hidden: true
    }
});

export default definePlugin({
    name: "PortableDiscord",
    description: "Discord'un çeşitli panellerini (Kanallar, Üyeler, Ses) taşınabilir hale getirir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    onStart() {
        try {
            const saved = JSON.parse(settings.store.popouts);
            state.activePopouts = new Set(Array.isArray(saved) ? saved : []);
        } catch {
            state.activePopouts = new Set();
        }
    },

    patches: [
        {
            // Sidebar: hide when popped out, inject popout button into children
            find: "renderSidebar(){",
            replacement: {
                match: /(?<=renderSidebar\(\){)/,
                replace: "if($self.isPoppedOut('sidebar'))return null;"
            }
        },
        {
            // Member List: inject popout button right before the useMemo list element
            // Exact same approach as MemberCount plugin
            find: "{isSidebarVisible:",
            replacement: {
                match: /children:\[(\i\.useMemo[^}]+"aria-multiselectable")(?<=className:(\i),.+?)/,
                replace: "children:[$2?.includes('members')?$self.renderMembersToggle():null,$1"
            }
        },
        {
            // Panels: hide when popped out
            find: "renderPanels(){",
            replacement: {
                match: /(?<=renderPanels\(\){)/,
                replace: "if($self.isPoppedOut('panels'))return null;"
            }
        }
    ],

    isPoppedOut(id: string) {
        return state.activePopouts.has(id);
    },

    togglePopout(id: string) {
        if (state.activePopouts.has(id)) {
            state.activePopouts.delete(id);
        } else {
            state.activePopouts.add(id);
        }
        settings.store.popouts = JSON.stringify(Array.from(state.activePopouts));
        // Force Discord to re-render the component
        const el = document.querySelector("[data-portable-id]");
        (el as any)?._reactFiber?.return?.stateNode?.forceUpdate?.();
    },

    // Shown inside the member list sidebar - uses a toggle button
    renderMembersToggle: ErrorBoundary.wrap(() => {
        const [isOut, setOut] = React.useState(state.activePopouts.has("members"));

        return (
            <div
                className="vc-portable-popout-btn"
                title={isOut ? "Üyeler Listesini Geri Al" : "Üyeler Listesini Taşı"}
                onClick={() => {
                    const plugin = Vencord.Plugins.plugins.PortableDiscord as any;
                    plugin.togglePopout("members");
                    setOut(!isOut);
                }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: "4px" }}
            >
                <PopoutIcon width={16} height={16} />
            </div>
        );
    }, { noop: true }),

    // Sidebar popout button - rendered via DOM injection through renderSidebar patch
    renderSidebarToggle: ErrorBoundary.wrap(() => {
        const [isOut, setOut] = React.useState(state.activePopouts.has("sidebar"));

        return (
            <div
                className="vc-portable-popout-btn"
                title={isOut ? "Kanallar Listesini Geri Al" : "Kanallar Listesini Taşı"}
                onClick={() => {
                    const plugin = Vencord.Plugins.plugins.PortableDiscord as any;
                    plugin.togglePopout("sidebar");
                    setOut(!isOut);
                }}
            >
                <PopoutIcon width={16} height={16} />
            </div>
        );
    }, { noop: true }),

    wrapPortable(id: string, title: string, content: React.ReactNode) {
        if (!this.isPoppedOut(id)) return content;

        return (
            <PortableContainer
                id={id}
                title={title}
                onClose={() => this.togglePopout(id)}
            >
                {content}
            </PortableContainer>
        );
    }
});
