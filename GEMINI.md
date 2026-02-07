# Gemini Project Context: Migraine Tracker Monolith

## Project Overview

A NestJS-based monolith for tracking migraine incidents and correlating them
with external factors like weather and solar activity.

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Database:** MongoDB (via Mongoose)
- **Documentation:** Swagger (OpenAPI)

## Core Domains

- **Auth:** User authentication and authorization
- **Health Logs:** Daily health status monitoring
- **Incidents:** Main migraine event logging
- **Locations:** User location tracking
- **Medications:** Medication management
- **Solar Weather:** Integration with GFZ, NOAA, and TEMIS
- **Symptoms:** Symptom cataloging and tracking
- **Triggers:** Migraine trigger cataloging
- **Users:** User profile management
- **Weather:** Weather data integration

## Operational Rules (Antigravity Skills)

1. **Formatting:** Always run `pnpm format` after implementation.
2. **Dependencies:** Use `pnpm` exclusively; never use `npm` or `yarn`.
3. **Testing:** - Avoid `pnpm test` globally due to current memory leakage
   issues.
   - Run specific test files only with prior agreement.
   - Always run tests with `NODE_ENV=test` to use in-memory MongoDB.
4. **Error Handling:** Use the global `AllExceptionsFilter` for consistent API
   responses.
5. **Logging:** Use the global `Logger` for consistent logging.
6. **Documentation:** Use the global `SwaggerModule` for consistent API
   documentation.

## Historical Plan & Task Progress

### Implemented Modules

- **Auth**
- **Config**
- **Health Logs**
- **Incidents**
- **Locations**
- **Medications**
- **Solar**
- **Symptoms**
- **Triggers**
- **Users**
- **Weather**

### In Progress

- **Correlation Engine**
- **Health Data** (Enhancements)
