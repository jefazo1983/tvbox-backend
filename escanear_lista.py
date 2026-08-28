import asyncio
import json
import os
from playwright.async_api import async_playwright

# Tu lista de canales con su nombre, slug y su logo oficial asignado
canales_a_escanear = [
    {
        "nombre": "DSports", 
        "slug": "dsports", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg"
    },
    {
        "nombre": "DSports 2", 
        "slug": "dsports2", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg"
    },
    {
        "nombre": "DSports +", 
        "slug": "dsportsplus", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/4/45/Directv_Sports_logo_2020.svg"
    },
    {
        "nombre": "ESPN", 
        "slug": "espn", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg"
    },
    {
        "nombre": "ESPN 2", 
        "slug": "espn2", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg"
    },
    {
        "nombre": "ESPN 3", 
        "slug": "espn3", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg"
    },
    {
        "nombre": "ESPN Premium", 
        "slug": "espnpremium", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/ESPN_logo.svg"
    },
    {
        "nombre": "TNT Sports", 
        "slug": "tntsports", 
        "logo": "https://upload.wikimedia.org/wikipedia/commons/3/3b/TNT_Sports_logo_2017.svg"
    },
]

async def run():
    dir_actual = os.path.dirname(os.path.abspath(__file__))
    archivo_destino = os.path.join(dir_actual, "channels.js")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        print("🚀 Iniciando escaneo masivo de canales y logos...")
        nuevas_urls = {}

        for canal in canales_a_escanear:
            nombre = canal["nombre"]
            slug = canal["slug"]
            url_pagina = f"https://futbollibretv.sx/canal.html?canal={slug}"

            print(f"\n🔍 Buscando: {nombre}...")
            page = await context.new_page()
            encontrado_m3u8 = None

            def handle_request(request):
                nonlocal encontrado_m3u8
                if ".m3u8" in request.url:
                    encontrado_m3u8 = request.url

            page.on("request", handle_request)

            try:
                await page.goto(url_pagina, timeout=40000)
                await asyncio.sleep(5)

                if encontrado_m3u8:
                    print(f"   ✅ ¡Éxito! Enlace capturado.")
                    nuevas_urls[nombre] = encontrado_m3u8
                else:
                    print(f"   ❌ No se pudo capturar el enlace para {nombre}.")
            except Exception as e:
                print(f"   ⚠️ Error al procesar {nombre}: {e}")
            finally:
                await page.close()

        await browser.close()

        # Construimos la lista final estructurada con name, logo y url
        datos_finales = []
        for canal in canales_a_escanear:
            nombre = canal["nombre"]
            logo = canal["logo"]
            # Si capturó una nueva URL la usa, si falló deja un texto vacío o mantiene la estructura
            url = nuevas_urls.get(nombre, "") 
            
            datos_finales.append({
                "name": nombre,
                "logo": logo,
                "url": url
            })

        # Escribimos el archivo channels.js perfectamente formateado para tu app.js
        variable_nombre = "const channels"
        datos_json = json.dumps(datos_finales, indent=4, ensure_ascii=False)
        contenido_js = f"{variable_nombre} = {datos_json};"
        
        archivo_existia = os.path.exists(archivo_destino)

        with open(archivo_destino, "w", encoding="utf-8") as f:
            f.write(contenido_js)

        print("\n" + "="*50)
        if archivo_existia:
            print(f"🔄 Archivo 'channels.js' **REEMPLAZADO** con URLs y Logos correctos.")
        else:
            print(f"📄 Archivo 'channels.js' **CREADO** con URLs y Logos correctos.")
        print(f"📊 Tamaño del archivo: {os.path.getsize(archivo_destino)} bytes.")
        print(f"✨ ¡Todo listo para usar en la TV Box!")
        print("="*50)

asyncio.run(run())
