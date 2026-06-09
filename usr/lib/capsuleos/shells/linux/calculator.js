/**
 * Calculatrice GNOME (mode De base) — simulation Mint / org.gnome.Calculator
 */
(function initGnomeCalculatorApp(global) {
    'use strict';

    var OP_SYMBOL = {
        '+': '+',
        '-': '−',
        '*': '×',
        '/': '÷'
    };

    function formatDisplay(value) {
        if (!isFinite(value)) {
            return 'Erreur';
        }
        var str = String(value);
        if (str.indexOf('e') !== -1 || str.indexOf('E') !== -1) {
            return value.toLocaleString('fr-FR', { maximumFractionDigits: 8 });
        }
        var parts = str.split('.');
        var intPart = parts[0];
        var decPart = parts.length > 1 ? parts[1] : '';
        var grouped = Number(intPart).toLocaleString('fr-FR');
        if (decPart) {
            return grouped + ',' + decPart;
        }
        return grouped;
    }

    function parseDisplay(text) {
        if (!text || text === 'Erreur') {
            return 0;
        }
        var normalized = String(text).replace(/\s/g, '').replace(/,/g, '.');
        var num = parseFloat(normalized);
        return isNaN(num) ? 0 : num;
    }

    function compute(a, b, op) {
        if (op === '+') return a + b;
        if (op === '-') return a - b;
        if (op === '*') return a * b;
        if (op === '/') {
            if (b === 0) return NaN;
            return a / b;
        }
        return b;
    }

    function initCalculatorApp() {
        var root = global.document.getElementById('gnomeCalculatorApp');
        if (!root || root.dataset.calcInit === 'true') {
            return;
        }
        root.dataset.calcInit = 'true';
        root.setAttribute('tabindex', '0');

        var exprEl = global.document.getElementById('gnome-calc-expr');
        var valueEl = global.document.getElementById('gnome-calc-value');
        var keypad = global.document.getElementById('gnome-calc-keypad');
        if (!exprEl || !valueEl || !keypad) {
            return;
        }

        var accumulator = null;
        var operator = null;
        var current = '0';
        var fresh = true;
        var hasDecimal = false;

        function syncOpHighlight() {
            keypad.querySelectorAll('.gnome-calc__key--op[data-op]').forEach(function (btn) {
                var active = operator && btn.getAttribute('data-op') === operator;
                btn.classList.toggle('is-active', !!active);
            });
        }

        function renderDisplayValue() {
            if (current === 'Erreur') {
                return 'Erreur';
            }
            if (current.indexOf('.') !== -1) {
                var parts = current.split('.');
                var intFormatted = formatDisplay(parseFloat(parts[0]));
                return intFormatted + ',' + parts[1];
            }
            return formatDisplay(parseDisplay(current));
        }

        function render() {
            valueEl.textContent = renderDisplayValue();
            if (operator !== null && accumulator !== null && !fresh) {
                exprEl.textContent = formatDisplay(accumulator) + ' ' + OP_SYMBOL[operator];
            } else if (operator !== null && accumulator !== null) {
                exprEl.textContent = formatDisplay(accumulator) + ' ' + OP_SYMBOL[operator];
            } else {
                exprEl.textContent = '';
            }
            syncOpHighlight();
        }

        function setCurrent(val) {
            current = val;
            hasDecimal = val.indexOf('.') !== -1;
            render();
        }

        function clearAll() {
            accumulator = null;
            operator = null;
            current = '0';
            fresh = true;
            hasDecimal = false;
            render();
        }

        function inputDigit(digit) {
            if (fresh) {
                current = digit;
                fresh = false;
            } else if (current === '0') {
                current = digit;
            } else {
                current = current + digit;
            }
            render();
        }

        function inputDecimal() {
            if (fresh) {
                current = '0.';
                fresh = false;
                hasDecimal = true;
                render();
                return;
            }
            if (!hasDecimal) {
                current = current + '.';
                hasDecimal = true;
                render();
            }
        }

        function applyPercent() {
            var val = parseDisplay(current) / 100;
            setCurrent(String(val));
            fresh = true;
        }

        function applyNegate() {
            var val = parseDisplay(current) * -1;
            setCurrent(String(val));
        }

        function setOperator(op) {
            var val = parseDisplay(current);
            if (accumulator === null) {
                accumulator = val;
            } else if (!fresh && operator) {
                accumulator = compute(accumulator, val, operator);
                if (!isFinite(accumulator)) {
                    current = 'Erreur';
                    accumulator = null;
                    operator = null;
                    fresh = true;
                    render();
                    return;
                }
            } else if (fresh && operator) {
                /* chaînage : remplacer l'opérateur */
            } else {
                accumulator = val;
            }
            operator = op;
            fresh = true;
            setCurrent(String(accumulator));
        }

        function equals() {
            if (operator === null || accumulator === null) {
                return;
            }
            var val = parseDisplay(current);
            var result = compute(accumulator, val, operator);
            var exprLabel = formatDisplay(accumulator) + ' ' + OP_SYMBOL[operator] + ' ' + formatDisplay(val) + ' =';
            if (!isFinite(result)) {
                current = 'Erreur';
                accumulator = null;
                operator = null;
                fresh = true;
            } else {
                current = String(result);
                pushHistory(exprLabel, result);
                accumulator = null;
                operator = null;
                fresh = true;
            }
            render();
        }

        function onKeyClick(event) {
            var btn = event.target.closest('[data-calc]');
            if (!btn || !root.contains(btn)) {
                return;
            }
            var action = btn.getAttribute('data-calc');
            if (action === 'clear' || action === 'noop') {
                if (action === 'clear') {
                    clearAll();
                }
                return;
            }
            if (action === 'backspace') {
                if (fresh || current === '0' || current === 'Erreur') {
                    return;
                }
                if (current.length <= 1) {
                    setCurrent('0');
                    fresh = true;
                } else {
                    current = current.slice(0, -1);
                    hasDecimal = current.indexOf('.') !== -1;
                    render();
                }
                return;
            }
            if (action === 'negate') {
                applyNegate();
                return;
            }
            if (action === 'percent') {
                applyPercent();
                return;
            }
            if (action === 'decimal') {
                inputDecimal();
                return;
            }
            if (action === 'digit') {
                inputDigit(btn.getAttribute('data-digit'));
                return;
            }
            if (action === 'op') {
                setOperator(btn.getAttribute('data-op'));
                return;
            }
            if (action === 'equals') {
                equals();
                return;
            }
            if (action === 'fn') {
                applyScientificFn(btn.getAttribute('data-fn'));
            }
        }

        keypad.addEventListener('click', onKeyClick);
        var backspaceBtn = global.document.querySelector('[data-calc="backspace"]');
        if (backspaceBtn) {
            backspaceBtn.addEventListener('click', onKeyClick);
        }

        var modeBtn = global.document.getElementById('gnome-calc-mode');
        var modePopover = global.document.getElementById('gnome-calc-mode-popover');
        var advancedKeypad = global.document.getElementById('gnome-calc-keypad-advanced');
        var historyPanel = global.document.getElementById('gnome-calc-history-panel');
        var historyList = global.document.getElementById('gnome-calc-history-list');
        var historyToggle = root.querySelector('[data-calc="history-toggle"]');
        var calcHistory = [];
        var currentMode = 'basic';

        if (historyToggle) {
            historyToggle.addEventListener('click', function onHistoryToggle(event) {
                event.preventDefault();
                event.stopPropagation();
                toggleHistoryPanel();
            });
        }

        function renderHistory() {
            if (!historyList) {
                return;
            }
            historyList.innerHTML = '';
            var i;
            for (i = calcHistory.length - 1; i >= 0; i -= 1) {
                var entry = calcHistory[i];
                var li = global.document.createElement('li');
                var btn = global.document.createElement('button');
                btn.type = 'button';
                btn.className = 'gnome-calc__history-item';
                btn.setAttribute('data-calc-history-idx', String(i));
                btn.textContent = entry.label;
                li.appendChild(btn);
                historyList.appendChild(li);
            }
        }

        function pushHistory(label, value) {
            calcHistory.push({ label: label, value: value });
            if (calcHistory.length > 20) {
                calcHistory.shift();
            }
            renderHistory();
        }

        function toggleHistoryPanel(forceOpen) {
            if (!historyPanel || !historyToggle) {
                return;
            }
            var open = typeof forceOpen === 'boolean' ? forceOpen : historyPanel.hidden;
            historyPanel.hidden = !open;
            historyToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            historyToggle.classList.toggle('is-active', open);
        }

        function applyScientificFn(fnName) {
            var val = parseDisplay(current);
            var result;
            if (fnName === 'sin') {
                result = Math.sin(val * Math.PI / 180);
            } else if (fnName === 'cos') {
                result = Math.cos(val * Math.PI / 180);
            } else if (fnName === 'pi') {
                setCurrent(String(Math.PI));
                fresh = false;
                return;
            } else {
                return;
            }
            if (!isFinite(result)) {
                current = 'Erreur';
            } else {
                current = String(result);
            }
            fresh = true;
            render();
        }

        function syncAdvancedKeypad() {
            var showAdvanced = currentMode === 'advanced' || currentMode === 'programming';
            root.classList.toggle('gnome-calc--advanced', showAdvanced);
            root.classList.toggle('gnome-calc--programming', currentMode === 'programming');
            if (advancedKeypad) {
                advancedKeypad.hidden = !showAdvanced;
            }
        }

        function setMode(mode) {
            currentMode = mode;
            var labels = { basic: 'Basique', advanced: 'Avancée', programming: 'Programmation' };
            var modeLabel = global.document.getElementById('gnome-calc-mode-label');
            if (modeLabel) {
                modeLabel.textContent = labels[mode] || 'Basique';
            }
            if (modeBtn) {
                modeBtn.setAttribute('aria-expanded', 'false');
            }
            syncAdvancedKeypad();
            if (modePopover) {
                modePopover.hidden = true;
                modePopover.querySelectorAll('.gnome-calc__mode-option').forEach(function (opt) {
                    opt.classList.toggle('is-active', opt.getAttribute('data-calc-mode') === mode);
                });
            }
            clearAll();
        }

        function toggleModePopover() {
            if (!modePopover || !modeBtn) {
                return;
            }
            var open = modePopover.hidden;
            modePopover.hidden = !open;
            modeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        if (historyList) {
            historyList.addEventListener('click', function onHistoryClick(event) {
                var item = event.target.closest('[data-calc-history-idx]');
                if (!item) {
                    return;
                }
                var idx = parseInt(item.getAttribute('data-calc-history-idx'), 10);
                var entry = calcHistory[idx];
                if (entry) {
                    setCurrent(String(entry.value));
                    fresh = true;
                    toggleHistoryPanel(false);
                }
            });
        }

        if (modeBtn && modePopover) {
            modeBtn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleModePopover();
            });
            modePopover.querySelectorAll('[data-calc-mode]').forEach(function (opt) {
                opt.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    setMode(opt.getAttribute('data-calc-mode'));
                });
            });
            global.document.addEventListener('click', function (event) {
                if (!modePopover.hidden
                    && !modePopover.contains(event.target)
                    && event.target !== modeBtn) {
                    modePopover.hidden = true;
                    modeBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        root.addEventListener('keydown', function onKeyboard(event) {
            var key = event.key;
            if (key >= '0' && key <= '9') {
                event.preventDefault();
                inputDigit(key);
                return;
            }
            if (key === ',' || key === '.') {
                event.preventDefault();
                inputDecimal();
                return;
            }
            if (key === 'Enter' || key === '=') {
                event.preventDefault();
                equals();
                return;
            }
            if (key === 'Escape') {
                event.preventDefault();
                clearAll();
                return;
            }
            if (key === '+') {
                event.preventDefault();
                setOperator('+');
                return;
            }
            if (key === '-') {
                event.preventDefault();
                setOperator('-');
                return;
            }
            if (key === '*') {
                event.preventDefault();
                setOperator('*');
                return;
            }
            if (key === '/') {
                event.preventDefault();
                setOperator('/');
            }
        });

        syncAdvancedKeypad();
        clearAll();
    }

    global.initCalculatorApp = initCalculatorApp;
}(typeof window !== 'undefined' ? window : this));
