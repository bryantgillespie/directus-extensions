# Development Guide

## Setup

Install dependencies:
```sh
pnpm install
```

## Development Environment

A Docker-based dev environment is included. Requires mkcert and Docker.

1. Add `127.0.0.1 extensions.local` to `/etc/hosts`
2. Run `pnpm mkcert` to generate TLS files
3. Run `docker compose up -d`

Navigate to <https://extensions.local> and login with:
- Email: `admin@directus.dev`
- Password: `password`

Extensions auto-reload on code changes. Hard refresh browser if needed.
