# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

# Install system dependencies for dlib/face_recognition
# This layer is cached unless the apt-get commands change
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------- Stage: dependencies ----------
# Copy ONLY requirements.txt so this layer is only rebuilt
# when dependencies actually change
FROM base AS dependencies

COPY requirements.txt .

# Use BuildKit cache mount for pip so downloaded wheels/packages
# are persisted across builds. This is the KEY optimization:
# even if this layer re-runs, pip won't re-download everything.
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# ---------- Stage: final ----------
FROM dependencies AS final

# Copy application code — only this layer is rebuilt
# when your source code changes
COPY . .

# Expose port
ENV PORT=5000
EXPOSE 5000

# Start with gunicorn
CMD ["sh", "-c", "gunicorn app:app --bind 0.0.0.0:${PORT:-5000} --workers 2 --timeout 120"]
