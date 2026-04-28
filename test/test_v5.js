// ==UserScript==
// @name         抖音自动最高画质 (test_v5)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  DOM点击切换 + API辅助精准选画质 + 过滤自适应模式
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        SWITCH_DELAY: 100,
        INIT_DELAY: 500,
        RETRY_MAX: 5,
        RETRY_INTERVAL: 200,
        PANEL_OPEN_DELAY: 120,
        MOUSE_ENTER_DELAY: 60,
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

    function parseQuality(text) {
        const s = (text || '').toLowerCase();
        if (s.includes('4k') || s.includes('2160')) return 4000;
        if (s.includes('2k') || s.includes('1440')) return 2000;
        if (s.includes('1080')) return 1080;
        if (s.includes('720')) return 720;
        if (s.includes('540')) return 540;
        const match = s.match(/(\d+)/);
        const val = match ? parseInt(match[0], 10) : 0;
        return val >= 540 ? val : 0;
    }

    function getBestDefFromAPI() {
        try {
            const p = window.player;
            if (!p || !p.config || !p.config.definition) return null;
            const list = p.config.definition.list;
            if (!Array.isArray(list) || !list.length) return null;
            let best = null;
            let bestRate = 0;
            for (const d of list) {
                const gn = (d.gearName || '').toLowerCase();
                if (gn.startsWith('adapt') || gn.startsWith('auto') || d.definition < 0) continue;
                const rate = d.realBitrate || 0;
                if (rate > bestRate) { bestRate = rate; best = d; }
            }
            if (best) best._bestRate = bestRate;
            return best;
        } catch (e) {}
        return null;
    }

    function findQualityBtn() {
        return document.querySelector('[class*="playclarity"]');
    }

    function findPanel() {
        const panels = document.querySelectorAll('[class*="virtual"], [class*="panel"], [class*="popup"]');
        for (const p of panels) {
            if (p.children.length > 0 && p.offsetHeight > 0) return p;
        }
        const btn = findQualityBtn();
        if (btn) {
            const inner = btn.querySelector('[class*="virtual"]');
            if (inner && inner.children.length > 0) return inner;
        }
        return null;
    }

    function findItems(panel) {
        let items = Array.from(panel.querySelectorAll('[class*="item"]')).filter(el => parseQuality(el.textContent) > 0);
        if (items.length > 0) return items;
        items = Array.from(panel.children).filter(el => parseQuality(el.textContent) > 0);
        if (items.length > 0) return items;
        items = Array.from(panel.querySelectorAll('div, span, li')).filter(el => {
            return parseQuality(el.textContent) > 0 && el.children.length < 3;
        });
        return items;
    }

    async function getQualityOptions() {
        const btn = findQualityBtn();
        if (!btn) return [];
        let panel = findPanel();
        if (!panel || panel.children.length === 0) {
            btn.click();
            await sleep(CONFIG.PANEL_OPEN_DELAY);
            panel = findPanel();
            if (!panel) return [];
        }
        panel.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await sleep(CONFIG.MOUSE_ENTER_DELAY);
        const items = findItems(panel);
        return items.filter(item => {
            const text = item.textContent || '';
            return !text.includes('智能') && !text.includes('自动') && !text.toLowerCase().includes('auto');
        });
    }

    async function domUpgrade() {
        if (stopped) return false;
        retryCount++;

        const bestDef = getBestDefFromAPI();
        const is4KVideo = bestDef && bestDef.height >= 2160;
        const topRate = bestDef && bestDef._bestRate;

        const items = await getQualityOptions();
        if (items.length === 0) {
            if (retryCount <= CONFIG.RETRY_MAX) {
                log(`重试 ${retryCount}/${CONFIG.RETRY_MAX}`);
                await sleep(CONFIG.RETRY_INTERVAL);
                if (!stopped) return await domUpgrade();
            }
            return false;
        }

        let bestItem = null;
        let bestVal = 0;

        if (bestDef && bestDef.gearName) {
            const gn = bestDef.gearName.toLowerCase();
            for (const item of items) {
                const text = item.textContent.toLowerCase();
                if (gn.startsWith('normal_1080') && text.includes('1080')) { bestItem = item; bestVal = 1080; break; }
                if (gn.startsWith('low_720') && text.includes('720')) { bestItem = item; bestVal = 720; break; }
                if (gn.startsWith('low_540') && text.includes('540')) { bestItem = item; bestVal = 540; break; }
                if (topRate && topRate > 2500000 && text.includes('4k')) { bestItem = item; bestVal = 4000; break; }
                if (is4KVideo && text.includes('4k')) { bestItem = item; bestVal = 4000; break; }
            }
        }

        if (!bestItem) {
            for (const item of items) {
                const val = parseQuality(item.textContent);
                if (val > bestVal) { bestVal = val; bestItem = item; }
            }
        }

        if (!bestItem) return false;

        bestItem.click();
        log(`DOM切换 ${bestItem.textContent.trim()} (${bestVal})`);
        document.body.click();

        if (is4KVideo || bestVal >= 4000) {
            stopped = true;
            log('已切换到最高画质(4K)，脚本永久停止');
            cleanup();
        }
        return true;
    }

    function scheduleUpgrade(delay) {
        if (stopped) return;
        cleanup();
        retryCount = 0;
        checkTimer = setTimeout(async () => {
            checkTimer = null;
            if (!stopped) {
                const ok = await domUpgrade();
                if (!ok && retryCount < CONFIG.RETRY_MAX && !stopped) {
                    retryTimer = setTimeout(() => {
                        if (!stopped) scheduleUpgrade(100);
                    }, CONFIG.RETRY_INTERVAL);
                }
            }
        }, delay);
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
            scheduleUpgrade(CONFIG.SWITCH_DELAY);
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
                    scheduleUpgrade(CONFIG.SWITCH_DELAY);
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
            scheduleUpgrade(CONFIG.INIT_DELAY);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
