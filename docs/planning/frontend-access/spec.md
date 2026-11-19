# Frontend access — intended first slice

Status: active source work authorized by the user's request for login, protected home and logout. This does not authorize deployment, database access, credentials, certificate provisioning or backend contract changes.

- FE-A01: Start by checking the server session. Show the protected home only after a successful server identity response; unavailable service must not be treated as signed out or authorized.
- FE-A02: A login form collects username and password, bootstraps CSRF and submits the documented same-origin session request. Show generic credential failure, throttling and safe unavailable feedback. Do not store credentials or tokens in browser storage.
- FE-A03: Enforce the backend's required password-change state in the UI; allow password change and logout, not protected home. Re-check server state after an uncertain mutation. Never blindly replay login, password change or logout.
- FE-A04: Logout requires CSRF and is confirmed by server response. If the result is unknown, show an explicit recovery state and do not claim logout succeeded.
- FE-A05: The initial home is deliberately minimal; navigation to unimplemented features is not enabled. Login and home must remain usable at desktop and tablet sizes, with labels and visible keyboard focus.
- FE-A06: Use explicit local routes for login, password change and home. The current server session determines which screen is shown; direct navigation, reload and browser history must not show protected content without a confirmed account. Unknown or unavailable session state stays fail-closed. Route navigation is not server authorization. The eventual same-origin host must support route refresh.
- FE-A07: In local development, authentication requests must reach the API through a loopback-only HTTPS origin with a user-supplied trusted certificate, the original Host and Origin, and a proxy-generated HTTPS protocol header. When the secure proxy is not configured, API paths return an explicit unavailable response rather than the frontend HTML. Do not weaken cookies, backend authorization or certificate checks.

Evidence: focused offline checks for authentication state and request handling, typecheck/build, and browser/HTTPS integration when its prerequisites are available. Browser HTTPS/session cookies, target devices and operational deployment are separate verification gates.
