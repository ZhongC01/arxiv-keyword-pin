// ==UserScript==
// @name         arXiv Keyword Highlight & Pin to Top
// @namespace    https://arxiv.org/
// @version      1.1
// @description  在 arXiv 列表页中，将匹配关键词的文章置顶显示并高亮
// @match        https://arxiv.org/list/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 样式注入 ====================
    GM_addStyle(`
        .arxiv-kw-pinned {
            border-left: 4px solid #e74c3c !important;
            background: linear-gradient(90deg, #fef9e7 0%, transparent 30%) !important;
            padding-left: 8px !important;
            transition: background 0.3s ease;
        }
        .arxiv-kw-pinned dt {
            border-bottom: 1px dashed #e74c3c44;
        }
        .arxiv-kw-highlight {
            background-color: #ffeaa7 !important;
            border-radius: 2px;
            padding: 0 2px;
        }
        .arxiv-kw-bar {
            position: sticky;
            top: 0;
            z-index: 9999;
            background: #2c3e50;
            color: #ecf0f1;
            padding: 10px 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .arxiv-kw-bar input[type="text"] {
            flex: 1;
            min-width: 200px;
            padding: 6px 10px;
            border: 1px solid #7f8c8d;
            border-radius: 4px;
            font-size: 14px;
            background: #ecf0f1;
            color: #2c3e50;
        }
        .arxiv-kw-bar input[type="text"]:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 4px #3498db88;
        }
        .arxiv-kw-bar button {
            padding: 6px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: background 0.2s;
        }
        .arxiv-kw-btn-apply {
            background: #3498db;
            color: white;
        }
        .arxiv-kw-btn-apply:hover { background: #2980b9; }
        .arxiv-kw-btn-clear {
            background: #e74c3c;
            color: white;
        }
        .arxiv-kw-btn-clear:hover { background: #c0392b; }
        .arxiv-kw-btn-config {
            background: #27ae60;
            color: white;
        }
        .arxiv-kw-btn-config:hover { background: #219a52; }
        .arxiv-kw-bar label {
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            user-select: none;
        }
        .arxiv-kw-bar label input[type="checkbox"] {
            width: 15px;
            height: 15px;
            cursor: pointer;
        }
        .arxiv-kw-count {
            font-size: 12px;
            color: #f39c12;
            font-weight: 600;
        }
        .arxiv-kw-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .arxiv-kw-modal {
            background: white;
            border-radius: 8px;
            padding: 24px;
            width: 520px;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .arxiv-kw-modal h3 {
            margin: 0 0 12px 0;
            color: #2c3e50;
            font-size: 18px;
        }
        .arxiv-kw-modal textarea {
            width: 100%;
            min-height: 120px;
            padding: 10px;
            border: 1px solid #bdc3c7;
            border-radius: 4px;
            font-size: 13px;
            font-family: monospace;
            resize: vertical;
            box-sizing: border-box;
        }
        .arxiv-kw-modal textarea:focus {
            outline: none;
            border-color: #3498db;
        }
        .arxiv-kw-modal .modal-hint {
            font-size: 12px;
            color: #7f8c8d;
            margin: 6px 0 14px 0;
            line-height: 1.6;
        }
        .arxiv-kw-modal .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .arxiv-kw-section-label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #e74c3c;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 3px;
            margin-left: 6px;
        }
    `);

    // ==================== 配置管理 ====================
    const STORAGE_KEY = 'arxiv_kw_keywords';
    const CASE_KEY = 'arxiv_kw_case_sensitive';
    const REGEX_KEY = 'arxiv_kw_regex_mode';

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

    // ==================== 匹配逻辑 ====================
    function buildMatchers(keywords, caseSensitive, regexMode) {
        return keywords.map(kw => {
            if (regexMode) {
                try {
                    return { regex: new RegExp(kw, caseSensitive ? '' : 'i'), source: kw };
                } catch (e) {
                    console.warn(`[arXiv-KW] 无效正则: ${kw}`, e);
                    return null;
                }
            } else {
                const flags = caseSensitive ? '' : 'i';
                // 转义特殊字符，做普通文本匹配
                const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return { regex: new RegExp(escaped, flags), source: kw };
            }
        }).filter(Boolean);
    }

    function matchText(text, matchers) {
        const hits = [];
        for (const m of matchers) {
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
        let matchResult = null;
        for (const m of matchers) {
            m.regex.lastIndex = 0;
            if (m.regex.test(text)) {
                matchResult = m;
                break;
            }
        }
        if (!matchResult) return;

        // 收集所有匹配位置
        const matches = [];
        for (const m of matchers) {
            m.regex.lastIndex = 0;
            let execResult;
            while ((execResult = m.regex.exec(text)) !== null) {
                matches.push({ start: execResult.index, end: execResult.index + execResult[0].length });
                // 防止零宽匹配死循环
                if (execResult[0].length === 0) m.regex.lastIndex++;
                // 对非全局正则，只匹配一次
                if (!m.regex.global) break;
            }
        }
        if (matches.length === 0) return;

        // 按位置排序并去重合并
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

        // 构建 DocumentFragment
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

    // ==================== 核心排序逻辑 ====================
    function processList() {
        const dlElements = document.querySelectorAll('dl#articles, dl');
        let dl = null;
        for (const d of dlElements) {
            if (d.id === 'articles') { dl = d; break; }
        }
        // 如果找不到 #articles，取包含 arXiv 条目的第一个大 dl
        if (!dl) {
            const allDl = document.querySelectorAll('dl');
            for (const d of allDl) {
                if (d.querySelector('dt a[href*="/abs/"]')) {
                    dl = d;
                    break;
                }
            }
        }
        if (!dl) {
            console.warn('[arXiv-KW] 未找到文章列表');
            return;
        }

        const keywords = loadKeywords();
        const caseSensitive = isCaseSensitive();
        const regexMode = isRegexMode();
        const matchers = buildMatchers(keywords, caseSensitive, regexMode);

        if (matchers.length === 0) {
            // 没有关键词时，恢复原始状态
            restoreOriginal();
            return;
        }

        // 收集所有 dt-dd 对
        const pairs = [];
        const children = dl.children;
        let currentDt = null;
        for (let i = 0; i < children.length; i++) {
            const el = children[i];
            if (el.tagName === 'DT') {
                currentDt = el;
            } else if (el.tagName === 'DD' && currentDt) {
                pairs.push({ dt: currentDt, dd: el });
                currentDt = null;
            }
        }

        if (pairs.length === 0) return;

        // 保存原始顺序（首次）
        if (!dl.dataset.arxivKwOriginal) {
            dl.dataset.arxivKwOriginal = '1';
        }

        // 对每个 pair 做匹配
        const sectionHeaders = []; // 保留分区标题（如 "New submissions"）
        const matched = [];
        const unmatched = [];

        // 收集 dl 之前的非 dt/dd 元素（标题等）
        const beforeElements = [];
        // 不需要处理，它们在 dl 外面

        for (const pair of pairs) {
            const titleEl = pair.dd.querySelector('.list-title');
            const authorsEl = pair.dd.querySelector('.list-authors');
            const abstractEl = pair.dd.querySelector('.mathjax');

            const title = titleEl ? titleEl.textContent : '';
            const authors = authorsEl ? authorsEl.textContent : '';
            const abstract = abstractEl ? abstractEl.textContent : '';

            const fullText = `${title} ${authors} ${abstract}`;
            const hits = matchText(fullText, matchers);

            if (hits.length > 0) {
                matched.push({ ...pair, hits });
            } else {
                unmatched.push(pair);
            }
        }

        // 清空 dl
        while (dl.firstChild) {
            dl.removeChild(dl.firstChild);
        }

        // 如果有匹配项，添加分区标记
        if (matched.length > 0) {
            const separatorDt = document.createElement('dt');
            separatorDt.innerHTML = `<span class="arxiv-kw-section-label">⭐ 关键词匹配</span> 命中 ${matched.length} 篇 — 关键词: ${keywords.map(k => `"${k}"`).join(', ')}`;
            separatorDt.style.cssText = 'padding: 8px 0; font-size: 14px; background: #fef9e7;';
            dl.appendChild(separatorDt);
            const spacerDd = document.createElement('dd');
            spacerDd.style.display = 'none';
            dl.appendChild(spacerDd);
        }

        // 先放匹配的
        for (const pair of matched) {
            pair.dt.classList.add('arxiv-kw-pinned');
            pair.dd.classList.add('arxiv-kw-pinned');
            dl.appendChild(pair.dt);
            dl.appendChild(pair.dd);
            // 高亮
            highlightElement(pair.dd, matchers);
        }

        // 分隔线
        if (matched.length > 0 && unmatched.length > 0) {
            const sepDt2 = document.createElement('dt');
            sepDt2.innerHTML = `<span style="color:#7f8c8d; font-size:13px;">——— 以下为未匹配文章 (${unmatched.length} 篇) ———</span>`;
            sepDt2.style.cssText = 'padding: 10px 0; border-top: 2px solid #bdc3c7;';
            dl.appendChild(sepDt2);
            const spacerDd2 = document.createElement('dd');
            spacerDd2.style.display = 'none';
            dl.appendChild(spacerDd2);
        }

        // 再放未匹配的
        for (const pair of unmatched) {
            pair.dt.classList.remove('arxiv-kw-pinned');
            pair.dd.classList.remove('arxiv-kw-pinned');
            dl.appendChild(pair.dt);
            dl.appendChild(pair.dd);
        }

        // 更新计数
        updateCount(matched.length, pairs.length);
    }

    function restoreOriginal() {
        // 简单刷新即可恢复原始顺序
        const countEl = document.querySelector('.arxiv-kw-count');
        if (countEl) countEl.textContent = '';
        // 移除高亮和标记
        document.querySelectorAll('.arxiv-kw-pinned').forEach(el => el.classList.remove('arxiv-kw-pinned'));
        document.querySelectorAll('.arxiv-kw-highlight').forEach(el => {
            const text = document.createTextNode(el.textContent);
            el.parentNode.replaceChild(text, el);
        });
        document.querySelectorAll('.arxiv-kw-section-label').forEach(el => {
            el.closest('dt')?.remove();
        });
    }

    function updateCount(matched, total) {
        const countEl = document.querySelector('.arxiv-kw-count');
        if (countEl) {
            countEl.textContent = `${matched}/${total} 篇命中`;
        }
    }

    // ==================== UI 构建 ====================
    function createToolbar() {
        // 防止重复
        if (document.querySelector('.arxiv-kw-bar')) return;

        const bar = document.createElement('div');
        bar.className = 'arxiv-kw-bar';

        const keywords = loadKeywords();
        const caseSensitive = isCaseSensitive();
        const regexMode = isRegexMode();

        bar.innerHTML = `
            <span style="font-weight:700; white-space:nowrap;">🏷️ 关键词:</span>
            <input type="text" class="arxiv-kw-input" placeholder="输入关键词，空格分隔（如：axion dark matter）" value="${keywords.join(' ')}" />
            <button class="arxiv-kw-btn-apply" title="应用关键词排序">应用</button>
            <button class="arxiv-kw-btn-clear" title="清除所有关键词">清除</button>
            <button class="arxiv-kw-btn-config" title="高级配置（每行一个关键词、正则等）">⚙ 配置</button>
            <label><input type="checkbox" class="arxiv-kw-case" ${caseSensitive ? 'checked' : ''} /> 区分大小写</label>
            <label><input type="checkbox" class="arxiv-kw-regex" ${regexMode ? 'checked' : ''} /> 正则模式</label>
            <span class="arxiv-kw-count"></span>
        `;

        document.body.prepend(bar);

        // 事件绑定
        const input = bar.querySelector('.arxiv-kw-input');
        const applyBtn = bar.querySelector('.arxiv-kw-btn-apply');
        const clearBtn = bar.querySelector('.arxiv-kw-btn-clear');
        const configBtn = bar.querySelector('.arxiv-kw-btn-config');
        const caseCb = bar.querySelector('.arxiv-kw-case');
        const regexCb = bar.querySelector('.arxiv-kw-regex');

        const apply = () => {
            const text = input.value.trim();
            const kws = text.split(/[\s,;，；]+/).filter(k => k.length > 0);
            saveKeywords(kws);
            processList();
        };

        applyBtn.addEventListener('click', apply);
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') apply();
        });

        clearBtn.addEventListener('click', () => {
            input.value = '';
            saveKeywords([]);
            restoreOriginal();
            processList();
        });

        caseCb.addEventListener('change', () => {
            setCaseSensitive(caseCb.checked);
            processList();
        });

        regexCb.addEventListener('change', () => {
            setRegexMode(regexCb.checked);
            processList();
        });

        configBtn.addEventListener('click', showConfigModal);
    }

    function showConfigModal() {
        // 移除已有弹窗
        document.querySelector('.arxiv-kw-modal-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'arxiv-kw-modal-overlay';

        const keywords = loadKeywords();
        const caseSensitive = isCaseSensitive();
        const regexMode = isRegexMode();

        overlay.innerHTML = `
            <div class="arxiv-kw-modal">
                <h3>⚙ 高级关键词配置</h3>
                <p class="modal-hint">
                    每行一个关键词，匹配范围包括标题、作者、摘要。<br/>
                    正则模式下每行是一个正则表达式。<br/>
                    <strong>示例：</strong><br/>
                    axion<br/>
                    dark matter<br/>
                    gravitational wave<br/>
                    Wilson coefficient<br/>
                    ^(muon|mu) collider  <em>← 正则模式</em>
                </p>
                <textarea class="arxiv-kw-modal-textarea">${keywords.join('\n')}</textarea>
                <div class="modal-hint" style="margin-top:10px;">
                    当前模式：${regexMode ? '🔶 正则匹配' : '🔷 纯文本匹配'} ${caseSensitive ? '| 区分大小写' : '| 不区分大小写'}
                </div>
                <div class="modal-actions">
                    <button class="arxiv-kw-btn-clear modal-cancel">取消</button>
                    <button class="arxiv-kw-btn-apply modal-save">保存并应用</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const textarea = overlay.querySelector('.arxiv-kw-modal-textarea');
        const cancelBtn = overlay.querySelector('.modal-cancel');
        const saveBtn = overlay.querySelector('.modal-save');

        cancelBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.remove();
        });

        saveBtn.addEventListener('click', () => {
            const lines = textarea.value.split('\n').map(k => k.trim()).filter(k => k.length > 0);
            saveKeywords(lines);
            // 同步更新工具栏输入框
            const input = document.querySelector('.arxiv-kw-input');
            if (input) input.value = lines.join(' ');
            overlay.remove();
            processList();
        });

        textarea.focus();
    }

    // ==================== 初始化 ====================
    function init() {
        createToolbar();
        // 如果已有保存的关键词，自动执行一次
        if (loadKeywords().length > 0) {
            processList();
        }
    }

    // 等待页面加载完成
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(init, 300);
    } else {
        window.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
    }

    // 注册油猴菜单命令
    GM_registerMenuCommand('🏷️ 设置关键词', showConfigModal);
    GM_registerMenuCommand('🔄 刷新排序', processList);

})();
