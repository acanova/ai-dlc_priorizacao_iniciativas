# Unit Test Execution Instructions

## Scope

Unit and component tests cover pure domain rules, application orchestration, JSON repository behavior, the HTTP boundary, and the safe logger.

## Run Unit and Component Tests

```bash
node --test \
  tests/domain/initiative-domain.test.mjs \
  tests/application/initiative-service.test.mjs \
  tests/infrastructure/json-initiative-repository.test.mjs \
  tests/http/request-handler.test.mjs
```

Expected result: 24 tests pass with zero failures.

## Covered Behavior

- RICE calculation, rounding, full-precision ordering, deterministic tie-breaking, and immutability.
- Aggregate validation, field order, finite-number boundaries, discrete impact values, and name canonicalization.
- Create and patch orchestration, error precedence, uniqueness, and one confirmed persistence call.
- Initial JSON state, persistence and reload, invalid-state preservation, 1,000-record capacity, and injected rename failure.
- Five-route dispatch, malformed and oversized bodies, stable status codes, safe error envelopes, and logger allowlisting.

## Isolation and Repeatability

- Domain and application tests do not use process-global state.
- Application service tests use a new in-memory repository per test.
- Repository tests use a unique `mkdtemp` directory and remove it through `t.after`.
- HTTP tests listen on port `0`, allowing the operating system to select an ephemeral port, and close the server through `t.after`.
- No test reads or writes the workspace `data/initiatives.json` file.

## Repeat the Tests

```bash
for run_number in 1 2 3; do
  node --test \
    tests/domain/initiative-domain.test.mjs \
    tests/application/initiative-service.test.mjs \
    tests/infrastructure/json-initiative-repository.test.mjs \
    tests/http/request-handler.test.mjs || exit 1
done
```

Any failure stops the loop. A successful repetition produces 72 passing test executions and zero failures.

## Failure Handling

Review the failing test name and assertion in the terminal output, correct the implementation or test isolation issue, and rerun the complete command. Test data must remain temporary; do not redirect tests to the workspace persistence file.
