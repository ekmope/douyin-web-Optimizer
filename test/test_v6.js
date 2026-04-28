// ==UserScript==
// @name         抖音自动最高画质 (test_v6)
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  等待面板就绪再切换 + 画质只升不降 + 过滤自适应
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        ITEM_POLL_INTERVAL: 50,
        ITEM_POLL_TIMEOUT: 3000,
        INIT_DELAY: 300,
    };

    let stopped = false;
    let lastVideoId = null;
    let checkTimer = null;
    let pollTimer = null;
    let qualityFloor = 0;

    function saveFloor(val) {
        if (val <= qualityFloor) return;
        qualityFloor = val;
    }

    function log(msg) {
        console.log(`[画质] ${msg}`);
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function cleanup() {
        if (checkTimer) { clearTimeout(checkTimer); checkTimer = null; }
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
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

    function findQualityBtn() {
        return document.querySelector('[class*="playclarity"]');
    }

    function findQualityItems() {
        const panels = document.querySelectorAll('[class*="virtual"], [class*="panel"], [class*="popup"]');
        for (const p of panels) {
            if (!p.children.length || !p.offsetHeight) continue;
            let items = Array.from(p.querySelectorAll('[class*="item"]')).filter(el => parseQuality(el.textContent) > 0);
            if (items.length >= 2) return items;
            items = Array.from(p.children).filter(el => parseQuality(el.textContent) > 0);
            if (items.length >= 2) return items;
            items = Array.from(p.querySelectorAll('div, span, li')).filter(el => {
                return parseQuality(el.textContent) > 0 && el.children.length < 3;
            });
            if (items.length >= 2) return items;
        }
        const btn = findQualityBtn();
        if (btn) {
            const inner = btn.querySelector('[class*="virtual"]');
            if (inner && inner.children.length) {
                const items = Array.from(inner.querySelectorAll('[class*="item"], div, span, li')).filter(el => {
                    return parseQuality(el.textContent) > 0 && el.children.length < 3;
                });
                if (items.length >= 2) return items;
            }
        }
        return [];
    }

    async function waitForItems(timeout) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const items = findQualityItems();
            if (items.length >= 2) return items;
            await sleep(CONFIG.ITEM_POLL_INTERVAL);
        }
        return findQualityItems();
    }

    async function openPanel() {
        const btn = findQualityBtn();
        if (!btn) return false;
        btn.click();
        await sleep(100);
        btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        const inner = btn.querySelector('[class*="virtual"]');
        if (inner) inner.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        return true;
    }

    async function getQualityOptions() {
        const items = findQualityItems();
        if (items.length >= 2) return filterAutoItems(items);
        const opened = await openPanel();
        if (!opened) return [];
        const freshItems = await waitForItems(CONFIG.ITEM_POLL_TIMEOUT);
        return filterAutoItems(freshItems);
    }

    function filterAutoItems(items) {
        return items.filter(item => {
            const text = item.textContent || '';
            return !text.includes('智能') && !text.includes('自动') && !text.toLowerCase().includes('auto');
        });
    }

    function getTargetQuality() {
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
            if (!best) return null;
            const height = best.height || 0;
            if (height >= 2160) return { val: 4000, is4K: true, rate: bestRate };
            if (height >= 1080) return { val: 1080, is4K: false, rate: bestRate };
            if (height >= 720) return { val: 720, is4K: false, rate: bestRate };
            if (height >= 540) return { val: 540, is4K: false, rate: bestRate };
            return { val: 540, is4K: false, rate: bestRate };
        } catch (e) {}
        return null;
    }

    async function domUpgrade() {
        if (stopped) return;
        const items = await getQualityOptions();
        if (items.length < 2) {
            log('未找到足够画质选项');
            return;
        }

        let bestItem = null;
        let bestVal = 0;
        for (const item of items) {
            const val = parseQuality(item.textContent);
            if (val > bestVal) { bestVal = val; bestItem = item; }
        }

        const target = getTargetQuality();
        if (target && target.val > bestVal) {
            for (const item of items) {
                const val = parseQuality(item.textContent);
                if (val >= target.val) { bestVal = val; bestItem = item; }
            }
        }

        if (!bestItem) return;

        if (bestVal < qualityFloor) {
            log(`跳过 ${bestItem.textContent.trim()} (低于已选画质${qualityFloor})`);
            return;
        }

        bestItem.click();
        log(`切换 ${bestItem.textContent.trim()} (${bestVal})`);
        document.body.click();
        saveFloor(bestVal);

        if (bestVal >= 4000) {
            stopped = true;
            log(`最高画质4K已选择 (地板=${qualityFloor})，脚本永久停止`);
            cleanup();
        }
    }

    function scheduleUpgrade(delay) {
        if (stopped) return;
        cleanup();
        checkTimer = setTimeout(async () => {
            checkTimer = null;
            if (!stopped) await domUpgrade();
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
            scheduleUpgrade(CONFIG.INIT_DELAY);
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
                    scheduleUpgrade(CONFIG.INIT_DELAY);
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
