// ==UserScript==
// @name         抖音自动最高画质 (test_v7)
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  播放器就绪 + items轮询 + 快滑防丢 + 画质只升不降
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        READY_POLL_MS: 30,
        READY_TIMEOUT: 5000,
        ITEM_POLL_MS: 50,
        ITEM_TIMEOUT: 3000,
    };

    let stopped = false;
    let lastVideoId = null;
    let checkTimer = null;
    let qualityFloor = 0;
    let upgrading = false;
    let pendingUpgrade = false;

    function saveFloor(val) {
        if (val <= qualityFloor) return;
        qualityFloor = val;
        log(`地板提升至 ${val}`);
    }

    function log(msg) {
        console.log(`[画质] ${msg}`);
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function cleanup() {
        if (checkTimer) { clearTimeout(checkTimer); checkTimer = null; }
    }

    function videoChanged() {
        const curId = getCurrentVideoId();
        return curId && curId !== lastVideoId;
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

    function isPlayerReady() {
        try {
            const p = window.player;
            if (!p || !p.config || !p.config.definition) return false;
            const list = p.config.definition.list;
            if (!Array.isArray(list) || list.length < 2) return false;
            const plugin = p.getPlugin && p.getPlugin('bitrateselector');
            return !!plugin;
        } catch (e) { return false; }
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
            if (!best) return null;
            const height = best.height || 0;
            if (height >= 2160) return { val: 4000, is4K: true };
            if (height >= 1440) return { val: 2000, is4K: false };
            if (height >= 1080) return { val: 1080, is4K: false };
            if (height >= 720) return { val: 720, is4K: false };
            return { val: 540, is4K: false };
        } catch (e) { return null; }
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

    function filterAutoItems(items) {
        return items.filter(item => {
            const text = item.textContent || '';
            return !text.includes('智能') && !text.includes('自动') && !text.toLowerCase().includes('auto');
        });
    }

    async function openPanel() {
        const btn = findQualityBtn();
        if (!btn) return false;
        btn.click();
        await sleep(80);
        return true;
    }

    // Poll for items after opening panel (v6's proven approach)
    async function waitForItems(timeout) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (stopped || videoChanged()) return [];
            const items = findQualityItems();
            if (items.length >= 2) return items;
            await sleep(CONFIG.ITEM_POLL_MS);
        }
        return findQualityItems();
    }

    async function waitForPlayerReady() {
        const start = Date.now();
        while (Date.now() - start < CONFIG.READY_TIMEOUT) {
            if (stopped) return false;
            if (videoChanged()) return false;
            if (isPlayerReady()) {
                // Player claims ready, but give it time to stabilize
                await sleep(300);
                if (stopped || videoChanged()) return false;
                if (isPlayerReady()) return true;
            }
            await sleep(CONFIG.READY_POLL_MS);
        }
        return false;
    }

    async function doUpgrade() {
        // Step 1: Wait for player to be ready
        const ready = await waitForPlayerReady();
        if (!ready || stopped) {
            if (!stopped && !videoChanged()) log('等待播放器就绪超时');
            return;
        }
        log('播放器已就绪');

        // Step 2: Get target from API (for 4K detection and floor comparison)
        const target = getBestDefFromAPI();
        if (!target) {
            log('API无法获取画质信息');
            return;
        }

        // Step 3: Check floor
        if (target.val < qualityFloor) {
            log(`API目标${target.val}P < 地板${qualityFloor}，跳过`);
            return;
        }

        // Step 4: Find items (try existing panels first, then open panel + poll)
        let items = findQualityItems();
        if (items.length < 2) {
            log('打开画质面板...');
            await openPanel();
            items = await waitForItems(CONFIG.ITEM_TIMEOUT);
        }
        if (stopped || videoChanged()) return;
        if (items.length < 2) {
            log('未找到画质选项');
            return;
        }

        // Step 5: Filter and pick best
        const filtered = filterAutoItems(items);
        const pool = filtered.length >= 2 ? filtered : items;

        let bestItem = null;
        let bestVal = 0;
        for (const item of pool) {
            const val = parseQuality(item.textContent);
            if (val > bestVal) { bestVal = val; bestItem = item; }
        }

        if (!bestItem) {
            log('未能识别画质选项');
            return;
        }

        // Step 6: Floor check against actual DOM items
        if (bestVal < qualityFloor) {
            log(`跳过 ${bestItem.textContent.trim()} (${bestVal}P < 地板${qualityFloor})`);
            return;
        }

        // Step 7: If DOM best is lower than API target, close+reopen panel to refresh
        if (target.val > bestVal) {
            log(`面板最高${bestVal}P < API最高${target.val}P，刷新面板...`);
            document.body.click();          // close current panel
            await sleep(150);
            await openPanel();              // reopen to get full item list
            const retryItems = await waitForItems(CONFIG.ITEM_TIMEOUT);
            if (!stopped && !videoChanged() && retryItems.length >= 2) {
                const retryFiltered = filterAutoItems(retryItems);
                const retryPool = retryFiltered.length >= 2 ? retryFiltered : retryItems;
                let retryBest = null;
                let retryVal = 0;
                for (const item of retryPool) {
                    const val = parseQuality(item.textContent);
                    if (val > retryVal) { retryVal = val; retryBest = item; }
                }
                if (retryBest && retryVal > bestVal) {
                    log(`刷新后找到 ${retryBest.textContent.trim()} (${retryVal})`);
                    bestItem = retryBest;
                    bestVal = retryVal;
                }
            }
        }

        // Step 8: Click (use actual DOM item value, never API target)
        const is4k = bestVal >= 4000;
        bestItem.click();
        log(`切换 ${bestItem.textContent.trim()} (${bestVal})`);
        document.body.click();

        // Step 9: Save floor + 4K stop (based on actual clicked value)
        saveFloor(bestVal);
        if (is4k) {
            stopped = true;
            log('4K已选择，脚本永久停止');
            cleanup();
        }
    }

    function scheduleUpgrade() {
        if (stopped) return;
        if (upgrading) {
            pendingUpgrade = true;
            return;
        }
        cleanup();
        checkTimer = setTimeout(async () => {
            checkTimer = null;
            if (stopped) return;
            upgrading = true;
            pendingUpgrade = false;
            try {
                await doUpgrade();
            } finally {
                upgrading = false;
                if (pendingUpgrade && !stopped) {
                    pendingUpgrade = false;
                    scheduleUpgrade();
                }
            }
        }, 0);
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
            scheduleUpgrade();
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
                    scheduleUpgrade();
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
            scheduleUpgrade();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
