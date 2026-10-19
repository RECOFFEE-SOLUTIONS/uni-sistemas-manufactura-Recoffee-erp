"""
Simulador IIoT de Secado Solar (RO-3) - ReCoffee Solutions ERP & MES
-------------------------------------------------------------------
Simula el proceso de deshidratación solar controlada en la cama de secado (RO-3).
- Modelo cinético de descenso logarítmico de humedad: de 65.0% inicial a <= 20.0% objetivo.
- Variaciones térmicas diurnas realistas (efecto invernadero solar 22°C - 45°C).
- Modo Acelerado: 32 iteraciones (1 segundo = 1 hora de secado real).
- Emisión de telemetría HTTP POST hacia el webhook .NET del ERP.
"""

import os
import sys
import time
import math
import random
import json
from datetime import datetime, timezone

try:
    import requests
except ImportError:
    print("Error: El módulo 'requests' no está instalado. Ejecuta: pip install requests")
    sys.exit(1)

# Configuración por defecto
DEFAULT_API_URL = os.getenv("API_URL", "http://localhost:5000/api/iiot/telemetry")
SENSOR_ID = os.getenv("SENSOR_ID", "SENSOR-RO3-SOLAR-01")
TOTAL_HOURS = 32
ACCELERATED_SLEEP_SEC = float(os.getenv("CYCLE_SLEEP_SEC", "1.0")) # 1 seg = 1 hora real

def fetch_active_lot_from_backend(base_api_url: str):
    """
    Intenta obtener el número de lote y orden de producción activa en el ERP.
    """
    try:
        # Extraer host base (ej. http://localhost:5000)
        base_host = base_api_url.split("/api")[0] if "/api" in base_api_url else "http://localhost:5000"
        orders_url = f"{base_host}/api/production/orders"
        resp = requests.get(orders_url, timeout=3)
        if resp.status_code == 200:
            orders = resp.json()
            # Buscar orden en proceso
            in_process = next((o for o in orders if o.get("status") == "En Proceso"), None)
            if in_process:
                lot = in_process.get("lotNumber")
                order_id = in_process.get("id")
                order_num = in_process.get("orderNumber")
                if lot:
                    print(f"[IIoT Auto-Detect] Orden activa detectada: {order_num} (ID: {order_id}), Lote: {lot}")
                    return lot, order_id, order_num
    except Exception as e:
        pass
    return None, None, None

def simulate_drying_cycle(api_url: str = DEFAULT_API_URL, custom_lot: str = None):
    print("=" * 75)
    print("  RECOFFEE SOLUTIONS — SIMULADOR IIOT DE SECADO SOLAR (RO-3)")
    print("=" * 75)
    print(f" Webhook Destino    : {api_url}")
    print(f" Identificador Sensor: {SENSOR_ID}")
    print(f" Modo Acelerado     : {TOTAL_HOURS} ciclos (1 seg = 1 hora real)")
    print(f" Parámetros Objetivo: Humedad Inicial: 65.0% -> Humedad Final: <= 20.0%")
    print("=" * 75)

    # Detectar o configurar Lote
    lot_number = custom_lot
    order_id = None
    if not lot_number:
        detected_lot, detected_id, _ = fetch_active_lot_from_backend(api_url)
        if detected_lot:
            lot_number = detected_lot
            order_id = detected_id
        else:
            today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
            lot_number = f"LOTE-PT-001-{today_str}-001"

    print(f" Lote Asignado al Sensor: {lot_number}")
    print("-" * 75)

    # Parámetros del modelo cinético logarítmico (Page / Henderson-Pabis model)
    # M(t) = Me + (M0 - Me) * exp(-k * t)
    # M0 = 65.0%, Me (humedad de equilibrio ambiental en solar) = 14.0%
    # Para t = 31 h, M(31) <= 20.0% => k ~= 0.07185
    m_0 = 65.0
    m_e = 14.0
    k_rate = 0.07185

    success_count = 0
    fail_count = 0

    for hour in range(TOTAL_HOURS):
        step_number = hour + 1

        # 1. Cálculo de Descenso Logarítmico de Humedad
        # Agregamos pequeña variabilidad física estocástica (microclima en lecho)
        noise_m = random.uniform(-0.15, 0.15)
        ideal_moisture = m_e + (m_0 - m_e) * math.exp(-k_rate * hour)
        current_moisture = round(max(17.5, min(65.0, ideal_moisture + noise_m)), 2)

        # 2. Cálculo de Variación Térmica Diurna en Cama Solar
        # Ciclo solar de 24 horas: amanecer 06:00 (22°C), mediodía 13:00 (pico ~42°C-45°C), noche 22°C-24°C
        hour_of_day = (hour + 8) % 24 # Simular inicio de jornada a las 08:00 AM
        solar_factor = math.sin((hour_of_day - 6) * math.pi / 12) if 6 <= hour_of_day <= 18 else -0.3
        base_temp = 25.0 + (18.0 * max(0.0, solar_factor)) # De 25°C a 43°C
        noise_t = random.uniform(-1.0, 1.0)
        current_temp = round(base_temp + noise_t, 2)

        # 3. Construir Payload Oficial de Telemetría
        iso_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        payload = {
            "productionOrderId": order_id,
            "lotNumber": lot_number,
            "operationCode": "RO-3",
            "workCenter": "RO-3",
            "sensorId": SENSOR_ID,
            "temperatureCelsius": current_temp,
            "moisturePercent": current_moisture,
            "timestamp": iso_timestamp,
            "step": step_number,
            "totalSteps": TOTAL_HOURS
        }

        # 4. Transmisión HTTP POST hacia el Webhook .NET
        status_msg = ""
        try:
            resp = requests.post(
                api_url,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
                timeout=4
            )
            if resp.status_code in (200, 201):
                success_count += 1
                status_msg = f"[HTTP {resp.status_code} OK]"
            else:
                fail_count += 1
                status_msg = f"[HTTP {resp.status_code} Error: {resp.text[:60]}]"
        except Exception as ex:
            fail_count += 1
            status_msg = f"[Conexión Fallida: {type(ex).__name__}]"

        # Barra de progreso visual
        progress_pct = int((step_number / TOTAL_HOURS) * 100)
        bar = "█" * (progress_pct // 5) + "░" * (20 - (progress_pct // 5))

        target_flag = "🎯 META ALCANZADA (<=20%)" if current_moisture <= 20.0 else ""
        print(f" Hora {step_number:02d}/{TOTAL_HOURS:02d} [{bar}] {progress_pct:3d}% | "
              f"Humedad: {current_moisture:5.2f}% | Temp: {current_temp:5.2f}°C | {status_msg} {target_flag}")

        # Retardo acelerado (1 segundo por hora de secado)
        time.sleep(ACCELERATED_SLEEP_SEC)

    print("=" * 75)
    print("  RESUMEN DE CICLO DE SECADO SOLAR (RO-3)")
    print("=" * 75)
    print(f" Total de Horas Simuladas : {TOTAL_HOURS} h ({TOTAL_HOURS * ACCELERATED_SLEEP_SEC:.1f} s)")
    print(f" Humedad Inicial          : {m_0:.2f}%")
    print(f" Humedad Final Obtenida   : {current_moisture:.2f}% (Objetivo de Calidad Cumplido)")
    print(f" Transmisiones Exitosas   : {success_count} / {TOTAL_HOURS}")
    if fail_count > 0:
        print(f" Advertencia              : {fail_count} transmisiones fallidas (verificar si backend está activo)")
    print("=" * 75)

if __name__ == "__main__":
    url_arg = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_API_URL
    lot_arg = sys.argv[2] if len(sys.argv) > 2 else None
    simulate_drying_cycle(api_url=url_arg, custom_lot=lot_arg)
