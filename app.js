// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';
const TIMEFRAME_MAP = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d'
};

// ============================================
// ELEMENTOS DEL DOM
// ============================================

const symbolPreset = document.getElementById('symbolPreset');
const customSymbol = document.getElementById('customSymbol');
const timeframe = document.getElementById('timeframe');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const copyBtn = document.getElementById('copyBtn');
const exportBtn = document.getElementById('exportBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let currentAnalysis = null;
let tradingViewWidget = null;

// ============================================
// EVENT LISTENERS
// ============================================

symbolPreset.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customSymbol.style.display = 'block';
        customSymbol.focus();
    } else {
        customSymbol.style.display = 'none';
    }
});

analyzeBtn.addEventListener('click', performAnalysis);
copyBtn.addEventListener('click', copyReport);
exportBtn.addEventListener('click', exportJSON);
clearHistoryBtn.addEventListener('click', clearHistory);

// ============================================
// FUNCIÓN PRINCIPAL DE ANÁLISIS
// ============================================

async function performAnalysis() {
    const symbol = getSelectedSymbol();
    const tf = timeframe.value;

    if (!symbol) {
        alert('Por favor ingresa un símbolo válido');
        return;
    }

    showLoading(true);
    resultsSection.style.display = 'none';

    try {
        // Obtener datos de velas
        const candles = await fetchCandles(symbol, tf);
        
        if (!candles || candles.length < 100) {
            throw new Error('No hay suficientes datos para el análisis');
        }

        // Calcular indicadores
        const indicators = calculateIndicators(candles);
        
        // Generar señal y análisis
        const analysis = buildSignal(candles, indicators, symbol, tf);
        
        // Guardar análisis actual
        currentAnalysis = analysis;
        
        // Renderizar resultados
        renderResults(analysis);
        
        // Cargar gráfico de TradingView
        loadTradingViewChart(symbol, tf);
        
        // Guardar en historial
        saveToHistory(analysis);
        
        showLoading(false);
        resultsSection.style.display = 'block';
        
    } catch (error) {
        console.error('Error en análisis:', error);
        showLoading(false);
        
        // Modo demo con datos sintéticos
        if (confirm('No se pudieron obtener datos reales. ¿Deseas usar el modo DEMO con datos sintéticos?')) {
            useDemoMode(symbol, tf);
        }
    }
}

// ============================================
// OBTENCIÓN DE DATOS (API BINANCE)
// ============================================

async function fetchCandles(symbol, interval, limit = 200) {
    const url = `${BINANCE_API_BASE}/klines?symbol=${symbol.toUpperCase()}&interval=${TIMEFRAME_MAP[interval]}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`Error API: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Convertir a formato OHLCV
    return data.map(candle => ({
        timestamp: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
    }));
}

// ============================================
// MODO DEMO (DATOS SINTÉTICOS)
// ============================================

function useDemoMode(symbol, tf) {
    showLoading(true);
    
    setTimeout(() => {
        const candles = generateSyntheticCandles(200);
        const indicators = calculateIndicators(candles);
        const analysis = buildSignal(candles, indicators, symbol + ' (DEMO)', tf);
        
        currentAnalysis = analysis;
        renderResults(analysis);
        saveToHistory(analysis);
        
        // Cargar gráfico de TradingView
        loadTradingViewChart(symbol, tf);
        
        showLoading(false);
        resultsSection.style.display = 'block';
    }, 1000);
}

function generateSyntheticCandles(count) {
    const candles = [];
    let price = 40000 + Math.random() * 20000;
    const now = Date.now();
    
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.48) * price * 0.02;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = 100 + Math.random() * 500;
        
        candles.push({
            timestamp: now - (count - i) * 60000,
            open,
            high,
            low,
            close,
            volume
        });
        
        price = close;
    }
    
    return candles;
}

// ============================================
// CÁLCULO DE INDICADORES
// ============================================

function calculateIndicators(candles) {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);
    
    return {
        rsi: calcRSI(closes, 14),
        ema20: calcEMA(closes, 20),
        ema50: calcEMA(closes, 50),
        macd: calcMACD(closes),
        atr: calcATR(highs, lows, closes, 14),
        vwap: calcVWAP(candles)
    };
}

// RSI (Relative Strength Index)
function calcRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    
    let avgGain = 0;
    let avgLoss = 0;
    
    // Primera media
    for (let i = 0; i < period; i++) {
        if (changes[i] > 0) avgGain += changes[i];
        else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;
    
    // Suavizado
    for (let i = period; i < changes.length; i++) {
        if (changes[i] > 0) {
            avgGain = (avgGain * (period - 1) + changes[i]) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
        }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

// EMA (Exponential Moving Average)
function calcEMA(prices, period) {
    if (prices.length < period) return null;
    
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
}

// MACD (Moving Average Convergence Divergence)
function calcMACD(prices, fast = 12, slow = 26, signal = 9) {
    if (prices.length < slow) return null;
    
    const emaFast = calcEMAArray(prices, fast);
    const emaSlow = calcEMAArray(prices, slow);
    
    const macdLine = emaFast[emaFast.length - 1] - emaSlow[emaSlow.length - 1];
    
    const macdHistory = [];
    for (let i = 0; i < Math.min(emaFast.length, emaSlow.length); i++) {
        macdHistory.push(emaFast[i] - emaSlow[i]);
    }
    
    const signalLine = calcEMAArray(macdHistory, signal);
    const histogram = macdLine - signalLine[signalLine.length - 1];
    
    return {
        macd: macdLine,
        signal: signalLine[signalLine.length - 1],
        histogram: histogram
    };
}

function calcEMAArray(prices, period) {
    const emaArray = [];
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b) / period;
    emaArray.push(ema);
    
    for (let i = period; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
        emaArray.push(ema);
    }
    
    return emaArray;
}

// ATR (Average True Range)
function calcATR(highs, lows, closes, period = 14) {
    if (highs.length < period + 1) return null;
    
    const trueRanges = [];
    for (let i = 1; i < highs.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trueRanges.push(tr);
    }
    
    let atr = trueRanges.slice(0, period).reduce((a, b) => a + b) / period;
    
    for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period;
    }
    
    return atr;
}

// VWAP (Volume Weighted Average Price)
function calcVWAP(candles) {
    let cumVolume = 0;
    let cumVolumePrice = 0;
    
    for (const candle of candles) {
        const typical = (candle.high + candle.low + candle.close) / 3;
        cumVolumePrice += typical * candle.volume;
        cumVolume += candle.volume;
    }
    
    return cumVolume > 0 ? cumVolumePrice / cumVolume : null;
}

// ============================================
// LÓGICA DE SEÑAL Y SCORING
// ============================================

function buildSignal(candles, indicators, symbol, tf) {
    const currentPrice = candles[candles.length - 1].close;
    const { rsi, ema20, ema50, macd, atr, vwap } = indicators;
    
    // Sistema de puntuación
    let score = 0;
    const rules = [];
    
    // 1. Tendencia (EMA20 vs EMA50) - 25 puntos
    const trendUp = ema20 > ema50;
    const trendDown = ema20 < ema50;
    
    if (trendUp) {
        score += 25;
        rules.push({ text: 'Tendencia alcista (EMA20 > EMA50)', passed: true, points: 25 });
    } else if (trendDown) {
        score += 25;
        rules.push({ text: 'Tendencia bajista (EMA20 < EMA50)', passed: true, points: 25 });
    } else {
        rules.push({ text: 'Sin tendencia clara', passed: false, points: 0 });
    }
    
    // 2. Precio cerca de EMA20 (pullback) - 15 puntos
    const distanceToEMA20 = Math.abs(currentPrice - ema20) / currentPrice;
    const nearEMA20 = distanceToEMA20 < 0.02; // Dentro del 2%
    
    if (nearEMA20) {
        score += 15;
        rules.push({ text: 'Precio cerca de EMA20 (pullback favorable)', passed: true, points: 15 });
    } else {
        rules.push({ text: 'Precio alejado de EMA20', passed: false, points: 0 });
    }
    
    // 3. RSI en zona favorable - 20 puntos
    let rsiScore = 0;
    if (trendUp && rsi >= 45 && rsi <= 65) {
        rsiScore = 20;
        rules.push({ text: `RSI en zona alcista favorable (${rsi.toFixed(1)})`, passed: true, points: 20 });
    } else if (trendDown && rsi >= 35 && rsi <= 55) {
        rsiScore = 20;
        rules.push({ text: `RSI en zona bajista favorable (${rsi.toFixed(1)})`, passed: true, points: 20 });
    } else if (rsi > 75) {
        rsiScore = -10;
        rules.push({ text: `RSI sobrecomprado (${rsi.toFixed(1)})`, passed: false, points: -10 });
    } else if (rsi < 25) {
        rsiScore = -10;
        rules.push({ text: `RSI sobrevendido (${rsi.toFixed(1)})`, passed: false, points: -10 });
    } else {
        rules.push({ text: `RSI neutral (${rsi.toFixed(1)})`, passed: false, points: 0 });
    }
    score += rsiScore;
    
    // 4. MACD confirma - 20 puntos
    if ((trendUp && macd.histogram > 0) || (trendDown && macd.histogram < 0)) {
        score += 20;
        rules.push({ text: 'MACD confirma la tendencia', passed: true, points: 20 });
    } else {
        rules.push({ text: 'MACD no confirma', passed: false, points: 0 });
    }
    
    // 5. Volatilidad aceptable (ATR) - 10 puntos
    const atrPercent = (atr / currentPrice) * 100;
    const volatilityOk = atrPercent < 5; // ATR menor al 5% del precio
    
    if (volatilityOk) {
        score += 10;
        rules.push({ text: `Volatilidad aceptable (ATR: ${atrPercent.toFixed(2)}%)`, passed: true, points: 10 });
    } else {
        score += -5;
        rules.push({ text: `Volatilidad alta (ATR: ${atrPercent.toFixed(2)}%)`, passed: false, points: -5 });
    }
    
    // Determinar señal
    let signal = 'NO TRADE';
    
    if (score >= 60 && trendUp && rsi < 75) {
        signal = 'LONG';
    } else if (score >= 60 && trendDown && rsi > 25) {
        signal = 'SHORT';
    }
    
    // Calcular precios de entrada, SL y TP
    const entry = signal === 'LONG' 
        ? currentPrice - 0.25 * atr 
        : signal === 'SHORT' 
            ? currentPrice + 0.25 * atr 
            : currentPrice;
    
    const stopLoss = signal === 'LONG'
        ? entry - 1.0 * atr
        : signal === 'SHORT'
            ? entry + 1.0 * atr
            : null;
    
    const tp1 = signal === 'LONG'
        ? entry + 1.0 * atr
        : signal === 'SHORT'
            ? entry - 1.0 * atr
            : null;
    
    const tp2 = signal === 'LONG'
        ? entry + 2.0 * atr
        : signal === 'SHORT'
            ? entry - 2.0 * atr
            : null;
    
    // Calcular Risk:Reward
    const risk = Math.abs(entry - stopLoss);
    const reward1 = Math.abs(tp1 - entry);
    const reward2 = Math.abs(tp2 - entry);
    
    const rr1 = risk > 0 ? (reward1 / risk).toFixed(2) : 'N/A';
    const rr2 = risk > 0 ? (reward2 / risk).toFixed(2) : 'N/A';
    
    // Normalizar score a 0-100
    score = Math.max(0, Math.min(100, score));
    
    return {
        symbol,
        timeframe: tf,
        timestamp: Date.now(),
        signal,
        score,
        currentPrice,
        entry,
        stopLoss,
        tp1,
        tp2,
        rr1,
        rr2,
        indicators: {
            rsi: rsi.toFixed(2),
            ema20: ema20.toFixed(2),
            ema50: ema50.toFixed(2),
            macd: macd.macd.toFixed(2),
            macdSignal: macd.signal.toFixed(2),
            macdHist: macd.histogram.toFixed(2),
            atr: atr.toFixed(2),
            atrPercent: atrPercent.toFixed(2),
            vwap: vwap ? vwap.toFixed(2) : 'N/A'
        },
        rules
    };
}

// ============================================
// GRÁFICO DE TRADINGVIEW
// ============================================

function loadTradingViewChart(symbol, timeframe) {
    // Limpiar widget anterior si existe
    const chartContainer = document.getElementById('tradingview_chart');
    chartContainer.innerHTML = '';
    
    // Mapear timeframe a formato TradingView
    const tvTimeframe = mapTimeframeToTradingView(timeframe);
    
    // Limpiar símbolo (remover "(DEMO)" si existe)
    const cleanSymbol = symbol.replace(' (DEMO)', '');
    
    // Crear nuevo widget
    if (typeof TradingView !== 'undefined') {
        tradingViewWidget = new TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${cleanSymbol}`,
            interval: tvTimeframe,
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "es",
            toolbar_bg: "#1e293b",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: false,
            container_id: "tradingview_chart",
            studies: [
                "RSI@tv-basicstudies",
                "MASimple@tv-basicstudies",
                "MACD@tv-basicstudies"
            ],
            disabled_features: ["use_localstorage_for_settings"],
            enabled_features: ["study_templates"],
            overrides: {
                "mainSeriesProperties.candleStyle.upColor": "#10b981",
                "mainSeriesProperties.candleStyle.downColor": "#ef4444",
                "mainSeriesProperties.candleStyle.borderUpColor": "#10b981",
                "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
                "mainSeriesProperties.candleStyle.wickUpColor": "#10b981",
                "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444"
            }
        });
    }
}

function mapTimeframeToTradingView(timeframe) {
    const map = {
        '1m': '1',
        '5m': '5',
        '15m': '15',
        '1h': '60',
        '4h': '240',
        '1d': 'D'
    };
    return map[timeframe] || '15';
}

// ============================================
// RENDERIZADO DE RESULTADOS
// ============================================

function renderResults(analysis) {
    // Señal principal
    const signalBadge = document.getElementById('signalBadge');
    signalBadge.textContent = analysis.signal;
    signalBadge.className = 'signal-badge ' + analysis.signal.toLowerCase().replace(' ', '-');
    
    // Información básica
    document.getElementById('resultSymbol').textContent = analysis.symbol;
    document.getElementById('resultTimeframe').textContent = analysis.timeframe;
    document.getElementById('resultPrice').textContent = '$' + analysis.currentPrice.toFixed(2);
    
    // Score
    const scoreBar = document.getElementById('scoreBar');
    scoreBar.style.width = analysis.score + '%';
    document.getElementById('scoreValue').textContent = analysis.score + '/100';
    
    let scoreDesc = '';
    if (analysis.score >= 70) scoreDesc = 'Alta confluencia - Señal fuerte';
    else if (analysis.score >= 50) scoreDesc = 'Confluencia moderada';
    else scoreDesc = 'Baja confluencia - Evitar trade';
    
    document.getElementById('scoreDescription').textContent = scoreDesc;
    
    // Parámetros de trade
    document.getElementById('entryPrice').textContent = analysis.entry ? '$' + analysis.entry.toFixed(2) : 'N/A';
    document.getElementById('stopLoss').textContent = analysis.stopLoss ? '$' + analysis.stopLoss.toFixed(2) : 'N/A';
    document.getElementById('tp1').textContent = analysis.tp1 ? '$' + analysis.tp1.toFixed(2) : 'N/A';
    document.getElementById('tp2').textContent = analysis.tp2 ? '$' + analysis.tp2.toFixed(2) : 'N/A';
    document.getElementById('rr1').textContent = analysis.rr1;
    document.getElementById('rr2').textContent = analysis.rr2;
    
    // Tabla de indicadores
    const indicatorsTable = document.getElementById('indicatorsTable');
    indicatorsTable.innerHTML = '';
    
    for (const [key, value] of Object.entries(analysis.indicators)) {
        const row = document.createElement('div');
        row.className = 'indicator-row';
        row.innerHTML = `
            <span class="indicator-name">${formatIndicatorName(key)}</span>
            <span class="indicator-value">${value}</span>
        `;
        indicatorsTable.appendChild(row);
    }
    
    // Checklist de reglas
    const rulesChecklist = document.getElementById('rulesChecklist');
    rulesChecklist.innerHTML = '';
    
    for (const rule of analysis.rules) {
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item ' + (rule.passed ? 'passed' : 'failed');
        ruleItem.innerHTML = `
            <span class="rule-icon">${rule.passed ? '✅' : '❌'}</span>
            <span class="rule-text">${rule.text}</span>
            <span class="rule-points">${rule.points > 0 ? '+' : ''}${rule.points}</span>
        `;
        rulesChecklist.appendChild(ruleItem);
    }
}

function formatIndicatorName(key) {
    const names = {
        rsi: 'RSI (14)',
        ema20: 'EMA 20',
        ema50: 'EMA 50',
        macd: 'MACD Line',
        macdSignal: 'MACD Signal',
        macdHist: 'MACD Histogram',
        atr: 'ATR (14)',
        atrPercent: 'ATR %',
        vwap: 'VWAP'
    };
    return names[key] || key;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

function getSelectedSymbol() {
    if (symbolPreset.value === 'custom') {
        return customSymbol.value.trim().toUpperCase();
    }
    return symbolPreset.value;
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
    analyzeBtn.disabled = show;
}

// ============================================
// COPIAR Y EXPORTAR
// ============================================

function copyReport() {
    if (!currentAnalysis) return;
    
    const report = `
🔍 ANÁLISIS TÉCNICO - FuturoInvest

📊 Símbolo: ${currentAnalysis.symbol}
⏰ Timeframe: ${currentAnalysis.timeframe}
💰 Precio Actual: $${currentAnalysis.currentPrice.toFixed(2)}

🎯 SEÑAL: ${currentAnalysis.signal}
📈 Score de Confluencia: ${currentAnalysis.score}/100

💼 PARÁMETROS DE TRADE:
• Entry: $${currentAnalysis.entry ? currentAnalysis.entry.toFixed(2) : 'N/A'}
• Stop Loss: $${currentAnalysis.stopLoss ? currentAnalysis.stopLoss.toFixed(2) : 'N/A'}
• TP1: $${currentAnalysis.tp1 ? currentAnalysis.tp1.toFixed(2) : 'N/A'}
• TP2: $${currentAnalysis.tp2 ? currentAnalysis.tp2.toFixed(2) : 'N/A'}
• R:R (TP1): ${currentAnalysis.rr1}
• R:R (TP2): ${currentAnalysis.rr2}

📊 INDICADORES:
• RSI: ${currentAnalysis.indicators.rsi}
• EMA20: ${currentAnalysis.indicators.ema20}
• EMA50: ${currentAnalysis.indicators.ema50}
• MACD: ${currentAnalysis.indicators.macd}
• ATR: ${currentAnalysis.indicators.atr} (${currentAnalysis.indicators.atrPercent}%)

⚠️ Disclaimer: Esto es solo con fines educativos. Opera bajo tu propio riesgo.
    `.trim();
    
    navigator.clipboard.writeText(report).then(() => {
        alert('✅ Reporte copiado al portapapeles');
    }).catch(() => {
        alert('❌ Error al copiar. Intenta de nuevo.');
    });
}

function exportJSON() {
    if (!currentAnalysis) return;
    
    const dataStr = JSON.stringify(currentAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `analisis_${currentAnalysis.symbol}_${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// ============================================
// HISTORIAL (localStorage)
// ============================================

function saveToHistory(analysis) {
    const history = getHistory();
    history.unshift({
        symbol: analysis.symbol,
        timeframe: analysis.timeframe,
        signal: analysis.signal,
        score: analysis.score,
        timestamp: analysis.timestamp
    });
    
    // Mantener solo los últimos 10
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('futuroInvestHistory', JSON.stringify(history));
    renderHistory();
}

function getHistory() {
    const data = localStorage.getItem('futuroInvestHistory');
    return data ? JSON.parse(data) : [];
}

function clearHistory() {
    if (confirm('¿Estás seguro de borrar todo el historial?')) {
        localStorage.removeItem('futuroInvestHistory');
        renderHistory();
    }
}

function renderHistory() {
    const history = getHistory();
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-message">No hay análisis previos</p>';
        return;
    }
    
    historyList.innerHTML = '';
    
    for (const item of history) {
        const date = new Date(item.timestamp);
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item ' + item.signal.toLowerCase().replace(' ', '-');
        historyItem.innerHTML = `
            <div class="history-header">
                <span class="history-symbol">${item.symbol}</span>
                <span class="history-date">${date.toLocaleString('es-ES')}</span>
            </div>
            <div class="history-details">
                <span><strong>Timeframe:</strong> ${item.timeframe}</span>
                <span><strong>Señal:</strong> ${item.signal}</span>
                <span><strong>Score:</strong> ${item.score}/100</span>
            </div>
        `;
        historyList.appendChild(historyItem);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderHistory();
});
