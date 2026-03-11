# 🧠 Migraine Tracker API (Backend Monolith)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

A robust, modular backend built with NestJS to process environmental data, biorhythms, and personal health logs to help predict and manage migraines. 

This repository serves as the core engine for the [Migraine Tracker Dashboard](https://github.com/wirtaw/migrane-tracker-dashboard). It securely handles sensitive user health data while orchestrating complex data streams from global weather and solar APIs.

## ✨ Key Features

* **🔮 Prediction Engine:** Features a `Pattern Guardian` and `Risk Calculator` that analyze historical logs against environmental factors to forecast migraine risks.
* **🌍 Environmental Integrations:** Automated ingestion of external data including **Open-Meteo** (weather), **NOAA**, **GFZ**, and **Temis** (solar radiation, geo-magnetic activity, UV index).
* **🔐 Secure & Private:** Implements **Supabase Auth** with robust Role-Based Access Control (RBAC) and data encryption to ensure user health data remains strictly confidential.
* **📊 Comprehensive Tracking:** Dedicated modules for tracking `Incidents` (migraines), `Triggers`, `Medications`, and daily `Health Logs`.

Full documentation [here](https://wirtaw.github.io/migraine-tracker-docs/)

## 🏗 Architecture Overview

The app follows a monolithic, highly modular NestJS architecture. Key domains include:
* `src/predictions`: Core logic for risk forecasting and rule generation.
* `src/weather` & `src/solar`: Handlers for external environmental APIs.
* `src/health-logs` & `src/incidents`: Core user CRUD operations.
* `src/auth`: Security, JWT handling, and Supabase integrations.

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [pnpm](https://pnpm.io/) (Package manager)
* [Docker](https://www.docker.com/) & Docker Compose

### Local Setup

1. **Clone the repository:**
```bash
git clone https://github.com/wirtaw/migraine-tracker-monolith.git
cd migraine-tracker-monolith
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Environment Setup:**
Copy the example environment file and fill in your local details (including your Supabase keys and MongoDB URI).

```bash
cp env/.env.example .env
```

4. **Start the Database (Docker):**
Spin up the local MongoDB instance using Docker Compose.

```bash
docker-compose -f docker-compose.local.yml up -d
```

5. **Run the Application:**

```bash
pnpm start:dev
```

The API will now be running at http://localhost:3000.


## 🧪 Testing

We take reliability seriously. The project includes extensive unit and end-to-end (e2e) tests.

```bash
# Unit tests
pnpm test

# End-to-end tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## 🤝 Contributing

Contributions are more than welcome! Whether you're optimizing our prediction algorithms, adding a new weather data source, or fixing a bug, please check out our contributing guidelines. Let's build a tool that helps people reclaim their lives from chronic pain.
