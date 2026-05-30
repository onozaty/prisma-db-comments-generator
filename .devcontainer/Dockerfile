FROM node:24-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable \
  && corepack prepare pnpm@10.34.1 --activate

RUN apt-get update && apt-get install -y --no-install-recommends \
  sudo \
  git \
  && rm -rf /var/lib/apt/lists/*

# Add node user to sudoers for development container (password-less sudo)
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN mkdir -p /home/node/.claude /home/node/.config/gh && chown -R node:node /home/node/.claude /home/node/.config/gh
