FROM python:3.12-slim AS base

WORKDIR /app

# System deps for OpenCV / headless rendering
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 curl \
#     && rm -rf /var/lib/apt/lists/*

# Install Python deps (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download YOLO model if not present
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')" || true

EXPOSE 8000

# Entrypoint: run migrations then start the server
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
