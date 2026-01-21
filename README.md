# 📈 FuturoInvest

Aplicación web de análisis técnico para trading de futuros de criptomonedas. Genera señales LONG/SHORT basadas en confluencia de indicadores técnicos con datos en tiempo real de Binance.

![FuturoInvest](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Demo en Vivo

[Ver Demo](https://tu-usuario.github.io/futuroinvest) *(Actualiza este enlace después de publicar)*

## ✨ Características

### Análisis Técnico Completo
- **Indicadores**: RSI (14), EMA 20/50, MACD (12,26,9), ATR (14), VWAP
- **Señales**: LONG, SHORT o NO TRADE basadas en confluencia
- **Score**: Sistema de puntuación 0-100 que evalúa la calidad de la señal
- **Gestión de Riesgo**: Cálculo automático de Entry, Stop Loss, TP1, TP2 y Risk:Reward

### Gráfico en Tiempo Real
- Integración con TradingView
- Velas japonesas con indicadores técnicos
- Múltiples timeframes (1m, 5m, 15m, 1h, 4h, 1d)

### 30+ Criptomonedas Soportadas
Bitcoin, Ethereum, Solana, Cardano, Ripple, Polygon, Avalanche, Chainlink, y muchas más...

### Funcionalidades Extra
- 📋 Copiar reporte al portapapeles
- 💾 Exportar análisis en JSON
- 📊 Historial de análisis (localStorage)
- 🎨 Diseño moderno y responsive
- 🌐 Datos reales de Binance API
- 🎮 Modo DEMO con datos sintéticos

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **CSS3** - Estilos modernos con variables CSS
- **JavaScript Vanilla** - Sin frameworks ni librerías externas
- **Binance API** - Datos de mercado en tiempo real
- **TradingView Widget** - Gráficos profesionales

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/futuroinvest.git
cd futuroinvest
```

2. Abre el archivo en tu navegador:
```bash
# Opción 1: Doble clic en index.html

# Opción 2: Usar un servidor local
python -m http.server 8000
# Luego abre http://localhost:8000

# Opción 3: Con Node.js
npx serve
```

## 🎯 Uso

1. **Selecciona un par de trading** (ej: BTCUSDT) o escribe uno personalizado
2. **Elige el timeframe** (1m, 5m, 15m, 1h, 4h, 1d)
3. **Haz clic en "Analizar"**
4. **Revisa los resultados**:
   - Señal (LONG/SHORT/NO TRADE)
   - Score de confluencia
   - Precios de entrada, SL y TP
   - Gráfico en tiempo real
   - Detalles de indicadores
   - Reglas cumplidas

## 📊 Lógica de Trading

### Señal LONG
- EMA20 > EMA50 (tendencia alcista)
- Precio cerca de EMA20 (pullback)
- RSI entre 45-65
- MACD histogram > 0
- Volatilidad aceptable (ATR < 5%)

### Señal SHORT
- EMA20 < EMA50 (tendencia bajista)
- Precio cerca de EMA20 (pullback)
- RSI entre 35-55
- MACD histogram < 0
- Volatilidad aceptable (ATR < 5%)

### NO TRADE
- Score < 60
- RSI extremo (>75 o <25)
- Volatilidad muy alta
- Señales contradictorias

## 🎨 Capturas de Pantalla

### Panel de Control
![Control Panel](screenshots/control-panel.png)

### Resultados del Análisis
![Results](screenshots/results.png)

### Gráfico en Tiempo Real
![Chart](screenshots/chart.png)

## 📁 Estructura del Proyecto

```
futuroinvest/
├── index.html          # Estructura HTML
├── styles.css          # Estilos y diseño
├── app.js             # Lógica de análisis
├── README.md          # Documentación
└── .gitignore         # Archivos ignorados
```

## ⚠️ Disclaimer

**IMPORTANTE**: Esta aplicación es solo con fines educativos y de demostración. NO es asesoría financiera. El trading de criptomonedas conlleva riesgos significativos. Opera bajo tu propio riesgo y nunca inviertas más de lo que puedas permitirte perder.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Roadmap

- [ ] Agregar más indicadores (Bollinger Bands, Fibonacci)
- [ ] Backtesting de estrategias
- [ ] Alertas por email/telegram
- [ ] Modo multi-timeframe
- [ ] Análisis de múltiples pares simultáneos
- [ ] Guardar estrategias personalizadas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Tu Nombre - [@tu-twitter](https://twitter.com/tu-twitter)

Proyecto: [https://github.com/tu-usuario/futuroinvest](https://github.com/tu-usuario/futuroinvest)

## 🙏 Agradecimientos

- [Binance API](https://binance-docs.github.io/apidocs/) por los datos de mercado
- [TradingView](https://www.tradingview.com/) por el widget de gráficos
- Comunidad de traders por el feedback

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
