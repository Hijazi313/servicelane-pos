# Server data and mutation template

Use this as an illustrative shape, not a scaffold or a complete workflow. Inspect the [shared query client](../../../../apps/web/src/app/query-client.ts), the [API and state lifecycle guidance](../references/api-state.md), the actual endpoint contract and the owning feature before implementation. Use the existing provider; do not create a client per feature. The [Menu hook](../../../../apps/web/src/features/menu/use-menu.ts) shows one real workflow, not a universal policy.

## Feature-owned shape

```tsx
// Illustrative only: names, inputs and operations belong to the feature.
const resourceKey = (resourceId: string) => ['resource', resourceId] as const;

function useResource(resourceId: string) {
  const query = useQuery({
    queryKey: resourceKey(resourceId),
    queryFn: () => loadResource(resourceId), // Uses the shared HTTP client and validates the response.
    // Set freshness and refetch behavior for the actual workflow.
  });
  const mutation = useMutation({
    mutationFn: saveResource, // Feature-owned request and response handling.
    // Decide the refresh and recovery behavior from the endpoint contract.
  });
  return { query, mutation };
}
```

Place keys and operations with the feature; include inputs and authorized scope that affect results, but never credentials or sensitive values. Keep drafts and transient interaction state local. Extract a hook only when it has a clear responsibility. Do not copy query results into separate React state or build a generic query layer without a concrete need.

## Complete the workflow before using the shape

- Define loading, empty, failure and cached-data display; decide if actions are safe while data refreshes. A query error is not an empty result. Configure freshness, retention, refetch and invalidation for the actual workflow; do not copy Menu's policy blindly.
- For a write, define pending, success, rejection, conflict and unknown outcome from the contract. Prevent duplicate submissions. Never automatically replay a write without an explicitly supported retry contract. If a successful write needs readback, keep write success separate from readback failure; do not treat cached data as confirmation.
- Confirm how session or scope transitions clear the cache and isolate in-flight work; do not expose a previous user's data. Preserve LAN operation and inspect shared defaults before overriding them.
- Verify the meaningful loading, save, failure, recovery and session cases using focused checks. Record browser and other evidence limits; development Devtools is an inspection aid, not verification.
