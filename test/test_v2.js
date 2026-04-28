// ==UserScript==
// @name         抖音自动最高画质 (test_v2)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  API优先方案：player.changeDefinition直接切画质，零延迟
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        SWITCH_DELAY: 50,
        INIT_DELAY: 500,
        MAX_API_RETRIES: 20,
        API_RETRY_INTERVAL: 100,
    };

    let stopped = false;
    let lastVideoId = null;
    let checkTimer = null;
    let retryTimer = null;
    let retryCount = 0;

    function log(msg) {
        console.log(`[画质] ${msg}`);
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function cleanup() {
        if (checkTimer) { clearTimeout(checkTimer); checkTimer = null; }
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    }

    function getPlayer() {
        try {
            if (window.player && typeof window.player.getPlugin === 'function') {
                return window.player;
            }
        } catch (e) {}
        return null;
    }

    function getBitrateSelector(player) {
        try {
            return player.getPlugin('bitrateselector');
        } catch (e) {}
        return null;
    }

    function is4KByRate(bitrate) {
        return bitrate >= 3000000;
    }

    function apiSwitch() {
        const player = getPlayer();
        if (!player) return 'noplayer';

        const bs = getBitrateSelector(player);
        if (!bs) return 'nobs';

        const list = bs.selectInfo && bs.selectInfo.qualityBitrateSelector;
        if (!list || !list.length) return 'nodef';

        let bestDef = null;
        let bestBitrate = 0;
        for (const entry of list) {
            const [defStr, rateStr] = entry.split(':');
            const rateNum = parseInt(rateStr, 10);
            if (rateNum > bestBitrate) {
                bestBitrate = rateNum;
                bestDef = parseInt(defStr, 10);
            }
        }
        if (!bestDef) return 'nodef';

        const cur = bs.curBitRate;
        const curDef = cur && cur.definition;

        if (curDef === bestDef) {
            if (is4KByRate(bestBitrate)) {
                stopped = true;
                log('已在4K，脚本永久停止');
                cleanup();
            }
            return 'done';
        }

        try {
            player.changeDefinition({ definition: bestDef }, cur || void 0);
            log(`API切换 def=${curDef} → def=${bestDef} (${(bestBitrate/1000).toFixed(0)}kbps)`);
        } catch (e) {
            return 'error';
        }

        if (is4KByRate(bestBitrate)) {
            stopped = true;
            log('已切换到4K，脚本永久停止');
            cleanup();
        }

        return 'switched';
    }

    function tryApiSwitchWithRetry() {
        if (stopped) return;
        retryCount++;
        const result = apiSwitch();

        if (result === 'done' || result === 'switched') {
            retryCount = 0;
            return;
        }

        if (retryCount < CONFIG.MAX_API_RETRIES) {
            retryTimer = setTimeout(tryApiSwitchWithRetry, CONFIG.API_RETRY_INTERVAL);
        }
    }

    function getCurrentVideoId() {
        const video = document.querySelector('video');
        if (!video) return null;
        return video.getAttribute('data-xgplayerid') || video.currentSrc || video.src || null;
    }

    function handleNewVideo() {
        if (stopped) return;
        const newId = getCurrentVideoId();
        if (newId && newId !== lastVideoId) {
            lastVideoId = newId;
            cleanup();
            retryCount = 0;
            checkTimer = setTimeout(tryApiSwitchWithRetry, CONFIG.SWITCH_DELAY);
        }
    }

    function startObservation() {
        const attrObserver = new MutationObserver(mutations => {
            if (stopped) return;
            for (const m of mutations) {
                if (m.target instanceof HTMLVideoElement) {
                    handleNewVideo();
                    return;
                }
            }
        });
        attrObserver.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['src', 'data-xgplayerid']
        });

        const domObserver = new MutationObserver(() => {
            if (stopped) return;
            const video = document.querySelector('video');
            if (video) {
                const id = video.getAttribute('data-xgplayerid') || video.currentSrc || video.src;
                if (id && id !== lastVideoId) {
                    lastVideoId = id;
                    cleanup();
                    retryCount = 0;
                    checkTimer = setTimeout(tryApiSwitchWithRetry, CONFIG.SWITCH_DELAY);
                }
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
        return [attrObserver, domObserver];
    }

    function patchHistory() {
        const wrap = method => {
            const orig = history[method];
            if (typeof orig !== 'function') return;
            history[method] = function (...args) {
                const result = orig.apply(this, args);
                setTimeout(handleNewVideo, 300);
                return result;
            };
        };
        wrap('pushState');
        wrap('replaceState');
        window.addEventListener('popstate', () => setTimeout(handleNewVideo, 300));
    }

    function init() {
        if (stopped) return;
        patchHistory();
        startObservation();
        const id = getCurrentVideoId();
        if (id) {
            lastVideoId = id;
            retryCount = 0;
            checkTimer = setTimeout(tryApiSwitchWithRetry, CONFIG.INIT_DELAY);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
