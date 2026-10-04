import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamModerationProcessor } from '../src/processors/stream-moderation.processor.js';

describe('StreamModerationProcessor (Live Frame Sampling & P0 Kill Switch)', () => {
  let processor: StreamModerationProcessor;

  const mockStreams = new Map<string, any>();
  const mockUsers = new Map<string, any>();
  const mockCases: any[] = [];
  const mockLegalReports: any[] = [];
  const mockAuditLogs: any[] = [];

  const mockPrisma: any = {
    liveStream: {
      findMany: vi.fn(({ where }) => {
        const list: any[] = [];
        for (const s of mockStreams.values()) {
          if (s.status === where.status) list.push(s);
        }
        return Promise.resolve(list);
      }),
      update: vi.fn(({ where, data }) => {
        const s = mockStreams.get(where.id);
        if (!s) throw new Error('Stream not found');
        const updated = { ...s, ...data };
        mockStreams.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    user: {
      update: vi.fn(({ where, data }) => {
        const u = mockUsers.get(where.id);
        if (!u) throw new Error('User not found');
        const updated = { ...u, ...data };
        mockUsers.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    moderationCase: {
      create: vi.fn(({ data }) => {
        const c = { id: `case_${Date.now()}`, ...data };
        mockCases.push(c);
        return Promise.resolve(c);
      }),
    },
    legalReport: {
      create: vi.fn(({ data }) => {
        const r = { id: `leg_${Date.now()}`, ...data };
        mockLegalReports.push(r);
        return Promise.resolve(r);
      }),
    },
    auditLog: {
      create: vi.fn(({ data }) => {
        mockAuditLogs.push(data);
        return Promise.resolve({ id: `aud_${Date.now()}`, ...data });
      }),
    },
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') return cb(mockPrisma);
      return Promise.all(cb);
    }),
  };

  beforeEach(() => {
    mockStreams.clear();
    mockUsers.clear();
    mockCases.length = 0;
    mockLegalReports.length = 0;
    mockAuditLogs.length = 0;

    processor = new StreamModerationProcessor(mockPrisma);
  });

  it('samples active streams and triggers auto-kill on severe violation signal', async () => {
    const creatorUser = { id: 'u-offender-1', status: 'active' };
    mockUsers.set('u-offender-1', creatorUser);

    const stream = {
      id: 'stream-violating-1',
      status: 'live',
      creator: { userId: 'u-offender-1' },
    };
    mockStreams.set(stream.id, stream);

    // Mock frame sampler to return severe violation CSAM match
    vi.spyOn(processor, 'sampleStreamFrame').mockResolvedValueOnce({
      streamId: stream.id,
      csamMatch: true,
      severeViolation: true,
    });

    const result = await processor.processActiveStreams();

    expect(result.sampledStreamsCount).toBe(1);
    expect(result.killedStreamsCount).toBe(1);

    // Verify stream is removed
    const updatedStream = mockStreams.get(stream.id);
    expect(updatedStream.status).toBe('removed');

    // Verify creator suspended
    const updatedUser = mockUsers.get('u-offender-1');
    expect(updatedUser.status).toBe('suspended');

    // Verify P0 Moderation Case & NCMEC legal report created
    expect(mockCases.length).toBe(1);
    expect(mockCases[0].priority).toBe(0);
    expect(mockLegalReports.length).toBe(1);
    expect(mockLegalReports[0].authority).toBe('NCMEC');
  });
});
