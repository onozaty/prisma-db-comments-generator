FROM node:20-slim

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
  sudo \
  git

# Add node user to sudoers for development container (password-less sudo)
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN mkdir -p /home/node/.claude /home/node/.config/gh && chown -R node:node /home/node/.claude /home/node/.config/gh
