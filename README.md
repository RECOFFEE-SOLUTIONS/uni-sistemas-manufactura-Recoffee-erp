# ReCoffee Solutions - Sistema ERP & MES

Sistema integral de gestión de manufactura, trazabilidad de café, control de calidad, órdenes de producción y telemetría industrial (IIoT) desarrollado para **ReCoffee Solutions**.

---

## 🏛️ Arquitectura del Sistema

El ecosistema está compuesto por tres componentes principales interconectados:

1. **Backend (`/backend`)**: API REST construida en **.NET 8 (ASP.NET Core)** con Entity Framework Core y autenticación JWT.
2. **Frontend (`/frontend`)**: Aplicación web desarrollada en **Next.js 14+** (App Router) con **Tailwind CSS**.
3. **Simulador IIoT (`/iiot-simulator`)**: Módulo en **Python** para la simulación de telemetría de secado (Centro de Trabajo RO-3) e integración con el backend.
4. **Base de Datos (`postgres`)**: Instancia de **PostgreSQL 16 Alpine**.

---

## 🚀 Despliegue con Docker Compose (Recomendado)

### Prerrequisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y en ejecución.
- Soporte para Docker Compose v2.

### 1. Iniciar los servicios principales
Para levantar la base de datos PostgreSQL, el backend en .NET 8 y el frontend en Next.js:

```bash
docker compose up --build -d
```

### 2. Verificar el estado de los contenedores
```bash
docker compose ps
```

### 3. Puntos de acceso
- **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Backend API (.NET 8):** [http://localhost:5000](http://localhost:5000)
- **Documentación Swagger / OpenAPI:** [http://localhost:5000/swagger](http://localhost:5000/swagger)
- **Base de Datos PostgreSQL:** `localhost:5432`
  - Usuario: `postgres`
  - Contraseña: `postgres`
  - Base de datos: `recoffee_db`

### 4. Ejecutar el Simulador IIoT
El simulador se encuentra bajo el perfil `simulator`:

```bash
docker compose --profile simulator up --build iiot-simulator
```

### 5. Detener el entorno
```bash
docker compose down
```
*(Para eliminar también los volúmenes de datos, añadir la bandera `-v`)*:
```bash
docker compose down -v
```

---

## 💻 Desarrollo Local (Sin Docker)

Si prefieres ejecutar los servicios de manera nativa en tu entorno:

### Backend (.NET 8)
```bash
cd backend
dotnet restore
dotnet run
```
*La API estará disponible en `http://localhost:5000` (o el puerto configurado en `Properties/launchSettings.json`).*

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*La aplicación web estará disponible en [http://localhost:3000](http://localhost:3000).*

### Simulador IIoT (Python)
```bash
cd iiot-simulator
python -m venv venv
# En Windows:
.\venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python simulador_secado.py
```

---

## 🌿 Flujo de Trabajo Git y Ramas

Para garantizar la integridad y calidad del código, se sigue una convención estricta:

- `main`: Rama de producción protegida. No se permiten commits directos.
- `feature/WI-[NUMERO]-[descripcion]`: Para nuevas características.
- `fix/WI-[NUMERO]-[descripcion]`: Para correcciones de errores.
- Cada cambio debe asociarse a su respectivo Issue de GitHub:
  ```bash
  git commit -m "feat: [descripción del cambio] (Closes #ID)"
  ```