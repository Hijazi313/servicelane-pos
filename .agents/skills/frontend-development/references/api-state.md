# API integration and state lifecycle

Status: proposed frontend conventions; endpoint behavior is owned by its actual contract and feature integration guide. [Frontend architecture](../../../../docs/architecture/frontend-proposal.md) records selected and proposed technology and deployment boundaries.

## Establish the boundary

Find the owning backend capability index, specification, frontend integration guide, route and current evidence. Approved intent is not proof of an available or verified endpoint. Follow existing session, cookie, CSRF and origin contracts and server-resolved business/branch scope; the UI is not an authorization boundary. Do not import backend controllers, services, database models or persistence types. Feature operations own endpoint-specific mapping; shared transport owns only genuinely common HTTP mechanics.

Existing routes can differ in envelopes, stable error identifiers, validation, revisions and retry semantics. Follow the actual route; do not branch on translated message text or assume a universal error format. Map documented errors to actionable UI feedback and use a safe fallback. Do not log credentials, CSRF values, payloads or personal data. Define base URL, credentials and timeout only after hosting and session behavior are specified. All browser configuration is public.

## State and recovery

- Server data is authoritative. Use a single owner for fetched data and for each input affecting it; query keys, when used, include relevant resource inputs and authorized scope without credentials or sensitive data. Define freshness and invalidation per workflow. URL parameters are appropriate only when navigation should preserve them and they contain no sensitive data.
- Define clearing or invalidation of user-specific data when identity or scope changes before integration, so a new staff member cannot see another's cached data. Draft lifecycle, cross-tab synchronization and persistence are separate decisions; avoid storing staff, customer or order data by default.
- For each write, define pending, success, rejected, conflict and unknown-outcome behavior from the actual contract. A timeout or cached result does not prove success or failure. Prevent accidental duplicates and reconcile uncertain outcomes before allowing a potentially duplicate action. Retain the original request and retry identity only where the endpoint requires it; never globally replay mutations. Follow the endpoint's revision/readback and retry rules.
- The application should work without internet when the LAN and local server are available. Device disconnection, queued writes and conflict resolution are unresolved. A browser connectivity indicator alone cannot prove API reachability; do not claim offline sales support.

Choose focused checks for applicable errors, scope changes and recovery, and record actual evidence and limitations. Browser, deployment and recovery behavior require suitable separate verification.
