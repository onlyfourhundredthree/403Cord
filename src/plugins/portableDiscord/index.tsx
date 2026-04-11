/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import { OpenExternalIcon as PopoutIcon } from "@components/Icons";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { PortableContainer } from "./PortableContainer";

export const settings = definePluginSettings({
    popouts: {
        type: OptionType.STRING, // JSON stringified for simplicity in settings
        default: "{}",
        description: "Popped out panels state",
        hidden: true
    }
});

interface PluginState {
    activePopouts: Set<string>;
}

const state: PluginState = {
    activePopouts: new Set()
};

export default definePlugin({
    name: "PortableDiscord",
    description: "Discord'un çeşitli panellerini (Kanallar, Üyeler, Ses) taşınabilir hale getirir.",
    authors: [{ name: "toji", id: 1078973188718993418n }, { name: "aki", id: 219652216095506433n }],
    settings,

    onStart() {
        try {
            const saved = JSON.parse(settings.store.popouts);
            state.activePopouts = new Set(Array.isArray(saved) ? saved : []);
        } catch (e) {
            state.activePopouts = new Set();
        }
    },

    patches: [
        {
            // Sidebar (Channels) Popout
            find: "renderSidebar(){",
            replacement: [
                {
                    match: /className:\i\.\i\.sidebar,children:\[(.+?)\]/,
                    replace: (m, children) => `className:Vencord.Webpack.findCssClasses(["sidebar"])[0], children:[...($self.isPoppedOut('sidebar') ? [] : [${children}]), $self.renderPopoutButton('sidebar')]`
                },
                {
                    match: /return\(0,\i\.jsxs?\)\("div",\{className:\i\.\i\.sidebar,/,
                    replace: m => `if($self.isPoppedOut('sidebar')) return $self.wrapPortable('sidebar', 'Kanallar', (0, Vencord.Webpack.Common.React.jsx)("div", { className: Vencord.Webpack.findCssClasses(["sidebar"])[0], children: [${m.split("children:[")[1]?.split("]")[0] || "null"}] })); ${m}`
                }
            ]
        },
        {
            // Members List
            find: "aria-multiselectable",
            replacement: [
                {
                    match: /className:\i,children:\[(\i\.useMemo.+?)\]/,
                    replace: (m, className, memo) => `className:${className}, children:[$self.renderPopoutButton('members'), $self.isPoppedOut('members') ? $self.wrapPortable('members', 'Üyeler', ${memo}) : ${memo}]`
                }
            ]
        },
        {
            // Panels
            find: "renderPanels(){",
            replacement: [
                {
                    match: /className:\i\.\i\.panels,children:\[(.+?)\]/,
                    replace: (m, children) => `className:Vencord.Webpack.findCssClasses(["panels"])[0], children:[...($self.isPoppedOut('panels') ? [] : [${children}]), $self.renderPopoutButton('panels')]`
                }
            ]
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
        VencordNative.updater.rebuild();
    },

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
    },

    renderPopoutButton(id: string) {
        return (
            <div
                className="vc-portable-popout-btn"
                onClick={e => {
                    e.stopPropagation();
                    this.togglePopout(id);
                }}
                style={{
                    position: "absolute",
                    top: "10px",
                    right: id === "sidebar" ? "12px" : "48px",
                    zIndex: 2000,
                    width: "26px",
                    height: "26px"
                }}
            >
                <PopoutIcon width={16} height={16} />
            </div>
        );
    }
});
