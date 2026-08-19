# Performance Test Instructions

## Applicability

Formal load, stress, throughput, latency, and concurrent-user testing are N/A. The approved NFRs define no temporal target, SLA, throughput target, or concurrent-write guarantee. Adding a time threshold would create an unapproved and machine-dependent requirement.

## Applicable Capacity Verification

The approved capacity criterion is functional correctness with 1,000 initiatives. It is covered by repository and integration tests:

```bash
node --test --test-name-pattern="1000" \
  tests/infrastructure/json-initiative-repository.test.mjs \
  tests/integration/api.test.mjs
```

Expected result:

- A complete 1,000-record document is persisted and reloaded.
- A 1,001-record replacement is rejected.
- Listing returns 1,000 records.
- Ranking returns 1,000 records in correct descending order.
- No response-time assertion is applied.

## Deliberate Exclusions

- Concurrent writes: outside the approved one-writer demonstrator scope.
- Load and stress tests: no approved load profile or acceptance threshold.
- External performance tools: prohibited by the no-external-dependencies constraint and unnecessary for the functional capacity criterion.
- Optimization based on elapsed time: not justified without an approved temporal requirement.

## Extension Compliance

- Resiliency Baseline: N/A; disabled.
- Security Baseline: N/A; disabled.
- Property-Based Testing: N/A; disabled.
