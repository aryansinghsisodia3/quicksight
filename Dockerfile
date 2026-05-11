# Backend API for YOLOv8 detection (image/video/webcam stream).
# Build: docker build -t yolov8-api .
# Run:   docker run --rm -p 5000:5000 yolov8-api
#
# For production, put this behind HTTPS (reverse proxy or your platform's edge).

FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY yolov8m.pt .
COPY yolo/ ./yolo/
COPY app.py .

RUN mkdir -p uploads static/outputs

ENV PYTHONUNBUFFERED=1
EXPOSE 5000

# Single worker + threads: one model in memory; timeout 0 keeps MJPEG streams alive.
CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5000", "--threads", "8", "--timeout", "0", "app:app"]
