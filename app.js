// ESCUDO ANTI-CIERRE Y ANTI-ANUNCIOS REFORZADO
window.open = function(url) { 
    console.log("Intento de apertura bloqueado:", url);
    return null; 
};
window.alert = function() {};
window.confirm = function() { return true; };

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

document.addEventListener('click', function(e) {
    let target = e.target.closest('a, area');
    if (target) {
        let href = target.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Enlace publicitario neutralizado:", href);
        }
    }
}, true);

let currentIndex = 0;
let hls = null;
let isFullscreen = false;
let lastBackPress = 0;
const video = document.getElementById('videoPlayer');
const overlay = document.getElementById('loadingOverlay');
const osd = document.getElementById('zappingOsd');

function renderChannels() {
    const listContainer = document.getElementById('channelsList');
    listContainer.innerHTML = '';
    channels.forEach((channel, index) => {
        const item = document.createElement('div');
        item.className = `channel-item ${index === currentIndex ? 'active' : ''}`;
        item.tabIndex = 0;
        
        item.innerHTML = `
            <img src="${channel.logo}" class="channel-logo" alt="${channel.name}" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg'">
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
    if (index < 0) index = channels.length - 1;
    if (index >= channels.length) index = 0;
    currentIndex = index;

    updateActiveChannelUI();
    
    const items = document.querySelectorAll('.channel-item');
    if (items[currentIndex]) {
        items[currentIndex].focus();
    }

    const channel = channels[currentIndex];
    overlay.style.display = 'flex';
    document.getElementById('loadingText').innerText = `Cargando ${channel.name}...`;

    showOsd(channel.name);

    video.onplaying = () => { overlay.style.display = 'none'; };
    video.oncanplay = () => { overlay.style.display = 'none'; };

    video.muted = false;
    video.volume = 1.0;

    if (Hls.isSupported()) {
        if (hls) {
            hls.destroy();
        }
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(e => {
                video.muted = true;
                video.play().then(() => {
                    video.muted = false;
                });
            });
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(() => {
                video.muted = true;
                video.play().then(() => { video.muted = false; });
            });
        });
    }
}

let osdTimeout;
function showOsd(text) {
    osd.innerText = text;
    osd.style.display = 'block';
    clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
        osd.style.display = 'none';
    }, 2500);
}

// ==========================================================
// BLOQUEO DE ENLACES EXTERNOS
// ==========================================================
document.addEventListener('click', function(e) {
    let target = e.target.closest('a');
    if (target) {
        let href = target.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith(window.location.origin)) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Intento de redirección externa bloqueado:", href);
        }
    }
}, true);


// ==========================================================
// 2. CONTROL REMOTO INTELIGENTE (MEJORADO PARA BOTÓN BACK)
// ==========================================================
document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    const isInSidebar = activeElement && activeElement.classList.contains('channel-item');

    // Detección universal del botón Back / Atrás en TV Box y Navegadores
    const isBackKey = e.key === 'Escape' || 
                      e.key === 'BrowserBack' || 
                      e.keyCode === 8 || 
                      e.keyCode === 461 || 
                      e.code === 'Back';

    if (isBackKey) {
        // Bloqueamos por completo el comportamiento predeterminado del sistema
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        if (isFullscreen) {
            // Si estás viendo el video en pantalla completa, el primer "Atrás" solo sale de la pantalla completa
            toggleFullscreen();
        } else {
            // Si estás en el menú principal, exige un doble toque rápido (menos de 900 milisegundos)
            const currentTime = new Date().getTime();
            if (currentTime - lastBackPress < 900) {
                // Segundo toque rápido: permite salir de la app de forma limpia
                try {
                    window.location.href = 'about:blank';
                } catch(err) {}
                window.close();
            } else {
                // Primer toque: activa la alerta y guarda el tiempo
                lastBackPress = currentTime;
                showOsd("Presiona Atrás nuevamente para salir de la App");
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

setInterval(() => {
    const elements = document.querySelectorAll('iframe, div[id*="google_ads"], ins.adsbygoogle, div[style*="z-index: 2147483647"]');
    elements.forEach(el => {
        if (el !== video && !el.contains(video)) {
            el.remove();
        }
    });
}, 400);

window.onload = () => {
    renderChannels();
    
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
        }, 600);

        playChannel(0); 
        const firstItem = document.querySelector('.channel-item');
        if (firstItem) firstItem.focus();
    }, 2200);
};