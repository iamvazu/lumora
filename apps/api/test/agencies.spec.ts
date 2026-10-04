import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgenciesService } from '../src/agencies/agencies.service.js';

describe('Agency Management & Scoped Chatter Seats (Epic E17)', () => {
  let agenciesService: AgenciesService;

  const mockAgencies = new Map<string, any>();
  const mockMembers = new Map<string, any>();
  const mockAgencyCreators = new Map<string, any>();
  const mockUsers = new Map<string, any>();
  const mockCreators = new Map<string, any>();
  const mockPurchases = new Map<string, any>();

  const mockPrisma: any = {
    user: {
      findUnique: vi.fn(({ where }) => {
        if (where.id) return Promise.resolve(mockUsers.get(where.id) || null);
        if (where.handle) {
          for (const u of mockUsers.values()) {
            if (u.handle.toLowerCase() === where.handle.toLowerCase()) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
    },
    creatorProfile: {
      findUnique: vi.fn(({ where }) => Promise.resolve(mockCreators.get(where.userId || where.id) || null)),
    },
    agency: {
      create: vi.fn(({ data }) => {
        const agency = {
          id: data.id || `agency_${Date.now()}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockAgencies.set(agency.id, agency);
        return Promise.resolve(agency);
      }),
    },
    agencyMember: {
      create: vi.fn(({ data }) => {
        const key = `${data.agencyId}_${data.userId}`;
        const user = mockUsers.get(data.userId);
        const member = { id: data.id || `mem_${Date.now()}`, ...data, user, createdAt: new Date() };
        mockMembers.set(key, member);
        return Promise.resolve(member);
      }),
      upsert: vi.fn(({ where, create, update }) => {
        const key = `${where.agencyId_userId.agencyId}_${where.agencyId_userId.userId}`;
        const user = mockUsers.get(where.agencyId_userId.userId);
        const existing = mockMembers.get(key);
        if (existing) {
          const updated = { ...existing, ...update, user };
          mockMembers.set(key, updated);
          return Promise.resolve(updated);
        }
        const created = { id: create.id || `mem_${Date.now()}`, ...create, user, createdAt: new Date() };
        mockMembers.set(key, created);
        return Promise.resolve(created);
      }),
      findUnique: vi.fn(({ where }) => {
        const key = `${where.agencyId_userId?.agencyId}_${where.agencyId_userId?.userId}`;
        return Promise.resolve(mockMembers.get(key) || null);
      }),
      findFirst: vi.fn(({ where }) => {
        for (const m of mockMembers.values()) {
          if (where.agencyId && m.agencyId !== where.agencyId) continue;
          if (where.userId && m.userId !== where.userId) continue;
          const agency = mockAgencies.get(m.agencyId);
          return Promise.resolve({
            ...m,
            agency: {
              ...agency,
              _count: { creators: mockAgencyCreators.size, members: mockMembers.size },
            },
          });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn(({ where }) => {
        const key = `${where.agencyId_userId.agencyId}_${where.agencyId_userId.userId}`;
        mockMembers.delete(key);
        return Promise.resolve({ count: 1 });
      }),
    },
    agencyCreator: {
      findUnique: vi.fn(({ where }) => {
        if (where.id) {
          for (const ac of mockAgencyCreators.values()) {
            if (ac.id === where.id) return Promise.resolve(ac);
          }
        }
        if (where.agencyId_creatorId) {
          const key = `${where.agencyId_creatorId.agencyId}_${where.agencyId_creatorId.creatorId}`;
          return Promise.resolve(mockAgencyCreators.get(key) || null);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn(({ where }) => {
        const list = Array.from(mockAgencyCreators.values()).filter(
          (ac) => ac.agencyId === where.agencyId && (!where.status || ac.status === where.status)
        );
        return Promise.resolve(list);
      }),
      upsert: vi.fn(({ where, create, update }) => {
        const key = `${where.agencyId_creatorId.agencyId}_${where.agencyId_creatorId.creatorId}`;
        const creator = mockCreators.get(where.agencyId_creatorId.creatorId);
        const existing = mockAgencyCreators.get(key);
        if (existing) {
          const updated = { ...existing, ...update, creator };
          mockAgencyCreators.set(key, updated);
          return Promise.resolve(updated);
        }
        const created = { id: create.id || `ac_${Date.now()}`, ...create, creator, createdAt: new Date() };
        mockAgencyCreators.set(key, created);
        return Promise.resolve(created);
      }),
      update: vi.fn(({ where, data }) => {
        for (const [key, ac] of mockAgencyCreators.entries()) {
          if (ac.id === where.id) {
            const creator = mockCreators.get(ac.creatorId);
            const updated = { ...ac, ...data, creator };
            mockAgencyCreators.set(key, updated);
            return Promise.resolve(updated);
          }
        }
        throw new Error('Not found');
      }),
    },
    purchase: {
      aggregate: vi.fn(({ where }) => {
        let gross = 0;
        let net = 0;
        for (const p of mockPurchases.values()) {
          if (p.sellerId === where.sellerId && p.status === where.status) {
            gross += p.grossCents || 0;
            net += p.netCents || 0;
          }
        }
        return Promise.resolve({
          _sum: { grossCents: gross, netCents: net },
        });
      }),
    },
  };

  beforeEach(() => {
    mockAgencies.clear();
    mockMembers.clear();
    mockAgencyCreators.clear();
    mockUsers.clear();
    mockCreators.clear();
    mockPurchases.clear();

    // Setup agency owner
    const owner = { id: 'u-agency-owner', handle: 'apex_media', displayName: 'Apex Media Management' };
    mockUsers.set(owner.id, owner);

    // Setup creator
    const creatorUser: any = { id: 'u-managed-creator', handle: 'elena', displayName: 'Elena V.' };
    const creatorProf = {
      id: 'c-managed-creator',
      userId: creatorUser.id,
      user: creatorUser,
      status: 'approved',
    };
    creatorUser.creatorProfile = creatorProf;
    mockUsers.set(creatorUser.id, creatorUser);
    mockCreators.set(creatorProf.id, creatorProf);
    mockCreators.set(creatorUser.id, creatorProf);

    // Setup chatter
    const chatter = { id: 'u-chatter-1', handle: 'chatter_bob', displayName: 'Bob Support' };
    mockUsers.set(chatter.id, chatter);

    agenciesService = new AgenciesService(mockPrisma);
  });

  it('creates an agency profile and registers the owner', async () => {
    const agency = await agenciesService.createAgency('u-agency-owner', {
      legalEntityRef: 'Apex Media LLC (DE-987654)',
    });
    expect(agency).toBeDefined();
    expect(agency.legalEntityRef).toBe('Apex Media LLC (DE-987654)');
    expect(agency.memberCount).toBe(1);
  });

  it('invites a creator and transitions status to active upon explicit creator consent', async () => {
    const agency = await agenciesService.createAgency('u-agency-owner', {
      legalEntityRef: 'Apex Media LLC',
    });

    const invite = await agenciesService.inviteCreator('u-agency-owner', agency.id, {
      creatorHandle: 'elena',
      splitBps: 2000, // 20%
    });

    expect(invite.status).toBe('invited');
    expect(invite.splitBps).toBe(2000);
    expect(invite.creatorConsentedAt).toBeNull();

    // Creator accepts
    const accepted = await agenciesService.acceptInvitation('u-managed-creator', invite.id);
    expect(accepted.status).toBe('active');
    expect(accepted.creatorConsentedAt).toBeDefined();
  });

  it('adds a chatter seat with scoped inbox permissions and blocks financial views', async () => {
    const agency = await agenciesService.createAgency('u-agency-owner', {
      legalEntityRef: 'Apex Media LLC',
    });

    // Add chatter
    const member = await agenciesService.addMember('u-agency-owner', agency.id, {
      userHandle: 'chatter_bob',
      role: 'chatter',
      scopes: ['inbox:read', 'inbox:reply'],
    });

    expect(member.role).toBe('chatter');
    expect(member.scopes).toEqual(['inbox:read', 'inbox:reply']);

    // Attempting to read earnings as chatter must throw 403 FORBIDDEN
    await expect(agenciesService.getEarnings('u-chatter-1', agency.id)).rejects.toThrowError();
  });

  it('calculates agency earnings split accurately across managed creators', async () => {
    const agency = await agenciesService.createAgency('u-agency-owner', {
      legalEntityRef: 'Apex Media LLC',
    });

    const invite = await agenciesService.inviteCreator('u-agency-owner', agency.id, {
      creatorHandle: 'elena',
      splitBps: 2000, // 20% of net take
    });
    await agenciesService.acceptInvitation('u-managed-creator', invite.id);

    // Creator earned $10,000 GMV ($8,000 net)
    mockPurchases.set('p-agency-1', {
      id: 'p-agency-1',
      sellerId: 'u-managed-creator',
      status: 'succeeded',
      grossCents: 1000000, // $10,000
      feeCents: 200000,   // $2,000 platform fee
      netCents: 800000,   // $8,000 creator net
    });

    const earnings = await agenciesService.getEarnings('u-agency-owner', agency.id);
    expect(earnings.totalGrossCents).toBe(1000000);
    // 20% of $8,000 = $1,600 (160,000 cents)
    expect(earnings.agencyCommissionCents).toBe(160000);
    // Remaining creator take = $6,400 (640,000 cents)
    expect(earnings.creatorEarningsCents).toBe(640000);
    expect(earnings.managedCreatorsCount).toBe(1);
  });
});
