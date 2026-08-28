const channels = [
    {
        "name": "DSports",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg",
        "url": "https://98.domhsd.com/dsports/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=584e5a4639c4430a2a034e32236d88efa1402880-32-1787998471-1787944471"
    },
    {
        "name": "DSports 2",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg",
        "url": "https://193.domhsd.com/dsports2/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=a366f4a2b5e5a2b55ab5970268d2e9e6ffb3b4a3-6c-1787998479-1787944479"
    },
    {
        "name": "DSports +",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg",
        "url": "https://47.domhsd.com/dsportsplus/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=9ea0f4d474482b96bdb6c314ffb0c40c7d2e115e-fe-1787998485-1787944485"
    },
    {
        "name": "ESPN",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg",
        "url": "https://98.domhsd.com/espn/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=086c9ad5fa41d7adc66a886973d453bb1eb2e3f3-92-1787998492-1787944492"
    },
    {
        "name": "ESPN 2",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg",
        "url": "https://93.domhsd.com/espn2/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=aa20d195d46e286d9b5b34fe691094ead3a03592-1f-1787998498-1787944498"
    },
    {
        "name": "ESPN 3",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg",
        "url": "https://193.domhsd.com/espn3/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=f9e0e10a0afb813dcd8a8cb7ab78c3055f535bff-b6-1787998505-1787944505"
    },
    {
        "name": "ESPN Premium",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg",
        "url": "https://98.domhsd.com/espnpremium/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=6ed55937e19a7462ac343d7ad66ac2206ab1fd37-6b-1787998511-1787944511"
    },
    {
        "name": "TNT Sports",
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/3b/TNT_Sports_logo_2017.svg",
        "url": "https://7.domhsd.com/tntsports/tracks-v1a1/mono.m3u8?ip=181.115.161.231&token=9852856b64fdab7d2cc5ed608a64dd4adc491d09-c3-1787998518-1787944518"
    }
];

// ESCUDO ANTI-CIERRE Y ANTI-ANUNCIOS ULTRA-AGRESIVO
window.open = function(url) { return null; };
window.alert = function() {};
window.confirm = function() { return true; };
window.prompt = function() { return ""; };

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
}, true);

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

window.addEventListener('popstate', function(event) {
    window.history.pushState(null, document.title, window.location.href);
}, true);

window.history.pushState(null, document.title, window.location.href);

function renderChannels() {
    const listContainer = document.getElementById('channelsList');
    if (!listContainer) return;
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
    if (overlay) overlay.style.display = 'flex';
    const loadText = document.getElementById('loadingText');
    if (loadText) loadText.innerText = `Cargando ${channel.name}...`;

    showOsd(channel.name);

    setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
    }, 4000);

    video.muted = true; // Forzar silencio inicial para Android WebView
    video.volume = 1.0;

    if (Hls.isSupported()) {
        if (hls) {
            hls.destroy();
        }
        hls = new Hls();
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().then(() => {
                if (overlay) overlay.style.display = 'none';
            }).catch(() => {
                if (overlay) overlay.style.display = 'none';
            });
        });
        hls.on(Hls.Events.ERROR, function(event, data) {
            if (overlay) overlay.style.display = 'none';
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.addEventListener('loadedmetadata', function() {
            video.play().catch(() => {});
        });
    }
}

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

document.addEventListener('keydown', (e) => {
    const activeElement = document.activeElement;
    const isInSidebar = activeElement && activeElement.classList.contains('channel-item');

    const isBackKey = e.key === 'Escape' || 
                      e.key === 'BrowserBack' || 
                      e.keyCode === 8 || 
                      e.keyCode === 461 || 
                      e.code === 'Back' ||
                      e.key === 'GoBack';

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

// ARRANQUE INMEDIATO SIN SPLASH SCREEN
window.onload = () => {
    renderChannels();
    playChannel(0); 
    const firstItem = document.querySelector('.channel-item');
    if (firstItem) firstItem.focus();
};
