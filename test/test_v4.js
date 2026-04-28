// ==UserScript==
// @name         抖音自动最高画质 (test_v4)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  修复：从config.definition.list直接读取，qualityType→definition正确映射
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        SWITCH_DELAY: 50,
        INIT_DELAY: 500,
        MAX_RETRIES: 30,
        RETRY_INTERVAL: 100,
        WATCHDOG_INTERVAL: 500,
    };

    let stopped = false;
    let lastVideoId = null;
    let checkTimer = null;
    let retryTimer = null;
    let retryCount = 0;
    let lastCheckedId = null;

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

    function getDefinitionList() {
        const p = getPlayer();
        if (!p) return null;
        try {
            const list = p.config && p.config.definition && p.config.definition.list;
            if (Array.isArray(list) && list.length) return list;
        } catch (e) {}
        return null;
    }

    function getBestDefinition() {
        const list = getDefinitionList();
        if (!list) return null;
        let best = null;
        let bestRate = 0;
        for (const d of list) {
            const rate = d.realBitrate || d.bitrate || 0;
            if (rate > bestRate) { bestRate = rate; best = d; }
        }
        if (best && best.height >= 2160) best._is4K = true;
        return best;
    }

    function apiSwitch() {
        const player = getPlayer();
        if (!player) return 'noplayer';

        const list = getDefinitionList();
        if (!list || !list.length) return 'nodef';

        let best = null;
        let bestRate = 0;
        for (const d of list) {
            const rate = d.realBitrate || d.bitrate || 0;
            if (rate > bestRate) { bestRate = rate; best = d; }
        }
        if (!best) return 'nodef';

        const bs = player.getPlugin && player.getPlugin('bitrateselector');
        const curDef = bs && bs.curBitRate ? bs.curBitRate.definition : null;
        const is4K = best.height >= 2160;

        if (curDef === best.definition) {
            if (is4K) { stopped = true; log('已在4K，脚本永久停止'); cleanup(); }
            return 'done';
        }

        try {
            const cur = bs && bs.curBitRate;
            player.changeDefinition({ definition: best.definition }, cur || void 0);
            log(`API切换 def=${curDef} → def=${best.definition} ${best.gearName || ''} (${(bestRate/1000).toFixed(0)}kbps ${best.width}x${best.height})`);
        } catch (e) {
            return 'error';
        }

        if (is4K) {
            stopped = true;
            log('已切换到4K，脚本永久停止');
            cleanup();
        }

        return 'switched';
    }

    function tryApiSwitch() {
        if (stopped) return;
        retryCount++;
        const result = apiSwitch();
        if (result === 'done' || result === 'switched') {
            retryCount = 0;
            return;
        }
        if (retryCount < CONFIG.MAX_RETRIES) {
            retryTimer = setTimeout(tryApiSwitch, CONFIG.RETRY_INTERVAL);
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
            lastCheckedId = null;
            cleanup();
            retryCount = 0;
            checkTimer = setTimeout(tryApiSwitch, CONFIG.SWITCH_DELAY);
        }
    }

    function startObservation() {
        new MutationObserver(mutations => {
            if (stopped) return;
            for (const m of mutations) {
                if (m.target instanceof HTMLVideoElement) { handleNewVideo(); return; }
            }
        }).observe(document.body, {
            attributes: true, subtree: true,
            attributeFilter: ['src', 'data-xgplayerid']
        });

        new MutationObserver(() => {
            if (stopped) return;
            const video = document.querySelector('video');
            if (video) {
                const id = video.getAttribute('data-xgplayerid') || video.currentSrc || video.src;
                if (id && id !== lastVideoId) {
                    lastVideoId = id;
                    lastCheckedId = null;
                    cleanup();
                    retryCount = 0;
                    checkTimer = setTimeout(tryApiSwitch, CONFIG.SWITCH_DELAY);
                }
            }
        }).observe(document.body, { childList: true, subtree: true });
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
            checkTimer = setTimeout(tryApiSwitch, CONFIG.INIT_DELAY);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
