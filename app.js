// ==========================================
// ESCUDO ANTI-ANUNCIOS Y ANTI-POPUPS ULTRA-AGRESIVO
// ==========================================
window.open = function(url) { return null; };
window.alert = function() {};
window.confirm = function() { return true; };
window.prompt = function() { return ""; };

setInterval(() => {
    const maliciousElements = document.querySelectorAll('iframe[src*="ads"], div[id*="pop"], div[class*="popup"], div[style*="z-index: 2147483647"]');
    maliciousElements.forEach(el => {
        if (el !== video && !el.contains(video)) {
            el.remove();
        }
    });
}, 200);

let currentIndex = 0;
let hls = null;
let isFullscreen = false;
let lastBackPress = 0;

const video = document.getElementById('videoPlayer');
const overlay = document.getElementById('loadingOverlay');
const osd = document.getElementById('zappingOsd');
const fullscreenBtn = document.getElementById('fullscreenBtn');

window.addEventListener('popstate', function(event) {
    window.history.pushState(null, document.title, window.location.href);
}, true);
window.history.pushState(null, document.title, window.location.href);

// ==========================================
// RENDERIZADO DE CANALES
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
        
        let svgLogo = '';
        const name = channel.name.toLowerCase();

        if (name.includes('dsports +') || name.includes('dsports+')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#0284c7"/><text x="3" y="15" fill="#fff" font-size="7" font-weight="900">DS+</text></svg>`;
        } else if (name.includes('dsports 2')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#0284c7"/><text x="4" y="15" fill="#fff" font-size="7" font-weight="900">DS2</text></svg>`;
        } else if (name.includes('dsports')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#0284c7"/><text x="5" y="15" fill="#fff" font-size="8" font-weight="900">DS</text></svg>`;
        } else if (name.includes('espn premium')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#7c3aed"/><text x="2" y="15" fill="#fff" font-size="6" font-weight="900">PREM</text></svg>`;
        } else if (name.includes('espn 2')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#dc2626"/><text x="3" y="15" fill="#fff" font-size="7" font-weight="900">E2</text></svg>`;
        } else if (name.includes('espn 3')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#dc2626"/><text x="3" y="15" fill="#fff" font-size="7" font-weight="900">E3</text></svg>`;
        } else if (name.includes('espn')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#dc2626"/><text x="2" y="15" fill="#fff" font-size="6" font-weight="900">ESPN</text></svg>`;
        } else if (name.includes('tnt')) {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#059669"/><text x="3" y="15" fill="#fff" font-size="7" font-weight="900">TNT</text></svg>`;
        } else {
            svgLogo = `<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#334155"/><text x="6" y="15" fill="#fff" font-size="8" font-weight="900">TV</text></svg>`;
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

function playChannel(index) {
    if (typeof channels === 'undefined') return;
    if (index < 0) index = channels.length - 1;
    if (index >= channels.length) index = 0;
    currentIndex = index;

    updateActiveChannelUI();
    
    const items = document.querySelectorAll('.channel-item');
    if (items[currentIndex] && document.activeElement && document.activeElement.classList.contains('channel-item')) {
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

document.addEventListener('click', () => {
    if (video.muted) {
        video.muted = false;
        video.volume = 1.0;
    }
}, { once: true });

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
// GESTIÓN DE PANTALLA COMPLETA Y FOCO DERECHO
// ==========================================
if (fullscreenBtn) {
    fullscreenBtn.onclick = () => {
        toggleFullscreen();
    };
}

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    const container = document.getElementById('videoContainer');

    if (isFullscreen) {
        document.body.classList.add('fullscreen-mode');
        showOsd(channels[currentIndex].name);

        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
        }
    } else {
        document.body.classList.remove('fullscreen-mode');
        
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        
        // Mantener el foco en la parte derecha (en el botón de pantalla completa) en lugar de botarlo a la izquierda
        if (fullscreenBtn) {
            fullscreenBtn.focus();
        }
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        isFullscreen = false;
        document.body.classList.remove('fullscreen-mode');
        if (fullscreenBtn) {
            fullscreenBtn.focus();
        }
    }
});

document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    const isInSidebar = activeElement && activeElement.classList.contains('channel-item');
    const isFocusOnRight = activeElement === fullscreenBtn;

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

    // Flecha derecha desde la barra lateral: mueve el foco al botón de pantalla completa de la derecha
    if (e.key === 'ArrowRight' && isInSidebar) {
        e.preventDefault();
        if (fullscreenBtn) fullscreenBtn.focus();
        return;
    }

    // Flecha izquierda desde el botón de la derecha: regresa el foco a la lista de canales
    if (e.key === 'ArrowLeft' && isFocusOnRight && !isFullscreen) {
        e.preventDefault();
        const currentItem = document.querySelectorAll('.channel-item')[currentIndex];
        if (currentItem) currentItem.focus();
        return;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        if (isInSidebar) {
            playChannel(currentIndex);
        } else if (isFocusOnRight || activeElement === video) {
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

window.onload = () => {
    renderChannels();
    playChannel(0); 
    const firstItem = document.querySelector('.channel-item');
    if (firstItem) firstItem.focus();

    setTimeout(() => {
        const splash = document.getElementById('customSplash');
        if (splash) {
            splash.classList.add('hidden');
        }
    }, 2200);
};
