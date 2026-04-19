// ==UserScript==
// @name         arXiv Keyword Pin - 关键词置顶高亮
// @namespace    https://github.com/ZhongC01/arxiv-keyword-pin
// @version      1.1
// @description  在 arXiv 列表页中，将匹配关键词（标题/作者/摘要）的文章置顶并高亮，支持正则，自动展开摘要
// @author       WYZ
// @license      MIT
// @match        https://arxiv.org/list/*
// @match        https://arxiv.org/list?*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://github.com/ZhongC01/arxiv-keyword-pin/raw/main/arxiv-keyword-pin.user.js
// @downloadURL  https://github.com/ZhongC01/arxiv-keyword-pin/raw/main/arxiv-keyword-pin.user.js
// @homepageURL  https://github.com/ZhongC01/arxiv-keyword-pin
// @supportURL   https://github.com/ZhongC01/arxiv-keyword-pin/issues
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 样式注入 ====================
    GM_addStyle(`
        .arxiv-kw-article-card {
            display: flex;
            flex-direction: column;
            background: #fff;
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
            color: inherit;
        }
        .arxiv-kw-article-card:hover {
            background: rgba(0,0,0,0.02);
            border-color: rgba(0,0,0,0.12);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .arxiv-kw-article-card.pinned {
            border-left: 4px solid #e74c3c;
            background: linear-gradient(90deg, #fef9e7 0%, transparent 30%);
            padding-left: 8px;
        }
        .arxiv-kw-article-card.pinned:hover {
            background: linear-gradient(90deg, #fef9e7 0%, rgba(0,0,0,0.02) 30%);
        }
        .arxiv-kw-card-body {
            display: block;
            min-width: 0;
            line-height: 1.58;
        }
        .arxiv-kw-card-body .meta {
            margin: 0;
        }
        .arxiv-kw-card-body .list-title,
        .arxiv-kw-card-body .list-authors,
        .arxiv-kw-card-body .list-comments,
        .arxiv-kw-card-body .list-subjects,
        .arxiv-kw-card-body .list-journal-ref,
        .arxiv-kw-card-body .list-report-no,
        .arxiv-kw-card-body .list-doi {
            margin: 0 0 6px 0;
        }
        .arxiv-kw-card-body .mathjax,
        .arxiv-kw-card-body .abstract-text,
        .arxiv-kw-card-body .abstract,
        .arxiv-kw-card-body .abstract-long,
        .arxiv-kw-card-body .abstract-full {
            margin: 0;
            display: block !important;
            max-height: none !important;
            overflow: visible !important;
            line-height: 1.62;
        }
        .arxiv-kw-card-body mjx-container[display="true"],
        .arxiv-kw-card-body .MathJax_Display {
            margin: 0.6em 0 !important;
            overflow-x: auto;
            overflow-y: hidden;
        }
        .arxiv-kw-card-links {
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid rgba(0,0,0,0.08);
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
            font-size: 12px;
            line-height: 1.4;
        }
        .arxiv-kw-card-links a {
            color: #0f4aa2;
            text-decoration: none;
            border-bottom: 1px dashed rgba(15,74,162,0.35);
            white-space: nowrap;
        }
        .arxiv-kw-card-links a:hover {
            border-bottom-color: currentColor;
        }
        .arxiv-kw-highlight {
            background: linear-gradient(135deg, #ffeaa7 0%, #fdd835 100%);
            border-radius: 3px;
            padding: 1px 4px;
            font-weight: 500;
        }
        .arxiv-kw-inspire-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 14px;
            height: 14px;
            margin-left: 4px;
            margin-right: 4px;
            border-radius: 50%;
            font-size: 9px;
            line-height: 1;
            font-weight: 700;
            text-decoration: none;
            color: #fff !important;
            background: #0f4aa2;
            border: 1px solid rgba(15,74,162,0.35);
            vertical-align: middle;
            opacity: 0.92;
            transition: transform 0.12s ease, opacity 0.12s ease;
        }
        .arxiv-kw-inspire-btn:hover {
            opacity: 1;
            transform: translateY(-1px);
        }
        .arxiv-kw-dark .arxiv-kw-inspire-btn {
            background: #9ec5ff;
            color: #101113 !important;
            border-color: rgba(158,197,255,0.45);
        }
        .arxiv-kw-pinned {
            border-left: 4px solid #e74c3c !important;
            background: linear-gradient(90deg, #fef9e7 0%, transparent 30%) !important;
            padding-left: 8px !important;
            transition: background 0.3s ease;
        }
        .arxiv-kw-filter-hidden {
            display: none !important;
        }
        .arxiv-kw-global-list {
            margin: 0;
            padding: 0;
        }
        .arxiv-kw-float-btn {
            position: fixed;
            z-index: 9998;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(145deg, #4a4a4a 0%, #2d2d2d 100%);
            color: #fff;
            border: none;
            cursor: move;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.1);
            transition: transform 0.15s ease, box-shadow 0.15s ease;
            user-select: none;
        }
        .arxiv-kw-float-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 24px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.15);
        }
        .arxiv-kw-float-btn.active {
            background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
        }
        .arxiv-kw-float-panel {
            position: fixed;
            z-index: 9999;
            width: 340px;
            background: linear-gradient(145deg, #3d3d3d 0%, #2a2a2a 100%);
            border-radius: 16px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
            pointer-events: none;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .arxiv-kw-float-panel.open {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        .arxiv-kw-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: linear-gradient(90deg, rgba(102,126,234,0.3) 0%, rgba(118,75,162,0.3) 100%);
            border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .arxiv-kw-panel-title {
            font-size: 13px;
            font-weight: 600;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .arxiv-kw-panel-close {
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            border: none;
            color: #aaa;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.2s ease;
        }
        .arxiv-kw-panel-close:hover {
            background: rgba(255,255,255,0.2);
            color: #fff;
        }
        .arxiv-kw-panel-body {
            padding: 16px;
        }
        .arxiv-kw-panel-hint {
            font-size: 11px;
            color: #888;
            margin-bottom: 10px;
            line-height: 1.5;
        }
        .arxiv-kw-panel-textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px 12px;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 10px;
            font-size: 12px;
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            background: rgba(0,0,0,0.3);
            color: #e0e0e0;
            resize: vertical;
            box-sizing: border-box;
            transition: all 0.25s ease;
        }
        .arxiv-kw-panel-textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
        }
        .arxiv-kw-panel-textarea::placeholder {
            color: #666;
        }
        .arxiv-kw-panel-options {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            flex-wrap: wrap;
        }
        .arxiv-kw-panel-options label {
            font-size: 11px;
            color: #bbb;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            background: rgba(255,255,255,0.06);
            padding: 5px 10px;
            border-radius: 20px;
            transition: all 0.2s ease;
        }
        .arxiv-kw-panel-options label:hover {
            background: rgba(255,255,255,0.12);
        }
        .arxiv-kw-panel-options input[type="checkbox"] {
            width: 14px;
            height: 14px;
            cursor: pointer;
            accent-color: #667eea;
        }
        .arxiv-kw-panel-footer {
            display: flex;
            gap: 10px;
            margin-top: 14px;
        }
        .arxiv-kw-panel-footer button {
            flex: 1;
            padding: 9px 14px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.25s ease;
        }
        .arxiv-kw-btn-save {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .arxiv-kw-btn-save:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(102, 126, 234, 0.5);
        }
        .arxiv-kw-btn-reset {
            background: rgba(255,255,255,0.08);
            color: #aaa;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .arxiv-kw-btn-reset:hover {
            background: rgba(255,255,255,0.14);
            color: #fff;
        }
        .arxiv-kw-count-badge {
            position: fixed;
            z-index: 9997;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(17, 153, 142, 0.4);
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.3s ease;
            pointer-events: none;
        }
        .arxiv-kw-count-badge.visible {
            opacity: 1;
            transform: scale(1);
        }
        .arxiv-kw-section-label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 12px;
            margin-left: 6px;
            box-shadow: 0 2px 8px rgba(235, 51, 73, 0.3);
        }
        .arxiv-kw-loading {
            font-size: 11px;
            color: #888;
            font-weight: 500;
            margin-top: 6px;
            text-align: center;
        }
        /* 深色模式 */
        .arxiv-kw-dark {
            background: #1a1a1a !important;
        }
        .arxiv-kw-dark #header,
        .arxiv-kw-dark #content,
        .arxiv-kw-dark #content-inner,
        .arxiv-kw-dark #dlpage,
        .arxiv-kw-dark #dlpage h1,
        .arxiv-kw-dark #dlpage h2,
        .arxiv-kw-dark #dlpage h3,
        .arxiv-kw-dark #dlpage h4,
        .arxiv-kw-dark #dlpage p,
        .arxiv-kw-dark #dlpage li,
        .arxiv-kw-dark #dlpage strong,
        .arxiv-kw-dark #dlpage b,
        .arxiv-kw-dark #dlpage small,
        .arxiv-kw-dark #dlpage dt,
        .arxiv-kw-dark #dlpage dd {
            color: #f2f2f2 !important;
        }
        .arxiv-kw-dark #dlpage a,
        .arxiv-kw-dark #content a {
            color: #9ec5ff !important;
        }
        .arxiv-kw-dark #dlpage hr,
        .arxiv-kw-dark #dlpage .divider {
            border-color: rgba(255,255,255,0.18) !important;
        }
        .arxiv-kw-dark .arxiv-kw-article-card {
            background: #252525;
            border-color: rgba(255,255,255,0.1);
        }
        .arxiv-kw-dark .arxiv-kw-article-card:hover {
            background: #2a2a2a;
            border-color: rgba(255,255,255,0.15);
        }
        .arxiv-kw-dark .arxiv-kw-article-card.pinned {
            background: linear-gradient(90deg, rgba(231,76,60,0.22) 0%, #252525 30%);
            border-left-color: #e74c3c;
        }
        .arxiv-kw-dark .arxiv-kw-card-links {
            border-top-color: rgba(255,255,255,0.12);
        }
        .arxiv-kw-dark .arxiv-kw-card-links a {
            color: #fff !important;
            border-bottom-color: rgba(255,255,255,0.45);
        }
        .arxiv-kw-dark .arxiv-kw-article-card mjx-container,
        .arxiv-kw-dark .arxiv-kw-article-card .MathJax {
            color: #fff !important;
        }
        .arxiv-kw-dark .arxiv-kw-article-card,
        .arxiv-kw-dark .arxiv-kw-article-card * {
            color: #fff !important;
        }
        .arxiv-kw-dark .arxiv-kw-highlight {
            color: #111 !important;
        }
        .arxiv-kw-dark .arxiv-kw-card-container {
            background: #1a1a1a;
        }
        .arxiv-kw-dark .arxiv-kw-separator {
            border-top-color: rgba(255,255,255,0.1) !important;
        }
        .arxiv-kw-dark .arxiv-kw-separator span {
            background: #252525 !important;
            color: #fff !important;
        }
        .arxiv-kw-dark .arxiv-kw-matched-header {
            background: linear-gradient(135deg, rgba(244,114,114,0.15) 0%, rgba(102,126,234,0.15)) !important;
            border-color: rgba(244,114,114,0.25) !important;
        }
        .arxiv-kw-dark .arxiv-kw-matched-header span {
            color: #fff !important;
        }
    `);

    // ==================== 配置管理 ====================
    const STORAGE_KEY = 'arxiv_kw_keywords';
    const CASE_KEY = 'arxiv_kw_case_sensitive';
    const REGEX_KEY = 'arxiv_kw_regex_mode';
    const COLS_KEY = 'arxiv_kw_cols';
    const DARK_KEY = 'arxiv_kw_dark';
    const CARD_KEY = 'arxiv_kw_card_mode';
    const MATHJAX_SCRIPT_ID = 'arxiv-kw-mathjax-script';
    const MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
    let mathJaxReadyPromise = null;

    function loadKeywords() {
        const raw = GM_getValue(STORAGE_KEY, '');
        return raw.split('\n').map(k => k.trim()).filter(k => k.length > 0);
    }

    function saveKeywords(keywords) {
        GM_setValue(STORAGE_KEY, keywords.join('\n'));
    }

    function isCaseSensitive() {
        return GM_getValue(CASE_KEY, false);
    }

    function setCaseSensitive(val) {
        GM_setValue(CASE_KEY, val);
    }

    function isRegexMode() {
        return GM_getValue(REGEX_KEY, false);
    }

    function setRegexMode(val) {
        GM_setValue(REGEX_KEY, val);
    }

    function getColumns() {
        return GM_getValue(COLS_KEY, 1);
    }

    function setColumns(val) {
        GM_setValue(COLS_KEY, val);
    }

    function isDarkMode() {
        return GM_getValue(DARK_KEY, false);
    }

    function setDarkMode(val) {
        GM_setValue(DARK_KEY, val);
    }

    function isCardMode() {
        return GM_getValue(CARD_KEY, true);
    }

    function setCardMode(val) {
        GM_setValue(CARD_KEY, val);
    }

    function syncDarkClass() {
        if (isDarkMode() && isCardMode()) {
            document.body.classList.add('arxiv-kw-dark');
        } else {
            document.body.classList.remove('arxiv-kw-dark');
        }
    }

    function ensureMathJaxReady() {
        const existing = window.MathJax;

        // MathJax v3 已可用
        if (existing && typeof existing.typesetPromise === 'function') {
            return Promise.resolve(existing);
        }

        // MathJax v2 已可用
        if (existing && existing.Hub && typeof existing.Hub.Queue === 'function') {
            return Promise.resolve(existing);
        }

        if (mathJaxReadyPromise) {
            return mathJaxReadyPromise;
        }

        mathJaxReadyPromise = new Promise((resolve) => {
            // 配置 v3（如果页面没有自己的配置）
            if (!window.MathJax || !window.MathJax.Hub) {
                window.MathJax = window.MathJax || {};
                if (!window.MathJax.tex) {
                    window.MathJax.tex = {
                        inlineMath: [['\\(', '\\)'], ['$', '$']],
                        displayMath: [['\\[', '\\]'], ['$$', '$$']],
                        processEscapes: true
                    };
                }
                if (!window.MathJax.options) {
                    window.MathJax.options = {
                        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                    };
                }
                window.MathJax.startup = Object.assign({}, window.MathJax.startup, { typeset: false });
            }

            let script = document.getElementById(MATHJAX_SCRIPT_ID);
            if (!script) {
                script = document.createElement('script');
                script.id = MATHJAX_SCRIPT_ID;
                script.src = MATHJAX_SRC;
                script.async = true;
                script.onload = () => {
                    const mj = window.MathJax;
                    if (mj && mj.startup && mj.startup.promise && typeof mj.startup.promise.then === 'function') {
                        mj.startup.promise.then(() => resolve(mj)).catch(() => resolve(mj));
                    } else {
                        resolve(mj || null);
                    }
                };
                script.onerror = () => {
                    console.warn('[arXiv-KW] MathJax 加载失败，公式将保持原始文本显示');
                    resolve(null);
                };
                document.head.appendChild(script);
            } else {
                const mj = window.MathJax;
                if (mj && mj.startup && mj.startup.promise && typeof mj.startup.promise.then === 'function') {
                    mj.startup.promise.then(() => resolve(mj)).catch(() => resolve(mj));
                } else {
                    resolve(mj || null);
                }
            }
        });

        return mathJaxReadyPromise;
    }

    async function typesetMathInElement(root) {
        if (!root) return;
        if (hasRenderedMath(root)) return;
        if (!hasRawTeX(root)) return;

        const mj = await ensureMathJaxReady();
        if (!mj) return;

        try {
            if (typeof mj.typesetClear === 'function') {
                mj.typesetClear([root]);
            }
            if (typeof mj.typesetPromise === 'function') {
                await mj.typesetPromise([root]);
                return;
            }
            if (mj.Hub && typeof mj.Hub.Queue === 'function') {
                await new Promise((resolve) => {
                    mj.Hub.Queue(['Typeset', mj.Hub, root], resolve);
                });
            }
        } catch (err) {
            console.warn('[arXiv-KW] MathJax 排版失败:', err);
        }
    }

    function hasRenderedMath(root) {
        if (!root) return false;
        return !!root.querySelector('mjx-container, .MathJax, .MathJax_Display, .MathJax_SVG, [id^="MathJax-Element-"]');
    }

    function hasRawTeX(root) {
        if (!root) return false;
        const text = root.textContent || '';
        return /\\\(|\\\)|\\\[|\\\]|\\begin\{|\\end\{|\$\$|\\frac|\\sum|\\int|\\alpha|\\beta|\\gamma|\\delta/.test(text);
    }

    // ==================== 匹配逻辑 ====================
    function buildMatchers(keywords, caseSensitive, regexMode) {
        return keywords.map(kw => {
            if (regexMode) {
                try {
                    return { regex: new RegExp(kw, caseSensitive ? 'g' : 'gi'), source: kw };
                } catch (e) {
                    console.warn(`[arXiv-KW] 无效正则: `, e);
                    return null;
                }
            } else {
                const flags = caseSensitive ? 'g' : 'gi';
                const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return { regex: new RegExp(escaped, flags), source: kw };
            }
        }).filter(Boolean);
    }

    function matchText(text, matchers) {
        const hits = [];
        for (const m of matchers) {
            m.regex.lastIndex = 0;
            if (m.regex.test(text)) {
                hits.push(m.source);
            }
        }
        return hits;
    }

    // 高亮文本节点中的匹配词
    function highlightTextNode(node, matchers) {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const text = node.textContent;

        // 收集所有匹配位置
        const matches = [];
        for (const m of matchers) {
            m.regex.lastIndex = 0;
            let execResult;
            while ((execResult = m.regex.exec(text)) !== null) {
                matches.push({ start: execResult.index, end: execResult.index + execResult[0].length });
                if (execResult[0].length === 0) { m.regex.lastIndex++; }
            }
        }
        if (matches.length === 0) return;

        // 按位置排序并合并重叠区间
        matches.sort((a, b) => a.start - b.start);
        const merged = [matches[0]];
        for (let i = 1; i < matches.length; i++) {
            const last = merged[merged.length - 1];
            if (matches[i].start <= last.end) {
                last.end = Math.max(last.end, matches[i].end);
            } else {
                merged.push(matches[i]);
            }
        }

        // 构建 DocumentFragment 替换原节点
        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        for (const { start, end } of merged) {
            if (start > lastIdx) {
                frag.appendChild(document.createTextNode(text.slice(lastIdx, start)));
            }
            const span = document.createElement('span');
            span.className = 'arxiv-kw-highlight';
            span.textContent = text.slice(start, end);
            frag.appendChild(span);
            lastIdx = end;
        }
        if (lastIdx < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        node.parentNode.replaceChild(frag, node);
    }

    // 递归高亮元素内文本
    function highlightElement(el, matchers) {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) {
            textNodes.push(walker.currentNode);
        }
        for (const tn of textNodes) {
            highlightTextNode(tn, matchers);
        }
    }

    // ==================== 自动展开摘要 ====================
    function expandAllAbstracts() {
        return new Promise((resolve) => {
            // arXiv 列表页摘要展开按钮的可能选择器
            const toggleSelectors = [
                'a.toggle',           // 常见的摘要切换按钮
                '.abstract-toggle',
                '.is-hidden',         // 折叠的摘要内容
                '.abstract-short + .abstract-long',
            ];

            // 方式1：点击所有摘要展开按钮
            const toggleButtons = document.querySelectorAll('a[onclick*="toggle"], .toggle, a.toggle');
            let clicked = 0;
            toggleButtons.forEach(btn => {
                const parentDD = btn.closest('dd');
                if (parentDD) {
                    const abstractHidden = parentDD.querySelector('.mathjax');
                    if (!abstractHidden || abstractHidden.offsetParent === null) {
                        btn.click();
                        clicked++;
                    }
                }
            });

            // 方式2：直接展开隐藏的摘要块
            const hiddenAbstracts = document.querySelectorAll('.abstract-short');
            hiddenAbstracts.forEach(el => {
                // 有些页面摘要被截断，点击 "more" 链接
                const moreLink = el.querySelector('a');
                if (moreLink) moreLink.click();
            });

            // 方式3：处理 arXiv 新版页面的展开逻辑
            // 新版页面中，摘要可能在 <dd> 内的 .mathjax 中，需要点击展开
            const ddElements = document.querySelectorAll('dl#articles dd, dl dd');
            ddElements.forEach(dd => {
                const abstractEl = dd.querySelector('.mathjax');
                if (abstractEl && abstractEl.style.display === 'none') {
                    abstractEl.style.display = '';
                }
                // 也检查 .abstract-collapse 等
                const collapsible = dd.querySelector('.abstract-collapse, .collapse');
                if (collapsible && collapsible.style.display === 'none') {
                    collapsible.style.display = '';
                }
            });

            // 等待一小段时间让 DOM 更新
            setTimeout(resolve, 500);
        });
    }

    // 通过 AJAX 加载摘要（arXiv 有些列表页摘要需要异步获取）
    async function fetchMissingAbstracts(pairs) {
        const MAX_CONCURRENT = 5;
        let queue = [];
        let active = 0;

        return new Promise((resolve) => {
            function next() {
                if (queue.length === 0 && active === 0) {
                    resolve();
                    return;
                }
                if (queue.length === 0 || active >= MAX_CONCURRENT) return;

                active++;
                const { dd, url } = queue.shift();

                fetch(url)
                    .then(r => r.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');

                        // 从文章详情页提取摘要
                        const abstractEl = doc.querySelector('.abstract.mathjax, #abstract, .desc.abstract');
                        if (abstractEl) {
                            const abstractText = abstractEl.textContent
                                .replace(/^Abstract\s*:?\s*/i, '')
                                .trim();

                            // 在列表页的 dd 中创建或更新摘要元素
                            let existingAbstract = dd.querySelector('.mathjax, .abstract-text');
                            if (!existingAbstract) {
                                existingAbstract = document.createElement('div');
                                existingAbstract.className = 'mathjax';
                                dd.appendChild(existingAbstract);
                            }
                            existingAbstract.textContent = abstractText;
                        }
                    })
                    .catch(err => {
                        console.warn('[arXiv-KW] 获取摘要失败:', url, err);
                    })
                    .finally(() => {
                        active--;
                        next();
                    });
            }

            for (const pair of pairs) {
                const linkEl = pair.dt.querySelector('a[href*="/abs/"]');
                if (!linkEl) continue;

                const abstractEl = pair.dd.querySelector('.mathjax, .abstract-text');
                const abstractText = abstractEl ? abstractEl.textContent.trim() : '';

                // 如果摘要为空或过短（可能没有真正加载），则异步获取
                if (abstractText.length < 20) {
                    const absUrl = linkEl.href;
                    if (absUrl) {
                        queue.push({ dd: pair.dd, url: absUrl });
                    }
                }
            }

            if (queue.length === 0) {
                resolve();
            } else {
                // 启动并发
                for (let i = 0; i < Math.min(MAX_CONCURRENT, queue.length); i++) {
                    next();
                }
            }
        });
    }

    // ==================== 核心排序逻辑 ====================
    async function processList() {
        const cardMode = isCardMode();
        if (!cardMode && !loadKeywords().length) {
            restoreOriginal();
            syncDarkClass();
            return;
        }

        const keywords = loadKeywords();
        const caseSensitive = isCaseSensitive();
        const regexMode = isRegexMode();
        const matchers = buildMatchers(keywords, caseSensitive, regexMode);

        // 显示处理状态
        updateStatus('正在展开摘要...');

        // 先尝试展开页面上的摘要
        await expandAllAbstracts();

        // 收集所有分段 dl
        const dls = findArticleLists();
        if (dls.length === 0) {
            console.warn('[arXiv-KW] 未找到文章列表');
            updateStatus('');
            return;
        }

        const sectionEntries = [];
        const allPairs = [];
        for (let i = 0; i < dls.length; i++) {
            const dl = dls[i];
            const pairs = collectPairs(dl);
            sectionEntries.push({ dl, pairs, sectionIndex: i });
            allPairs.push(...pairs);
        }

        if (allPairs.length === 0) {
            updateStatus('');
            return;
        }

        // 对缺失摘要的文章异步获取
        updateStatus('正在加载摘要...');
        await fetchMissingAbstracts(allPairs);

        updateStatus(matchers.length > 0 ? '正在匹配关键词...' : '正在整理卡片...');

        let totalMatched = 0;
        const matchedAll = [];
        const unmatchedAll = [];

        for (const section of sectionEntries) {
            const matched = [];
            const unmatched = [];

            for (const pair of section.pairs) {
                const titleEl = pair.dd.querySelector('.list-title');
                const authorsEl = pair.dd.querySelector('.list-authors');
                const abstractEl = pair.dd.querySelector('.mathjax, .abstract-text');

                const title = titleEl ? titleEl.textContent.replace(/^Title\s*:?\s*/i, '').trim() : '';
                const authors = authorsEl ? authorsEl.textContent.replace(/^Authors\s*:?\s*/i, '').trim() : '';
                const abstract = abstractEl ? abstractEl.textContent.replace(/^Abstract\s*:?\s*/i, '').trim() : '';

                const fullText = `${title} ${authors} ${abstract}`;
                const hits = matchers.length > 0 ? matchText(fullText, matchers) : [];

                if (hits.length > 0) {
                    matched.push({ ...pair, hits });
                } else {
                    unmatched.push(pair);
                }
            }

            totalMatched += matched.length;
            matchedAll.push(...matched);
            unmatchedAll.push(...unmatched);
        }

        if (cardMode) {
            // 全局统一重排：所有命中在最前，然后是全部未命中
            const mathRootsToTypeset = rearrangeDOM(sectionEntries, matchedAll, unmatchedAll, matchers);

            // 只对未渲染过的 TeX 区域做排版，避免重复排版导致叠字
            await Promise.all(mathRootsToTypeset.map(async (el) => {
                await typesetMathInElement(el);
                delete el.dataset.arxivKwNeedsTypeset;
            }));
        } else {
            // 非卡片模式也做全局统一重排
            rearrangeListDOM(sectionEntries, matchedAll, unmatchedAll, matchers);
        }

        updateCount(totalMatched, allPairs.length);
    }

    function findArticleLists() {
        const allDl = Array.from(document.querySelectorAll('dl'));
        return allDl.filter(d => !d.classList.contains('arxiv-kw-global-list') && d.querySelector('dt a[href*="/abs/"]'));
    }

    function collectPairs(dl) {
        const pairs = [];
        const children = dl.children;
        let currentDt = null;
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (el.tagName === 'DT') {
                currentDt = el;
            } else if (el.tagName === 'DD' && currentDt) {
                if (currentDt.querySelector('a[href*="/abs/"]')) {
                    pairs.push({ dt: currentDt, dd: el });
                }
                currentDt = null;
            }
        }
        return pairs;
    }

    function createArticleCard(pair, isPinned, matchers) {
        const card = document.createElement('article');
        card.className = 'arxiv-kw-article-card' + (isPinned ? ' pinned' : '');

        const body = document.createElement('div');
        body.className = 'arxiv-kw-card-body';
        body.innerHTML = pair.dd.innerHTML;
        expandAbstractInNode(body);
        if (!hasRenderedMath(body) && hasRawTeX(body)) {
            body.dataset.arxivKwNeedsTypeset = '1';
        }

        if (isPinned) {
            // 仅在非公式字段中高亮，避免破坏 TeX 语法
            const highlightTargets = body.querySelectorAll('.list-title, .list-authors, .list-comments, .list-subjects');
            highlightTargets.forEach(target => highlightElement(target, matchers));
        }
        addInspireAuthorButtons(body);

        card.appendChild(body);

        const linkRow = createCardLinkRow(pair.dt);
        if (linkRow.childElementCount > 0) {
            card.appendChild(linkRow);
        }

        return card;
    }

    function rearrangeDOM(sectionEntries, matched, unmatched, matchers) {
        document.querySelectorAll('.arxiv-kw-card-container').forEach(container => container.remove());
        document.querySelectorAll('.arxiv-kw-global-list').forEach(dl => dl.remove());

        for (const section of sectionEntries) {
            section.dl.style.display = 'none';
            if (!section.dl.dataset.arxivKwOriginal) {
                section.dl.dataset.arxivKwOriginal = '1';
            }
        }

        const anchorDl = sectionEntries[0]?.dl;
        if (!anchorDl) return [];

        const container = document.createElement('div');
        const cols = getColumns();
        const isDark = isDarkMode();
        container.className = 'arxiv-kw-card-container' + (isDark ? ' arxiv-kw-dark' : '');
        container.style.cssText = `padding: 20px; max-width: ${cols > 1 ? '100%' : '800px'}; margin: 0 auto;`;
        container.style.display = 'grid';
        container.style.gridTemplateColumns = cols > 1 ? `repeat(${cols}, 1fr)` : '1fr';
        container.style.gap = '16px';
        anchorDl.parentNode.insertBefore(container, anchorDl);

        for (const pair of matched) {
            container.appendChild(createArticleCard(pair, true, matchers));
        }
        for (const pair of unmatched) {
            container.appendChild(createArticleCard(pair, false, matchers));
        }

        return Array.from(container.querySelectorAll('.arxiv-kw-card-body[data-arxiv-kw-needs-typeset="1"]'));
    }

    function clearHighlightsInNode(root) {
        if (!root) return;
        root.querySelectorAll('.arxiv-kw-highlight').forEach(el => {
            const text = document.createTextNode(el.textContent);
            el.parentNode.replaceChild(text, el);
        });
    }

    function buildInspireAuthorUrl(authorName) {
        return `https://inspirehep.net/authors?q=${encodeURIComponent(authorName)}`;
    }

    function addInspireAuthorButtons(root) {
        if (!root) return;
        const authorLinks = root.querySelectorAll('.list-authors a[href]');
        authorLinks.forEach(link => {
            if (link.nextElementSibling && link.nextElementSibling.classList.contains('arxiv-kw-inspire-btn')) {
                return;
            }
            const rawName = (link.textContent || '').replace(/\s+/g, ' ').trim();
            const name = rawName.replace(/,\s*$/, '');
            if (!name) return;

            const btn = document.createElement('a');
            btn.className = 'arxiv-kw-inspire-btn';
            btn.href = buildInspireAuthorUrl(name);
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.title = `在 INSPIRE 搜索作者: ${name}`;
            btn.textContent = 'I';

            link.insertAdjacentElement('afterend', btn);
        });
    }

    function rearrangeListDOM(sectionEntries, matched, unmatched, matchers) {
        document.querySelectorAll('.arxiv-kw-card-container').forEach(container => container.remove());
        document.querySelectorAll('.arxiv-kw-global-list').forEach(dl => dl.remove());

        for (const section of sectionEntries) {
            section.dl.style.display = 'none';
            if (!section.dl.dataset.arxivKwOriginal) {
                section.dl.dataset.arxivKwOriginal = '1';
            }
        }

        const anchorDl = sectionEntries[0]?.dl;
        if (!anchorDl) return;

        const globalDl = document.createElement('dl');
        globalDl.className = `arxiv-kw-global-list ${anchorDl.className || ''}`.trim();
        anchorDl.parentNode.insertBefore(globalDl, anchorDl);

        function appendPair(pair, isPinned) {
            const dt = pair.dt.cloneNode(true);
            const dd = pair.dd.cloneNode(true);

            dt.classList.remove('arxiv-kw-filter-hidden');
            dd.classList.remove('arxiv-kw-filter-hidden');

            if (isPinned) {
                dt.classList.add('arxiv-kw-pinned');
                dd.classList.add('arxiv-kw-pinned');
                const highlightTargets = dd.querySelectorAll('.list-title, .list-authors, .list-comments, .list-subjects');
                highlightTargets.forEach(target => highlightElement(target, matchers));
            } else {
                dt.classList.remove('arxiv-kw-pinned');
                dd.classList.remove('arxiv-kw-pinned');
            }
            addInspireAuthorButtons(dd);

            globalDl.appendChild(dt);
            globalDl.appendChild(dd);
        }

        for (const pair of matched) appendPair(pair, true);
        for (const pair of unmatched) appendPair(pair, false);
    }

    function normalizeCardLinkHref(rawHref) {
        if (!rawHref) return '';
        if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) return rawHref;
        if (rawHref.startsWith('//')) return window.location.protocol + rawHref;
        if (rawHref.startsWith('/')) return window.location.origin + rawHref;
        return new URL(rawHref, window.location.href).href;
    }

    function createCardLinkRow(dtNode) {
        const row = document.createElement('div');
        row.className = 'arxiv-kw-card-links';

        const identifier = dtNode.querySelector('.list-identifier');
        const linkNodes = identifier
            ? Array.from(identifier.querySelectorAll('a[href]'))
            : Array.from(dtNode.querySelectorAll('a[href]'));

        const seen = new Set();
        for (const linkNode of linkNodes) {
            const href = normalizeCardLinkHref(linkNode.getAttribute('href'));
            const label = (linkNode.textContent || '').replace(/\s+/g, ' ').trim()
                || (linkNode.getAttribute('title') || '').trim()
                || 'link';

            if (!href) continue;
            const dedupeKey = `${label}|${href}`;
            if (seen.has(dedupeKey)) continue;
            seen.add(dedupeKey);

            const link = document.createElement('a');
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = label;
            row.appendChild(link);
        }

        return row;
    }

    function expandAbstractInNode(root) {
        if (!root) return;

        root.querySelectorAll('.mathjax, .abstract-text, .abstract, .abstract-long, .abstract-full, .abstract-collapse, .collapse').forEach(el => {
            el.hidden = false;
            if (el.style.display === 'none') {
                el.style.display = '';
            }
            el.classList.remove('hidden', 'is-hidden');
        });

        root.querySelectorAll('.abstract-short').forEach(shortEl => {
            const hasLong = shortEl.parentElement?.querySelector('.mathjax, .abstract-text, .abstract, .abstract-long, .abstract-full');
            if (hasLong) {
                shortEl.style.display = 'none';
            }
        });

        root.querySelectorAll('a[onclick*="toggle"], a.toggle, .abstract-toggle').forEach(toggleEl => {
            toggleEl.remove();
        });
    }

    function restoreOriginal() {
        // 移除所有卡片容器，恢复原始 dl
        document.querySelectorAll('.arxiv-kw-card-container').forEach(container => container.remove());
        document.querySelectorAll('.arxiv-kw-global-list').forEach(dl => dl.remove());
        findArticleLists().forEach(dl => {
            dl.style.display = '';
            delete dl.dataset.arxivKwOriginal;
            delete dl.dataset.arxivKwSectionKey;
        });

        document.querySelectorAll('.arxiv-kw-pinned').forEach(el => el.classList.remove('arxiv-kw-pinned'));
        clearHighlightsInNode(document.body);
        document.querySelectorAll('.arxiv-kw-filter-hidden').forEach(el => el.classList.remove('arxiv-kw-filter-hidden'));
        document.querySelectorAll('.arxiv-kw-injected-row').forEach(el => el.remove());
        document.querySelectorAll('.arxiv-kw-section-label').forEach(el => {
            el.closest('dt')?.remove();
        });
        document.querySelector('.arxiv-kw-count-badge')?.classList.remove('visible');
        const statusEl = document.querySelector('.arxiv-kw-loading');
        if (statusEl) statusEl.textContent = '';
    }

    function updateCount(matched, total) {
        updateCountBadge(matched, total);
        const statusEl = document.querySelector('.arxiv-kw-loading');
        if (statusEl) statusEl.textContent = '';
    }

    function updateStatus(msg) {
        let statusEl = document.querySelector('.arxiv-kw-loading');
        if (statusEl) statusEl.textContent = msg;
    }

    // ==================== UI 构建 ====================
    const BTN_POS_KEY = 'arxiv_kw_btn_pos';
    let isPanelOpen = false;
    let isDraggingBtn = false;
    let dragOffset = { x: 0, y: 0 };
    let settingsReloadTimer = null;

    function refreshPageSoon() {
        if (settingsReloadTimer) {
            clearTimeout(settingsReloadTimer);
        }
        updateStatus('设置已更新，正在刷新...');
        settingsReloadTimer = setTimeout(() => {
            window.location.reload();
        }, 120);
    }

    function getSavedBtnPos() {
        const pos = GM_getValue(BTN_POS_KEY, null);
        if (pos) return pos;
        return { right: 16, top: 16 };
    }

    function saveBtnPos(pos) {
        GM_setValue(BTN_POS_KEY, pos);
    }

    function createFloatButton() {
        if (document.querySelector('.arxiv-kw-float-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'arxiv-kw-float-btn';
        btn.innerHTML = '⚙';
        btn.title = '拖动调整位置，点击打开配置';
        document.body.appendChild(btn);

        // 设置初始位置
        const pos = getSavedBtnPos();
        btn.style.right = pos.right + 'px';
        btn.style.top = pos.top + 'px';

        // 点击打开面板
        btn.addEventListener('click', () => {
            if (!isDraggingBtn) {
                togglePanel();
            }
        });

        // 拖动按钮
        btn.addEventListener('mousedown', (e) => {
            isDraggingBtn = false;
            const rect = btn.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            btn.style.transition = 'none';

            const onMove = (e) => {
                const dx = Math.abs(e.clientX - (rect.left + dragOffset.x));
                const dy = Math.abs(e.clientY - (rect.top + dragOffset.y));
                if (dx > 5 || dy > 5) isDraggingBtn = true;

                if (isDraggingBtn) {
                    const newRight = window.innerWidth - e.clientX - (rect.width - dragOffset.x);
                    const newTop = e.clientY - dragOffset.y;
                    btn.style.right = Math.max(0, newRight) + 'px';
                    btn.style.top = Math.max(0, newTop) + 'px';
                    btn.style.left = 'auto';
                }
            };

            const onUp = () => {
                if (isDraggingBtn) {
                    saveBtnPos({ right: parseInt(btn.style.right), top: parseInt(btn.style.top) });
                    updatePanelPosition();
                }
                isDraggingBtn = false;
                btn.style.transition = '';
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }

    function createFloatPanel() {
        if (document.querySelector('.arxiv-kw-float-panel')) return;

        const panel = document.createElement('div');
        panel.className = 'arxiv-kw-float-panel';
        document.body.appendChild(panel);

        panel.innerHTML = `
            <div class="arxiv-kw-panel-header">
                <span class="arxiv-kw-panel-title">🏷️ 关键词配置</span>
                <button class="arxiv-kw-panel-close">✕</button>
            </div>
            <div class="arxiv-kw-panel-body">
                <p class="arxiv-kw-panel-hint">
                    每行一个关键词，匹配标题 / 作者 / 摘要<br/>
                    正则模式支持完整正则表达式语法
                </p>
                <textarea class="arxiv-kw-panel-textarea" placeholder="axion&#10;dark matter&#10;gravitational wave"></textarea>
                <div class="arxiv-kw-panel-options">
                    <label><input type="checkbox" class="panel-card" /> 卡片模式</label>
                    <label><input type="checkbox" class="panel-case" /> 区分大小写</label>
                    <label><input type="checkbox" class="panel-regex" /> 正则模式</label>
                    <label><input type="checkbox" class="panel-dark" /> 深色模式</label>
                </div>
                <div style="margin-top:12px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:11px; color:#888;">每行:</span>
                    <select class="panel-cols" style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:4px 8px; color:#e0e0e0; font-size:12px;">
                        <option value="1">1 列</option>
                        <option value="2">2 列</option>
                        <option value="3">3 列</option>
                        <option value="4">4 列</option>
                        <option value="5">5 列</option>
                    </select>
                </div>
                <div class="arxiv-kw-panel-footer">
                    <button class="arxiv-kw-btn-reset">重置</button>
                    <button class="arxiv-kw-btn-save">应用</button>
                </div>
                <div class="arxiv-kw-loading"></div>
            </div>
        `;

        updatePanelPosition();

        // 事件绑定
        const closeBtn = panel.querySelector('.arxiv-kw-panel-close');
        const saveBtn = panel.querySelector('.arxiv-kw-btn-save');
        const resetBtn = panel.querySelector('.arxiv-kw-btn-reset');
        const cardCb = panel.querySelector('.panel-card');
        const caseCb = panel.querySelector('.panel-case');
        const regexCb = panel.querySelector('.panel-regex');
        const darkCb = panel.querySelector('.panel-dark');
        const colsSelect = panel.querySelector('.panel-cols');
        const textarea = panel.querySelector('.arxiv-kw-panel-textarea');

        // 初始化值
        cardCb.checked = isCardMode();
        caseCb.checked = isCaseSensitive();
        regexCb.checked = isRegexMode();
        darkCb.checked = isDarkMode();
        colsSelect.value = getColumns();

        closeBtn.addEventListener('click', () => closePanel());
        saveBtn.addEventListener('click', () => {
            const lines = textarea.value.split('\n').map(k => k.trim()).filter(k => k.length > 0);
            saveKeywords(lines);
            setCardMode(cardCb.checked);
            setCaseSensitive(caseCb.checked);
            setRegexMode(regexCb.checked);
            setDarkMode(darkCb.checked);
            setColumns(parseInt(colsSelect.value));
            syncDarkClass();
            closePanel();
            refreshPageSoon();
        });
        resetBtn.addEventListener('click', () => {
            textarea.value = '';
        });
        cardCb.addEventListener('change', () => {
            setCardMode(cardCb.checked);
            syncDarkClass();
            refreshPageSoon();
        });
        caseCb.addEventListener('change', () => {
            setCaseSensitive(caseCb.checked);
            refreshPageSoon();
        });
        regexCb.addEventListener('change', () => {
            setRegexMode(regexCb.checked);
            refreshPageSoon();
        });
        darkCb.addEventListener('change', () => {
            setDarkMode(darkCb.checked);
            syncDarkClass();
            refreshPageSoon();
        });
        colsSelect.addEventListener('change', () => {
            setColumns(parseInt(colsSelect.value));
            refreshPageSoon();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            if (isPanelOpen && !panel.contains(e.target) && !document.querySelector('.arxiv-kw-float-btn').contains(e.target)) {
                closePanel();
            }
        });
    }

    function updatePanelPosition() {
        const btn = document.querySelector('.arxiv-kw-float-btn');
        const panel = document.querySelector('.arxiv-kw-float-panel');
        if (!btn || !panel) return;

        const btnRect = btn.getBoundingClientRect();
        const panelWidth = 340;
        const panelHeight = panel.offsetHeight || 320;

        // 面板显示在按钮上方
        let left = btnRect.right - panelWidth + btnRect.width / 2;
        let top = btnRect.top - panelHeight - 8;

        // 边界检测
        if (left < 10) left = 10;
        if (left + panelWidth > window.innerWidth - 10) {
            left = window.innerWidth - panelWidth - 10;
        }
        if (top < 10) {
            // 如果上方空间不够，显示在按钮下方
            top = btnRect.bottom + 8;
        }

        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.right = 'auto';
    }

    function togglePanel() {
        const panel = document.querySelector('.arxiv-kw-float-panel');
        const btn = document.querySelector('.arxiv-kw-float-btn');
        if (!panel) return;

        isPanelOpen = !isPanelOpen;
        panel.classList.toggle('open', isPanelOpen);
        btn.classList.toggle('active', isPanelOpen);

        if (isPanelOpen) {
            updatePanelPosition();
            const textarea = panel.querySelector('.arxiv-kw-panel-textarea');
            const cardCb = panel.querySelector('.panel-card');
            const caseCb = panel.querySelector('.panel-case');
            const regexCb = panel.querySelector('.panel-regex');
            const darkCb = panel.querySelector('.panel-dark');
            const colsSelect = panel.querySelector('.panel-cols');
            textarea.value = loadKeywords().join('\n');
            cardCb.checked = isCardMode();
            caseCb.checked = isCaseSensitive();
            regexCb.checked = isRegexMode();
            darkCb.checked = isDarkMode();
            colsSelect.value = getColumns();
        }
    }

    function closePanel() {
        const panel = document.querySelector('.arxiv-kw-float-panel');
        const btn = document.querySelector('.arxiv-kw-float-btn');
        if (!panel) return;

        isPanelOpen = false;
        panel.classList.remove('open');
        btn.classList.remove('active');
    }

    function createCountBadge() {
        if (document.querySelector('.arxiv-kw-count-badge')) return;
        const badge = document.createElement('div');
        badge.className = 'arxiv-kw-count-badge';
        document.body.appendChild(badge);
    }

    function updateCountBadge(matched, total) {
        const badge = document.querySelector('.arxiv-kw-count-badge');
        const btn = document.querySelector('.arxiv-kw-float-btn');
        if (!badge || !btn) return;

        if (matched > 0) {
            badge.textContent = `${matched}/${total}`;
            badge.classList.add('visible');
            // 徽章显示在按钮左边
            const btnRect = btn.getBoundingClientRect();
            badge.style.right = (window.innerWidth - btnRect.left + 8) + 'px';
            badge.style.top = btnRect.top + 'px';
        } else {
            badge.classList.remove('visible');
        }
    }

    // ==================== 初始化 ====================
    async function init() {
        createFloatButton();
        createFloatPanel();
        createCountBadge();

        syncDarkClass();

        await processList();
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
    }

    GM_registerMenuCommand('🏷️ 设置关键词', () => togglePanel());
    GM_registerMenuCommand('🔄 刷新排序', processList);

})();
