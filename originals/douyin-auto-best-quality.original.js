// ==UserScript==
// @name         抖音自动最高画质
// @namespace    http://tampermonkey.net/
// @version      13.14
// @match        https://www.douyin.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    let stopped = false;          // 已遇到4K，永久停止
    let currentBest = 0;         // 当前已切换的最高数值（避免重复切）
    let lastVideoId = null;       // 上一个视频的唯一标识
    let checkTimer = null;        // 延迟检查定时器
    let observer = null;          // MutationObserver 实例

    // 解析画质文本为数值（4K>4000, 2K>2000, 1080>1080...）
    function parseQuality(text) {
        const s = text.toLowerCase();
        if (s.includes('4k')) return 4000;
        if (s.includes('2k')) return 2000;
        const match = s.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    // 强制打开画质面板并获取所有有效选项（排除“智能/自动”）
    async function getQualityOptions() {
        const btn = document.querySelector('.xgplayer-playclarity-setting');
        if (!btn) return [];

        // 检查面板是否已打开
        let panel = document.querySelector('.xgplayer-playclarity-setting .virtual');
        if (!panel || panel.children.length === 0) {
            btn.click();
            await new Promise(r => setTimeout(r, 150));
            panel = document.querySelector('.xgplayer-playclarity-setting .virtual');
            if (!panel) return [];
        }

        // 模拟鼠标移入面板（触发懒加载）
        const enterEvent = new MouseEvent('mouseenter', { bubbles: true });
        panel.dispatchEvent(enterEvent);
        await new Promise(r => setTimeout(r, 80));

        // 获取所有选项，过滤掉“智能/自动”
        const items = Array.from(panel.querySelectorAll('.item')).filter(item => {
            const text = item.textContent;
            return !text.includes('智能') && !text.includes('自动') && !text.includes('auto');
        });
        return items;
    }

    // 执行升级：找到最高画质并点击
    async function upgrade() {
        if (stopped) return;

        const items = await getQualityOptions();
        if (items.length === 0) return;

        let bestItem = null;
        let bestVal = 0;
        for (const item of items) {
            const val = parseQuality(item.textContent);
            if (val > bestVal) {
                bestVal = val;
                bestItem = item;
            }
        }
        if (!bestItem || bestVal <= currentBest) return;

        // 点击最高画质
        bestItem.click();
        currentBest = bestVal;
        console.log(`[抖音画质] 切换至 ${bestItem.textContent} (数值=${bestVal})`);

        if (bestVal >= 4000) {
            stopped = true;
            console.log('✅ 已切换到4K，脚本永久停止');
            if (observer) observer.disconnect();
            if (checkTimer) clearTimeout(checkTimer);
        }
    }

    // 获取当前视频的唯一标识（使用 video 元素的 src 或 data-xgplayerid）
    function getCurrentVideoId() {
        const video = document.querySelector('video[data-xgplayerid]');
        if (!video) return null;
        // 优先用 data-xgplayerid，其次用 src 的 hash
        return video.getAttribute('data-xgplayerid') || video.src;
    }

    // 重置状态（新视频）
    function resetForNewVideo() {
        if (stopped) return;
        if (checkTimer) clearTimeout(checkTimer);
        currentBest = 0;
        // 延迟执行，等待播放器稳定
        checkTimer = setTimeout(() => {
            if (!stopped) upgrade();
            checkTimer = null;
        }, 200);
    }

    // 检测新视频（监听视频元素 src 变化 + 路由变化）
    function startObserver() {
        // 1. 监听 video 的 src 属性变化
        const videoObserver = new MutationObserver((mutations) => {
            for (const mut of mutations) {
                if (mut.type === 'attributes' && mut.attributeName === 'src') {
                    const video = mut.target;
                    if (video.tagName === 'VIDEO' && video.src && video.src.startsWith('blob:')) {
                        const newId = getCurrentVideoId();
                        if (newId && newId !== lastVideoId) {
                            lastVideoId = newId;
                            resetForNewVideo();
                        }
                    }
                }
            }
        });
        videoObserver.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['src'] });

        // 2. 监听路由变化（SPA 切换视频时不刷新页面）
        let lastUrl = location.href;
        const routeObserver = new MutationObserver(() => {
            const newUrl = location.href;
            if (newUrl !== lastUrl) {
                lastUrl = newUrl;
                // 路由变化后可能视频元素会重建，延迟重置
                setTimeout(() => {
                    const newId = getCurrentVideoId();
                    if (newId && newId !== lastVideoId) {
                        lastVideoId = newId;
                        resetForNewVideo();
                    }
                }, 300);
            }
        });
        routeObserver.observe(document, { subtree: true, childList: true });

        // 保存 observer 以便停止时清理
        observer = { videoObserver, routeObserver };
    }

    // 初始化
    window.addEventListener('load', () => {
        startObserver();
        // 处理页面已存在的第一个视频
        const firstId = getCurrentVideoId();
        if (firstId) {
            lastVideoId = firstId;
            resetForNewVideo();
        }
    });
})();