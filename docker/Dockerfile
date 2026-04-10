FROM ubuntu:24.04

# System deps
RUN apt-get update && apt-get install -y \
    curl git jq bc coreutils bash \
    nodejs npm \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create non-root user matching host UID (avoid 'daemon' - taken by Ubuntu)
RUN groupadd -g 1002 historian && \
    useradd -u 1002 -g 1002 -m -s /bin/bash historian

# Working directory
WORKDIR /workspace

# Copy project files
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER historian

ENTRYPOINT ["/entrypoint.sh"]
