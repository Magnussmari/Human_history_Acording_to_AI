# Human History AI - Optimized Docker Image
# Python-based, direct Anthropic API, tiered model selection

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    jq \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user matching host UID
RUN groupadd -g 1002 historian && \
    useradd -u 1002 -g 1002 -m -s /bin/bash historian

WORKDIR /workspace

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python modules to scripts directory
COPY scripts/ /workspace/scripts/

# Create necessary directories
RUN mkdir -p outputs/json outputs/logs state/lock state/cache && \
    chown -R historian:historian /workspace

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

USER historian

HEALTHCHECK --interval=5m --timeout=30s --start-period=10s --retries=3 \
    CMD python3 -c "import json; f=open('/workspace/state/progress.json'); d=json.load(f); print(f\"OK: {len(d['completed'])}\")" || exit 1

CMD ["python3", "/workspace/scripts/orchestrator_optimized.py", "--parallel", "5", "--interval", "60", "--batch-size", "5"]
