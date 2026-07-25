# Lula Platform

Monorepo workspace containing a user application, backend services, shared packages, and deployment guides.

## Overview

The project brings application services, real-time communication, notifications, billing-related workflows, and shared TypeScript utilities into one workspace.

## Technology

`JavaScript` `TypeScript` `Node.js` `React Native` `MongoDB` `Docker` `Monorepo`

## Repository layout

- `lula-monorepo/apps/user-app` — user-facing application and client services
- `lula-monorepo/apps/backend` — backend application and service integrations
- `lula-monorepo/packages` — shared configuration, types, and utilities
- `MONGODB_SETUP.md` — database setup notes
- `docker-compose.yml` — local service orchestration

## Getting started

```bash
cd lula-monorepo
npm install
```

Use the environment example and the deployment guides for the required service configuration. Keep API keys, database credentials, and provider tokens out of commits.

## Status

This project is an evolving platform workspace. Read the current deployment and setup documentation before running production-related commands.

## Organization

Built and maintained by [EA Soft Lab](https://github.com/workeainc).
