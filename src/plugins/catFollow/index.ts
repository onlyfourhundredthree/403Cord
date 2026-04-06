/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Mouse Cat",
    description: "Discord ekranındayken mouse'unuzu bir kedi takip eder.",
    authors: [Devs.Toji, Devs.Aki],

    async start() {
        const res = await fetch("https://raw.githubusercontent.com/adryd325/oneko.js/c4ee66353b11a44e4a5b7e914a81f8d33111555e/oneko.js");
        const text = await res.text();

        const scriptCode = text
            .replace("./oneko.gif", "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif")
            .replace("(isReducedMotion)", "(false)");

        const script = document.createElement("script");
        script.id = "kedi-uwu-script";
        script.innerHTML = scriptCode;
        document.body.appendChild(script);
    },

    stop() {
        document.getElementById("oneko")?.remove();
        document.getElementById("kedi-uwu-script")?.remove();
    }
});
