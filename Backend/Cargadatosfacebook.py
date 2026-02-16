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
    print(f"🚀 [{datetime.now()}] Iniciando extracción reforzada...")
    
    options = Options()
    # --- CAPA DE PROTECCIÓN ANTI-DETECCIÓN ---
    options.add_argument("--headless=new") # Modo oculto ultra-estable
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage") # Evita que Chrome explote por falta de RAM
    options.add_argument("--disable-notifications")
    # Este User-Agent es clave para durar meses sin bloqueos:
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36")

    driver = None
    conn = None

    try:
        # Instalación/Actualización automática del driver
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        driver.get("https://www.facebook.com/paramedicos.pe")
        print("⏳ Esperando carga inicial (10s)...")
        time.sleep(10)

        # --- LÓGICA DE EXPANSIÓN 'VER MÁS' ---
        try:
            print("🔍 Expandiendo contenido...")
            boton = driver.find_element(By.XPATH, "//div[contains(text(), 'Ver más')]")
            driver.execute_script("arguments[0].click();", boton)
            time.sleep(3)
        except:
            print("ℹ️ Post corto o ya expandido.")

        # --- CAPTURA DE DATOS ---
        posts = driver.find_elements(By.XPATH, "//div[@role='article']")
        
        if posts:
            post = posts[0]
            try:
                # Extraer texto
                texto_raw = post.find_element(By.XPATH, ".//div[@data-ad-comet-preview='message']").text
                contenido = texto_raw.strip()

                # Extraer foto
                try:
                    img_elem = post.find_element(By.XPATH, ".//img[contains(@src, 'scontent')]")
                    foto_url = img_elem.get_attribute('src')
                except:
                    foto_url = "Sin imagen"

                # Metadatos
                id_pub = hashlib.md5(contenido.encode('utf-8')).hexdigest()
                titulo_auto = contenido[:80] + ('...' if len(contenido) > 80 else '')
                fecha_recolecta = datetime.now()

                # --- CARGA A BASE DE DATOS ---
                print(f"📡 Conectando a SQL Server...")
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
                print(f"✅ Éxito: Post '{id_pub[:8]}' procesado.")

            except Exception as e:
                print(f"⚠️ Error al extraer datos del post: {e}")
        else:
            print("❌ No se encontraron publicaciones.")

    except Exception as e:
        print(f"❌ Error crítico: {e}")
    
    finally:
        # Limpieza total de recursos (Vital para aguantar meses)
        if conn:
            conn.close()
        if driver:
            driver.quit()
        print("🏁 Navegador y conexiones cerradas correctamente.")

if __name__ == "__main__":
    escanear_y_guardar_db()