// ==========================================
// ESCUDO ANTI-ANUNCIOS Y ANTI-POPUPS ULTRA-AGRESIVO
// ==========================================
window.open = function(url) { return null; };
window.alert = function() {};
window.confirm = function() { return true; };
window.prompt = function() { return ""; };

// Limpieza automática cada 200ms de elementos publicitarios inyectados
setInterval(() => {
    const maliciousElements = document.querySelectorAll('iframe[src*="ads"], div[id*="pop"], div[class*="popup"], div[style*="z-index: 2147483647"]');
    maliciousElements.forEach(el => {
        if (el !== video && !el.contains(video)) {
            el.remove();
        }
    });
}, 200);

// ==========================================
// VARIABLES GLOBALES Y ELEMENTOS
// ==========================================
let currentIndex = 0;
let hls = null;
let isFullscreen = false;
let lastBackPress = 0;

const video = document.getElementById('videoPlayer');
const overlay = document.getElementById('loadingOverlay');
const osd = document.getElementById('zappingOsd');

// Bloqueo de salida accidental por historial
window.addEventListener('popstate', function(event) {
    window.history.pushState(null, document.title, window.location.href);
}, true);
window.history.pushState(null, document.title, window.location.href);

// ==========================================
// RENDERIZADO DE CANALES Y LOGOS SVG
// ==========================================
function renderChannels() {
    const listContainer = document.getElementById('channelsList');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (typeof channels === 'undefined') return;

    channels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.className = `channel-item ${index === currentIndex ? 'active' : ''}`;
        item.tabIndex = 0;
        
        // Generador inteligente de logos SVG por código
        let svgLogo = '';
        if (channel.type.includes('dsports')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="#0284c7"><path d="M4 6h16v12H4z" opacity="0.2"/><path d="M6 9h12v6H6z" fill="#38bdf8"/><text x="7" y="14" fill="#fff" font-size="7" font-weight="bold">DS</text></svg>`;
        } else if (channel.type.includes('espn')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="#ef4444"><path d="M3 7h18v10H3z"/><text x="5" y="14" fill="#fff" font-size="7" font-weight="bold">ESPN</text></svg>`;
        } else {
            svgLogo = `<svg viewBox="0 0 24 24" fill="#10b981"><path d="M3 7h18v10H3z"/><text x="5" y="14" fill="#fff" font-size="7" font-weight="bold">TNT</text></svg>`;
        }

        item.innerHTML = `
            <div class="channel-svg-logo">${svgLogo}</div>
            <span>${channel.name}</span>
        `;
        
        item.onclick = () => {
            playChannel(index);
        };
        listContainer.appendChild(item);
    });
}

function updateActiveChannelUI() {
    const items = document.querySelectorAll('.channel-item');
    items.forEach((item, index) => {
        if (index === currentIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// ==========================================
// REPRODUCTOR Y GESTIÓN DE CANALES
// ==========================================
function playChannel(index) {
    if (typeof channels === 'undefined') return;
    if (index < 0) index = channels.length - 1;
    if (index >= channels.length) index = 0;
    currentIndex = index;

    updateActiveChannelUI();
    
    const items = document.querySelectorAll('.channel-item');
    if (items[currentIndex]) {
        items[currentIndex].focus();
    }

    const channel = channels[currentIndex];
    if (overlay) overlay.style.display = 'flex';
    const loadText = document.getElementById('loadingText');
    if (loadText) loadText.innerText = `Cargando ${channel.name}...`;

    showOsd(channel.name);

    const loadTimeout = setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
    }, 3500);

    // Forzar sonido activo al 100%
    video.muted = false;
    video.volume = 1.0;

    if (Hls.isSupported()) {
        if (hls) {
            hls.destroy();
        }
        hls = new Hls({
            xhrSetup: function (xhr, url) {
                xhr.withCredentials = false; 
            },
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
        });
        
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().then(() => {
                clearTimeout(loadTimeout);
                if (overlay) overlay.style.display = 'none';
            }).catch(() => {
                // Silenciar momentáneamente si el navegador bloquea el autoplay con sonido
                video.muted = true;
                video.play();
                clearTimeout(loadTimeout);
                if (overlay) overlay.style.display = 'none';
            });
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    hls.startLoad();
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                } else {
                    hls.destroy();
                }
            }
            clearTimeout(loadTimeout);
            if (overlay) overlay.style.display = 'none';
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(() => {});
            clearTimeout(loadTimeout);
            if (overlay) overlay.style.display = 'none';
        });
    }
}

// Desbloqueo universal de audio al primer clic/toque
document.addEventListener('click', () => {
    if (video.muted) {
        video.muted = false;
        video.volume = 1.0;
    }
}, { once: true });

// ==========================================
// OSD (MENSAJE FLOTANTE)
// ==========================================
let osdTimeout;
function showOsd(text) {
    if (!osd) return;
    osd.innerText = text;
    osd.style.display = 'block';
    clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
        osd.style.display = 'none';
    }, 2500);
}

// ==========================================
// CONTROL DE MANDO / TECLADO (TV BOX)
// ==========================================
document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    const isInSidebar = activeElement && activeElement.classList.contains('channel-item');

    const isBackKey = e.key === 'Escape' || e.key === 'BrowserBack' || e.keyCode === 8 || e.keyCode === 461 || e.code === 'Back' || e.key === 'GoBack';

    if (isBackKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (isFullscreen) {
            toggleFullscreen();
        } else {
            const currentTime = new Date().getTime();
            if (currentTime - lastBackPress < 1000) {
                try { window.history.go(-1); } catch(err) {}
                window.close();
            } else {
                lastBackPress = currentTime;
                showOsd("Presiona Atrás nuevamente para salir");
            }
        }
        return false;
    }

    if (e.key === 'ArrowRight' && isInSidebar) {
        e.preventDefault();
        video.focus();
        return;
    }

    if (e.key === 'ArrowLeft' && !isFullscreen && !isInSidebar) {
        e.preventDefault();
        const currentItem = document.querySelectorAll('.channel-item')[currentIndex];
        if (currentItem) currentItem.focus();
        return;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        if (isInSidebar) {
            playChannel(currentIndex);
        } else {
            toggleFullscreen();
        }
        return;
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (isFullscreen) {
            playChannel(currentIndex - 1);
        } else if (isInSidebar) {
            currentIndex = currentIndex - 1;
            if (currentIndex < 0) currentIndex = channels.length - 1;
            updateActiveChannelUI();
            const items = document.querySelectorAll('.channel-item');
            if (items[currentIndex]) items[currentIndex].focus();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (isFullscreen) {
            playChannel(currentIndex + 1);
        } else if (isInSidebar) {
            currentIndex = currentIndex + 1;
            if (currentIndex >= channels.length) currentIndex = 0;
            updateActiveChannelUI();
            const items = document.querySelectorAll('.channel-item');
            if (items[currentIndex]) items[currentIndex].focus();
        }
    }
}, true);

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    if (isFullscreen) {
        document.body.classList.add('fullscreen-mode');
        video.focus();
        showOsd(channels[currentIndex].name);
    } else {
        document.body.classList.remove('fullscreen-mode');
        const currentItem = document.querySelectorAll('.channel-item')[currentIndex];
        if (currentItem) currentItem.focus();
    }
}

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
window.onload = () => {
    renderChannels();
    playChannel(0); 
    const firstItem = document.querySelector('.channel-item');
    if (firstItem) firstItem.focus();

    // Ocultar el Splash Screen personalizado después de 2.2 segundos
    setTimeout(() => {
        const splash = document.getElementById('customSplash');
        if (splash) {
            splash.classList.add('hidden');
        }
    }, 2200);
};
