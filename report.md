# Synthea - Intelligent Medical Platform: Code Review Report

**Date:** 2026-04-02
**Scope:** Full backend codebase analysis (frontend not yet implemented)
**Reviewed:** Architecture, all controllers, services, middleware, schema, config, Docker setup

---

## Executive Summary

The Synthea backend has a solid foundation: clean MVC architecture, TypeScript strict mode, Prisma ORM, JWT authentication with role-based access, and GDPR audit logging. However, the project has significant gaps that must be addressed before any real-world deployment, particularly around **input validation**, **testing**, and **security hardening**. Below is a detailed breakdown.

---

## 1. Readability

### Strengths
- Consistent file naming: `*.controller.ts`, `*.routes.ts`, `*.service.ts`, `*.middleware.ts`
- Clear separation of imports at the top of every file
- Good use of section dividers (`// ─── Section ───`) in `index.ts` and `schema.prisma`
- Prisma schema has inline comments explaining every model and relationship
- API testing guide (`documentation/api_testing_guide.md`) is thorough at 710+ lines

### Issues

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| R1 | Controllers use raw `req.body` destructuring with no inline documentation of expected shape | All controllers | Medium |
| R2 | Magic numbers scattered in code: `12` (bcrypt rounds), `30` (slot duration), `8`/`18` (work hours), `5` (take limit) | `auth.controller.ts:35`, `appointment.service.ts` | Medium |
| R3 | Mixed language in stubs (Romanian responses, English code) without a clear i18n strategy | `ai.service.ts:48`, `ai.service.ts:69` | Low |
| R4 | `updateInvoice` and `updatePatient` accept `req.body` as-is with `data: req.body` -- unclear what fields are allowed | `billing.controller.ts:66`, `patient.controller.ts:80` | Medium |

### Recommendations
- Extract magic numbers into named constants (e.g., `BCRYPT_ROUNDS = 12`, `SLOT_DURATION_MIN = 30`)
- Add a brief JSDoc or type annotation on each controller listing the expected request body shape
- Establish an i18n strategy early (even if it's just "all user-facing strings go through a single module")

---

## 2. Structure

### Strengths
- Clean layered architecture: Routes -> Controllers -> Services -> Prisma
- Singleton pattern for Prisma client (`config/database.ts`) and Winston logger (`config/logger.ts`)
- Middleware applied selectively per route (not globally), keeping auth requirements explicit
- Prisma schema uses `@@map()` for clean SQL table names

### Issues

| # | Issue | Severity |
|---|-------|----------|
| S1 | No validation layer -- `zod` and `express-validator` are installed as dependencies but never used anywhere | High |
| S2 | No shared types/DTOs for request/response -- each controller parses `req.body` ad-hoc | Medium |
| S3 | `createMedicalRecord` spreads `...req.body` directly into Prisma, allowing arbitrary fields | High |
| S4 | No `uploads/` directory creation or static file serving configured -- OCR file storage path exists only in `.env.example` | Medium |
| S5 | `docker-compose.yml` references a `frontend` service that doesn't exist, causing build failures | Low |
| S6 | No shared pagination utility -- pagination logic (`skip`, `take`, `parseInt`) is duplicated across 4+ controllers | Low |

### Recommendations
- Create a `validators/` directory with Zod schemas for every endpoint, or use express-validator middleware in routes
- Create shared DTOs (`types/`) that define request and response shapes
- Replace `...req.body` spreads with explicit field picks
- Add a shared `parsePagination(query)` utility to eliminate duplication
- Comment out or remove the frontend service from `docker-compose.yml` until it exists

---

## 3. Consistency

### Strengths
- All controllers follow the same `async (req, res, next) => { try { ... } catch (err) { next(err) } }` pattern
- All routes use the same `authenticate` + `authorize()` middleware chain
- Error responses are consistently structured via `ApiError` + `errorHandler`
- Prisma models all use `uuid()` IDs, `createdAt`, and `updatedAt`

### Issues

| # | Issue | Severity |
|---|-------|----------|
| C1 | `deletePatient` does a hard delete, but `User` uses soft delete (`isActive` flag) -- inconsistent deletion strategy | High |
| C2 | Pagination response shape differs: some return `{ data, total, page, limit }`, medical records returns a flat array | Medium |
| C3 | Some controllers validate required fields (`if (!lineItems) throw ...`), most don't -- inconsistent input checking | Medium |
| C4 | `generateTokens` uses `process.env.JWT_SECRET!` with non-null assertion -- could crash at runtime if env is missing | Medium |
| C5 | GDPR logger runs before authentication middleware resolves, so `req.user` is often `undefined` on the first pass | Medium |

### Recommendations
- Decide on soft delete everywhere or hard delete everywhere -- for a medical platform, soft delete is strongly recommended
- Standardize all list endpoints to return `{ data, total, page, limit }`
- Move all env variable access into a validated config module that fails fast at startup
- Ensure GDPR middleware runs after `authenticate` in the middleware chain, or adjust the check

---

## 4. Performance

### Strengths
- `Promise.all()` used for parallel count + fetch queries in paginated endpoints
- Prisma's `select` used to limit returned fields (e.g., `user: { select: { firstName, lastName } }`)
- Rate limiting (100 req/15min) prevents basic abuse

### Issues

| # | Issue | Severity |
|---|-------|----------|
| P1 | `authenticate` middleware queries the database on **every single request** to check `isActive` -- no caching | High |
| P2 | No database indexes on frequently queried columns: `appointment.scheduledAt`, `appointment.doctorId`, `invoice.status`, `auditLog.timestamp` | High |
| P3 | `getAvailableSlots` generates slots in-memory by iterating the full workday and filtering -- won't scale with many doctors | Medium |
| P4 | Review creation recalculates `avgRating` with `aggregate()` on every insert instead of maintaining a running average | Low |
| P5 | GDPR audit logging is `await`ed synchronously -- adds latency to every sensitive request | Medium |
| P6 | No response compression (`compression` middleware not installed) | Low |
| P7 | No Redis/caching layer for repeated queries (doctor listings, available slots) | Medium |

### Recommendations
- Add composite indexes in Prisma schema: `@@index([doctorId, scheduledAt])` on Appointment, `@@index([status])` on Invoice, `@@index([timestamp])` on AuditLog
- Cache the `isActive` check in JWT claims or use a short-TTL Redis cache
- Fire GDPR audit log asynchronously (fire-and-forget with `.catch()` already partially done, but the `await` is still blocking)
- Install and use the `compression` middleware
- Consider Redis for session data and frequently-read listings

---

## 5. Maintainability

### Strengths
- TypeScript strict mode catches type errors at compile time
- Prisma migrations provide reproducible schema changes
- Docker Compose allows one-command dev environment setup
- Centralized error handling prevents error format fragmentation

### Issues

| # | Issue | Severity |
|---|-------|----------|
| M1 | **Zero test coverage** -- no unit tests, integration tests, or e2e tests exist. `npm test` and `npm run lint` are defined but not configured | Critical |
| M2 | No ESLint or Prettier configuration -- code style will drift as team grows | High |
| M3 | No CI/CD pipeline (no `.github/workflows/`, no pre-commit hooks) | High |
| M4 | `seed.ts` references `prisma.patient` which doesn't exist -- should be `prisma.patientProfile`. This will crash on `npm run prisma:seed` | Medium |
| M5 | No environment validation at startup -- missing `JWT_SECRET` causes a runtime crash instead of a clear error message | Medium |
| M6 | Stub services have no interface/contract -- when real implementations replace them, there's no guarantee of API compatibility | Medium |

### Recommendations
- **Priority 1:** Set up Jest with at least unit tests for auth (token generation, password hashing) and billing (payment flow)
- **Priority 2:** Add ESLint + Prettier with a shared config. Add a pre-commit hook via Husky + lint-staged
- **Priority 3:** Create a CI pipeline (GitHub Actions) that runs lint, type-check, and tests on every PR
- Fix `seed.ts` to use `prisma.patientProfile`
- Create a `config/env.ts` module that validates all required env vars at startup with Zod
- Define TypeScript interfaces for each service so stubs and real implementations share a contract

---

## 6. Security

### Strengths
- JWT with short-lived access tokens (15min) and long-lived refresh tokens (7d)
- bcrypt with 12 salt rounds for password hashing
- Helmet.js for HTTP security headers
- CORS restricted to a single origin
- Rate limiting on all API routes
- Prisma parameterized queries prevent SQL injection
- GDPR audit trail for PHI access
- `isActive` soft-delete prevents deactivated users from logging in

### Critical Issues

| # | Issue | Severity |
|---|-------|----------|
| SEC1 | **No input validation at all** -- any JSON body is accepted and passed to Prisma. While Prisma prevents SQL injection, invalid/malicious data can still be stored | Critical |
| SEC2 | **No password strength requirements** -- a user can register with password `"a"`. No minimum length, complexity, or breach-list check | Critical |
| SEC3 | **Logout is a no-op** -- tokens remain valid until expiry. No Redis blacklist or token rotation. A stolen token works for 15 minutes with no revocation | High |
| SEC4 | **`updateInvoice` passes `req.body` directly to Prisma** -- an attacker can set `status: "PAID"` or `stripePaymentId: "fake"` by calling the update endpoint | Critical |
| SEC5 | **`createMedicalRecord` spreads `...req.body`** -- allows overwriting `doctorId`, `patientId`, or injecting unexpected fields | High |
| SEC6 | **No file upload validation** -- OCR endpoint accepts any file type/size. No MIME-type whitelist, no virus scanning | High |
| SEC7 | **Non-null assertions on `process.env.JWT_SECRET!`** -- if the env var is unset, the server silently signs tokens with `undefined`, making all JWTs insecure | High |
| SEC8 | **Anyone can register as ADMIN or DOCTOR** -- `register` endpoint accepts `role` from the request body with only a fallback to PATIENT, not a restriction | Critical |
| SEC9 | **`refreshToken` doesn't rotate tokens** -- the same refresh token can be reused indefinitely for 7 days | Medium |
| SEC10 | **No HTTPS enforcement** -- no HSTS header, no TLS redirect | Medium |

### Recommendations
- **Immediate:** Remove `role` from the register endpoint -- new users should always be PATIENT. Admin/Doctor roles should only be assigned by an admin
- **Immediate:** Add Zod validation schemas on every endpoint, enforcing required fields, types, min/max lengths, and enums
- **Immediate:** Add password strength validation (min 8 chars, uppercase, lowercase, number, special char)
- **Immediate:** Whitelist allowed fields in `updateInvoice` and `createMedicalRecord` instead of spreading `req.body`
- **Short-term:** Implement Redis-based token blacklisting for logout and token rotation for refresh
- **Short-term:** Add file upload validation (MIME type whitelist, max size enforcement, filename sanitization)
- **Short-term:** Validate all env vars at startup with a fail-fast pattern

---

## 7. General Best Practices

### What's Done Well
- `.env.example` with clear documentation of all variables
- Multi-stage Dockerfile for optimized production images
- Graceful shutdown handler (`SIGINT` -> `prisma.$disconnect()`)
- Health check endpoint at `/health`
- API testing guide with curl examples for every endpoint
- Prisma `@@map()` for clean DB table names separate from model names

### What's Missing

| # | Item | Impact |
|---|------|--------|
| BP1 | **No `.env` file in `.gitignore` check** -- verify secrets aren't committed (currently OK, `.gitignore` includes `.env`) | -- |
| BP2 | No request correlation IDs -- impossible to trace a request across logs | Medium |
| BP3 | No API versioning (`/api/v1/...`) -- breaking changes will affect all clients simultaneously | Medium |
| BP4 | No Prisma transaction usage -- multi-step operations (create invoice + process payment) can leave data in inconsistent states | High |
| BP5 | No global unhandled promise rejection handler -- async errors outside Express can crash the process silently | Medium |
| BP6 | No health check for database connectivity (current `/health` only returns static JSON) | Medium |
| BP7 | No OpenAPI/Swagger spec -- API documentation is manual markdown that can drift from code | Medium |
| BP8 | No data backup strategy documented | Medium |
| BP9 | Doctor seed data doesn't include a `DoctorProfile`, so doctor-related endpoints will fail with seed data | Low |

### Recommendations
- Add `SIGTERM` handler alongside `SIGINT` for container orchestrators
- Add a request ID middleware (`uuid` per request, attached to all logs)
- Wrap multi-step operations in `prisma.$transaction()`
- Enhance `/health` to ping the database: `await prisma.$queryRaw\`SELECT 1\``
- Add `process.on('unhandledRejection', ...)` handler
- Consider generating OpenAPI specs from Zod schemas (e.g., `zod-to-openapi`)
- Add a `DoctorProfile` to the seed script

---

## Priority Action Items

### Must Fix (before any deployment)
1. Add input validation with Zod on all endpoints
2. Restrict role assignment in registration (remove `role` from body)
3. Whitelist fields on all update/create endpoints (stop spreading `req.body`)
4. Add password strength requirements
5. Fix `seed.ts` (`prisma.patient` -> `prisma.patientProfile`)
6. Validate env vars at startup

### Should Fix (before production)
7. Add Jest testing infrastructure + critical path tests
8. Set up ESLint + Prettier + Husky pre-commit hooks
9. Add database indexes on high-traffic query columns
10. Implement token blacklisting for logout (Redis)
11. Add Prisma transactions for multi-step operations
12. Add file upload MIME-type validation

### Nice to Have (improves quality of life)
13. Add request correlation IDs
14. API versioning (`/v1/`)
15. Response compression middleware
16. OpenAPI/Swagger auto-generation
17. Cache layer for auth and frequently-read data
18. CI/CD pipeline with GitHub Actions

---

## Overall Assessment

| Category | Rating | Notes |
|----------|--------|-------|
| Readability | 7/10 | Clean and consistent, needs constants and DTOs |
| Structure | 7/10 | Good layered architecture, missing validation layer |
| Consistency | 6/10 | Mostly uniform patterns, but deletion strategy and response formats diverge |
| Performance | 5/10 | Missing indexes and caching; auth hits DB every request |
| Maintainability | 4/10 | Zero tests, no linting, no CI -- high risk of regression |
| Security | 4/10 | Good foundations (JWT, bcrypt, Helmet), but critical gaps in validation and access control |
| Best Practices | 6/10 | Solid starting patterns, needs transactions, monitoring, and API versioning |

**Overall: 5.6/10** -- A promising foundation with the right architectural instincts, but not yet safe for real users or real medical data. The priority is locking down input validation, access control, and adding a test suite.
