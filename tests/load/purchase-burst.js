import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '40s', target: 100 }, // Simulate 100 simultaneous fans unlocking a PPV drop
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // p95 purchase latency SLA < 800ms
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/v1';

export default function () {
  const payload = JSON.stringify({
    resourceType: 'post',
    resourceId: 'post-burst-target-uuid',
    creatorId: 'creator-target-uuid',
    amountCents: 2000,
    paymentSource: 'wallet',
    idempotencyKey: `idem-k6-${__VU}-${__ITER}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.TEST_JWT_TOKEN || 'test_fan_token'}`,
      'Idempotency-Key': `idem-k6-${__VU}-${__ITER}`,
    },
  };

  const purchaseRes = http.post(`${BASE_URL}/purchases`, payload, params);
  check(purchaseRes, {
    'purchase responds 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(0.5);
}
