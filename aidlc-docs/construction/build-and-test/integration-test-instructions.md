# Integration Test Instructions

## Purpose

Verify the integrated HTTP, application, domain, repository, configuration, and lifecycle components using the real local server and filesystem APIs.

## Run Integration Tests

```bash
node --test tests/integration/api.test.mjs
```

Expected result: four integration scenarios pass with zero failures.

## Scenarios

### Five endpoints and main journey

- Starts the application on an ephemeral loopback port.
- Calls health, creates three initiatives, lists them, ranks them, patches one, and verifies reordering.
- Sends invalid input and verifies the persistence file is unchanged.

### Restart persistence

- Creates an initiative in a temporary file.
- Stops the first application instance.
- Starts a second instance with the same temporary file and verifies the initiative remains available.

### Invalid startup state

- Exercises malformed JSON, invalid structure, and incompatible `schemaVersion`.
- Verifies startup is refused and the existing file remains byte-for-byte unchanged.

### Capacity behavior

- Starts from a valid temporary document containing 1,000 initiatives.
- Verifies list and ranking correctness without a temporal pass/fail criterion.

## Environment and Cleanup

No external service or manual server startup is required. Each scenario creates a unique directory under the operating system temporary directory, uses port `0`, closes every application instance, and removes its directory in cleanup hooks. The workspace `data/initiatives.json` file is not modified.

## Repeatability Command

```bash
for run_number in 1 2 3; do
  node --test tests/integration/api.test.mjs || exit 1
done
```

Expected result: 12 passing integration test executions, zero failures, no leaked server ports, and no retained temporary state.
