// ==UserScript==
// @name         抖音自动最高画质 (test_v1)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        SWITCH_DELAY: 200,
        INIT_DELAY: 500,
        RETRY_MAX: 3,
        RETRY_INTERVAL: 300,
        PANEL_OPEN_DELAY: 150,
        MOUSE_ENTER_DELAY: 80,
    };

    let stopped = false;
    let currentBest = 0;
    let lastVideoId = null;
    let checkTimer = null;
    let retryCount = 0;
    const observers = [];

    function log(msg) {
        console.log(`[画质] ${msg}`);
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    function disconnectAll() {
        while (observers.length) observers.pop().disconnect();
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

    function findPanel() {
        const panels = document.querySelectorAll(
            '[class*="virtual"], [class*="panel"], [class*="popup"]'
        );
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
        let items = Array.from(panel.querySelectorAll('[class*="item"]')).filter(el => {
            const t = el.textContent.trim();
            return t && parseQuality(t) > 0;
        });
        if (items.length > 0) return items;

        items = Array.from(panel.children).filter(el => {
            const t = el.textContent.trim();
            return t && parseQuality(t) > 0;
        });
        if (items.length > 0) return items;

        items = Array.from(panel.querySelectorAll('div, span, li')).filter(el => {
            const t = el.textContent.trim();
            return t && parseQuality(t) > 0 && el.children.length < 3;
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

    async function upgrade() {
        if (stopped) return;
        retryCount++;

        const items = await getQualityOptions();
        if (items.length === 0) {
            if (retryCount <= CONFIG.RETRY_MAX) {
                log(`重试 ${retryCount}/${CONFIG.RETRY_MAX}`);
                await sleep(CONFIG.RETRY_INTERVAL);
                if (!stopped) await upgrade();
            }
            return;
        }

        let bestItem = null, bestVal = 0;
        for (const item of items) {
            const val = parseQuality(item.textContent);
            if (val > bestVal) {
                bestVal = val;
                bestItem = item;
            }
        }

        if (!bestItem || bestVal <= currentBest) return;

        bestItem.click();
        currentBest = bestVal;
        log(`切换至 ${bestItem.textContent.trim()} (${bestVal})`);
        document.body.click();

        if (bestVal >= 4000) {
            stopped = true;
            log('已切换到4K，脚本永久停止');
            if (checkTimer) { clearTimeout(checkTimer); checkTimer = null; }
            disconnectAll();
        }
    }

    function scheduleUpgrade(delay) {
        if (stopped) return;
        if (checkTimer) clearTimeout(checkTimer);
        currentBest = 0;
        retryCount = 0;
        checkTimer = setTimeout(() => {
            checkTimer = null;
            if (!stopped) upgrade();
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

    function registerObserver(target, options, callback) {
        const obs = new MutationObserver(callback);
        obs.observe(target, options);
        observers.push(obs);
    }

    function startObservers() {
        registerObserver(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['src', 'data-xgplayerid']
        }, mutations => {
            for (const m of mutations) {
                if (m.target instanceof HTMLVideoElement) {
                    handleNewVideo();
                    return;
                }
            }
        });

        registerObserver(document.body, {
            childList: true,
            subtree: true
        }, () => {
            const video = document.querySelector('video');
            if (video) {
                const id = video.getAttribute('data-xgplayerid') || video.currentSrc || video.src;
                if (id && id !== lastVideoId) {
                    lastVideoId = id;
                    scheduleUpgrade(CONFIG.SWITCH_DELAY);
                }
            }
        });
    }

    function patchHistory() {
        const wrap = (method) => {
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
        startObservers();
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
