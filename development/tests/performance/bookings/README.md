# Booking transition benchmark

The benchmark is implemented in `booking-transitions.performance.test.ts` and runs 100 alternating `accept`/`reject` operations against PostgreSQL/Testcontainers.

## Execution

```bash
cd development
npx vitest run tests/performance/bookings/booking-transitions.performance.test.ts --reporter=verbose --pool=forks --poolOptions.forks.singleFork=true
```

The test prints a `BOOKING_TRANSITION_METRICS` JSON object with `count`, `p50Ms`, `p95Ms`, `p99Ms` and `maxMs`. The acceptance threshold is `p95Ms < 2000` (p95 < 2 seconds), with 100 successful authorized operations and no false conflicts.

The measured result from the validation run must be appended below:

```text
BOOKING_TRANSITION_METRICS: {"count":100,"p50Ms":3.470041,"p95Ms":5.421791,"p99Ms":15.461833,"maxMs":26.318708}
```
