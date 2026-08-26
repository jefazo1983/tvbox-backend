import asyncio
import json
from playwright.async_api import async_playwright

# Tu lista de canales con su nombre visual y el slug de la web
canales_a_escanear = [
    {"nombre": "DSports", "slug": "dsports"},
    {"nombre": "DSports 2", "slug": "dsports2"},
    {"nombre": "DSports +", "slug": "dsportsplus"},
    {"nombre": "ESPN", "slug": "espn"},
    {"nombre": "ESPN 2", "slug": "espn2"},
    {"nombre": "ESPN 3", "slug": "espn3"},
    {"nombre": "ESPN Premium", "slug": "espnpremium"},
    {"nombre": "TNT Sports", "slug": "tntsports"},
]


async def run():
    async with async_playwright() as p:
        # Iniciamos el navegador en segundo plano (headless=True)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()

        resultados_canales = []

        print("🚀 Iniciando escaneo masivo de canales...")

        for canal in canales_a_escanear:
            nombre = canal["nombre"]
            slug = canal["slug"]
            url_pagina = f"https://futbollibretv.sx/canal.html?canal={slug}"

            print(f"\n🔍 Buscando: {nombre}...")
            page = await context.new_page()

            encontrado_m3u8 = None

            # Interceptamos las peticiones de red de esta pestaña específica
            def handle_request(request):
                nonlocal encontrado_m3u8
                if ".m3u8" in request.url:
                    encontrado_m3u8 = request.url

            page.on("request", handle_request)

            try:
                # Entramos a la página del canal
                await page.goto(url_pagina, timeout=40000)

                # Esperamos 5 segundos para que cargue el reproductor y dispare el stream
                await asyncio.sleep(5)

                if encontrado_m3u8:
                    print(f"   ✅ ¡Éxito! Enlace capturado.")
                    resultados_canales.append({"name": nombre, "url": encontrado_m3u8})
                else:
                    print(f"   ❌ No se pudo capturar el enlace para {nombre}.")

            except Exception as e:
                print(f"   ⚠️ Error al procesar {nombre}: {e}")
            finally:
                await page.close()

        await browser.close()

        # Guardamos los resultados asegurando la correcta escritura de la variable JavaScript
        variable_nombre = "const channels"
        datos_json = json.dumps(resultados_canales, indent=4, ensure_ascii=False)
        contenido_js = f"{variable_nombre} = {datos_json};"
        
        with open("channels.js", "w", encoding="utf-8") as f:
            f.write(contenido_js)

        print(
            "\n✨ ¡Escaneo finalizado con éxito! Archivo 'channels.js' "
            "generado correctamente."
        )


asyncio.run(run())
