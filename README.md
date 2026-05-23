# 🦙 Llama.io - Enterprise Task Management RESTful API

A production-ready, high-performance RESTful API backend engineered for **Llama.io**—a highly competitive startup task management platform. Built using **Node.js**, **Express.js**, and **Mongoose (MongoDB Atlas)**, this system delivers premium database query parsing, strict server-side schema validations, and multi-document relational data integrity guarantees.

---

## 🚀 System Architecture & API Endpoints

The system exposes fully compliant RESTful endpoints structured to abstract database mutations into decoupled, uniform resource states, utilizing standardized HTTP status codes (`200`, `201`, `204`, `400`, `404`, `500`).

### 👤 User Services Routing (`/api/users`)
- `GET /api/users` - Retrieves user registries filtered and paginated via microservices.
- `POST /api/users` - Creates a new type-validated user profile container.
- `GET /api/users/:id` - Fetches granular field telemetry for a single identifier.
- `PUT /api/users/:id` - Replaces complete single-user target structures.
- `DELETE /api/users/:id` - Purges user documents and triggers reference cascade lifecycles.

### 📋 Task Services Routing (`/api/tasks`)
- `GET /api/tasks` - Emits full array streams of task objects with default pagination clamps.
- `POST /api/tasks` - Provisions a new task state block with automatic date creation stamps.
- `GET /api/tasks/:id` - Resolves details for specific work items.
- `PUT /api/tasks/:id` - Updates specific structural tasks and initiates reference mapping sweeps.
- `DELETE /api/tasks/:id` - Removes task targets and synchronizes user assignments.

---

## 🛠️ Advanced Core Systems & Engineering Matrix

### 1. Dynamic Unified Query Parser Engine
Instead of processing sorting and filtering inside vulnerable Node application runtimes, this API leverages optimized Native MongoDB pipelines. It parses incoming JSON-encoded query strings and chains atomic Mongoose criteria operators dynamically:
- **`where` Clause Serialization:** Decodes complex embedded JSON strings into structured Mongo filter matrices (supporting logical range queries like `$in`, constants, etc.).
- **`sort` / `select` Projection Controllers:** Maps key-value pairs (e.g., `1` for Ascending, `0` for Exclude) directly into MongoDB projection lenses.
- **Dynamic Pagination Layers:** Chains synchronous `.skip()` and `.limit()` parameters over streaming buffers to avoid database query memory locks.
- **`count` Aggregation Filter:** Bypasses document cursor fetches entirely when `count=true`, routing requests directly to collection counters to minimize IO overhead.

### 2. Double-Ended Reference Integrity System
To guarantee strict two-way relational binding between independent collections without heavy SQL table joins, the engine implements automated database lifecycle triggers:
- **Task Interceptors:** Performing a `PUT` or `DELETE` on a Task automatically updates or cascades changes to the target User’s `pendingTasks` array registry.
- **User Interceptors:** Purging a User document executes an automated batch scan that resets all corresponding assigned tasks back to `"unassigned"` fallback states seamlessly.

### 3. Isolated Error Propagation Layer
Strictly sanitizes raw internal server leaks or unformatted Mongoose compilation exceptions. The server interceptor wraps all transactional outputs into clean, unified, framework-agnostic client schemas:
```json
{
  "message": "Human-readable semantic description explaining the business logic event",
  "data": { "..." : "Target payload block or sanitized error metadata context" }
}
```
---

## 👩‍💻 About the Engineer
I am an incoming Software Engineer and a Graduate Student pursuing a Master of Computer Science (MCS) at the **University of Illinois Urbana-Champaign (UIUC)**, holding a perfect **4.0/4.0 GPA**. 

This enterprise API project reflects my engineering proficiency in building decoupled backend service infrastructures, optimizing database query layers, implementing distributed data integrity guarantees, and shipping highly predictable cloud APIs.
