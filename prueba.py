import time
import os
import hashlib
import pyodbc
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager

# =============================================
# CONFIGURACIÓN DE BASE DE DATOS
# =============================================
DB_CONFIG = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=DB_CGPVP2;Trusted_Connection=yes;Encrypt=no;"

def escanear_y_guardar_db():
    print("🚀 Iniciando extracción (Lógica de expansión original)...")
    
    options = Options()
    options.add_argument("--disable-notifications")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    try:
        driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
        driver.get("https://www.facebook.com/laacademiamundialdebomberosinc")
        
        print("⏳ Esperando carga inicial (10s)...")
        time.sleep(10)

        # --- TU LÓGICA ORIGINAL DE EXPANSIÓN ---
        print("🔍 Expandiendo publicación...")
        try:
            # Tal cual lo tenías: clic al primer "Ver más" que aparezca globalmente
            boton = driver.find_element(By.XPATH, "//div[contains(text(), 'Ver más')]")
            driver.execute_script("arguments[0].click();", boton)
            time.sleep(2)
            print("✅ Botón presionado.")
        except:
            print("ℹ️ No se encontró botón 'Ver más' o el post es corto.")

        # --- CAPTURA DEL POST ---
        posts = driver.find_elements(By.XPATH, "//div[@role='article']")
        
        if posts:
            post = posts[0] # El más reciente
            
            try:
                # 1. Extraer texto (Ahora vendrá completo gracias al clic previo)
                texto = post.find_element(By.XPATH, ".//div[@data-ad-comet-preview='message']").text
                contenido = texto.strip()

                # 2. Extraer foto
                try:
                    img_elem = post.find_element(By.XPATH, ".//img[contains(@src, 'scontent')]")
                    foto_url = img_elem.get_attribute('src')
                except:
                    foto_url = "Sin imagen"

                # 3. Metadatos para SQL
                titulo_auto = contenido[:80] + ('...' if len(contenido) > 80 else '')
                id_pub = hashlib.md5(contenido.encode('utf-8')).hexdigest()
                fecha_recolecta = datetime.now()

                # --- CONEXIÓN A SQL SERVER ---
                print(f"📡 Insertando en DB_CGPVP2...")
                conn = pyodbc.connect(DB_CONFIG)
                cursor = conn.cursor()

                cursor.execute("""
                    EXEC SP_INSERTAR_ACTUALIZAR_PUBLICACION 
                        @idpublicacion = ?, 
                        @titulo = ?, 
                        @contenido = ?, 
                        @foto = ?, 
                        @fecha = ?,
                        @creado_por = 'Facebook'
                """, (id_pub, titulo_auto, contenido, foto_url, fecha_recolecta))
                
                conn.commit()
                conn.close()
                print(f"✅ ¡Guardado con éxito! Título: {titulo_auto[:40]}...")

            except Exception as e:
                print(f"⚠️ Error al extraer datos del post: {e}")
        else:
            print("❌ No se encontraron artículos.")

    except Exception as e:
        print(f"❌ Error crítico: {e}")
    finally:
        if 'driver' in locals():
            driver.quit()
        print("🏁 Proceso terminado.")

if __name__ == "__main__":
    escanear_y_guardar_db()