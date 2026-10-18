import os
import time
import requests
import json

API_URL = os.getenv("API_URL", "http://backend:5000/api/telemetry")

def simulate():
    print(f"Iniciando simulador IIoT de secado RO-3...")
    print(f"Destino de telemetría: {API_URL}")
    start_moisture = 65.0
    end_moisture = 20.0
    total_steps = 32
    step_diff = (start_moisture - end_moisture) / (total_steps - 1)

    for i in range(total_steps):
        current_moisture = round(start_moisture - (i * step_diff), 2)
        payload = {
            "workCenter": "RO-3",
            "operation": "Secado",
            "step": i + 1,
            "totalSteps": total_steps,
            "moisture": current_moisture,
            "temperature": round(60.0 + (i * 0.5), 1),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        print(f"[{i+1}/{total_steps}] Humedad: {current_moisture}%, Temp: {payload['temperature']}°C")
        try:
            resp = requests.post(API_URL, json=payload, timeout=5)
            print(f"  -> Respuesta API: {resp.status_code}")
        except Exception as ex:
            print(f"  -> Servidor no disponible o endpoint aún no implementado ({type(ex).__name__})")
        time.sleep(1)

    print("Simulación de secado RO-3 completada exitosamente.")

if __name__ == "__main__":
    simulate()
