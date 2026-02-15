import { httpMetricsStore } from './http-metrics.store';

describe('httpMetricsStore', () => {
  beforeEach(() => {
    httpMetricsStore.resetForTests();
  });

  it('computes availability and latency aggregates', () => {
    httpMetricsStore.record({
      requestId: 'r-1',
      method: 'GET',
      path: '/api/v1/farms/123',
      statusCode: 200,
      durationMs: 120,
    });
    httpMetricsStore.record({
      requestId: 'r-2',
      method: 'GET',
      path: '/api/v1/farms/456',
      statusCode: 503,
      durationMs: 240,
    });

    const snapshot = httpMetricsStore.snapshot();

    expect(snapshot.requestVolume.total).toBe(2);
    expect(snapshot.requestVolume.errors).toBe(1);
    expect(snapshot.requestVolume.errorRatePercent).toBe(50);
    expect(snapshot.requestVolume.availabilityPercent).toBe(50);
    expect(snapshot.latency.maxMs).toBe(240);
    expect(snapshot.latency.p95Ms).toBeGreaterThan(0);
    expect(snapshot.activeRoutes).toBe(1);
  });

  it('normalizes numeric, uuid and object-id path segments', () => {
    const objectId = '507f1f77bcf86cd799439011';
    const uuid = '4fca4db7-6f4f-4f8c-95a8-4d7fa03ea8f6';

    const rows = [
      `/api/v1/orders/99`,
      `/api/v1/orders/${uuid}`,
      `/api/v1/orders/${objectId}`,
    ];

    rows.forEach((path, index) => {
      httpMetricsStore.record({
        requestId: `r-${index}`,
        method: 'GET',
        path,
        statusCode: 200,
        durationMs: 20 + index,
      });
    });

    const snapshot = httpMetricsStore.snapshot();

    expect(snapshot.activeRoutes).toBe(1);
    expect(snapshot.topSlowRoutes).toEqual([]);
    expect(snapshot.statusBreakdown['200']).toBe(3);
  });
});
