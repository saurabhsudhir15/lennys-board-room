# --- Stage 1: build the frontend with npm ---
# bun.lock exists but bun's aggressive parallel fetching hit unresolved network
# issues in this environment; npm with --legacy-peer-deps is what's actually
# verified working (see TanStack Start / Lovable config peer-dep conflict).
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# --- Stage 2: run the FastAPI backend, serving the built frontend as static files ---
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py board.py config.py ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Render (and most PaaS hosts) assign the port dynamically via $PORT —
# shell form so the variable actually expands, with 8081 as a local-run fallback.
ENV PORT=8081
EXPOSE 8081
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
