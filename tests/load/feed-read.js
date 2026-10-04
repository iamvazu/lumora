import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 concurrent users
    { duration: '1m', target: 200 },  // Peak at 200 concurrent users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // p95 response time must be under 300ms SLA
    http_req_failed: ['rate<0.01'],   // Error rate must be under 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/v1';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.TEST_JWT_TOKEN || 'test_fan_token'}`,
    },
  };

  // 1. Fetch Feed
  const feedRes = http.get(`${BASE_URL}/posts/feed?limit=20`, params);
  check(feedRes, {
    'feed status is 200': (r) => r.status === 200,
    'feed returns items array': (r) => JSON.parse(r.body).items !== undefined,
  });

  // 2. Fetch Creator Profile
  const profileRes = http.get(`${BASE_URL}/creators/elena_valkyrie`, params);
  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
