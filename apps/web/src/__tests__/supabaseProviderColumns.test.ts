import { describe, it, expect, vi } from 'vitest';
import { SUPABASE_TABLE_COLUMNS } from '@trinetra/shared';
import {
  SupabaseDataProvider,
  SUPABASE_QUERY_CONFIG,
  INCIDENT_RELATIONS_SELECT
} from '../lib/dataProvider/SupabaseDataProvider';

describe('SupabaseDataProvider Column & Realtime Audit', () => {
  it('asserts that table and column names in SUPABASE_QUERY_CONFIG strictly match SUPABASE_TABLE_COLUMNS', () => {
    const verifiedTables = [
      'incidents',
      'triage_assessments',
      'vital_readings',
      'location_history',
      'profiles',
      'hiking_sessions'
    ] as const;

    for (const table of verifiedTables) {
      expect(SUPABASE_TABLE_COLUMNS, `Table "${table}" missing in SUPABASE_TABLE_COLUMNS`).toHaveProperty(table);

      const expectedColumns = [...(SUPABASE_TABLE_COLUMNS as Record<string, readonly string[]>)[table]].sort();
      const usedColumns = [...SUPABASE_QUERY_CONFIG[table]].sort();

      expect(
        usedColumns,
        `SUPABASE_QUERY_CONFIG for "${table}" uses columns that differ from SUPABASE_TABLE_COLUMNS`
      ).toEqual(expectedColumns);
    }
  });

  it('asserts agent_tasks and notifications columns match PostgreSQL migration schema', () => {
    // Assert required columns on agent_tasks
    const agentTasksExpected = [
      'id', 'incident_id', 'agent_name', 'task_type', 'status',
      'input_data', 'output_data', 'is_demo', 'created_at', 'completed_at'
    ].sort();
    expect([...SUPABASE_QUERY_CONFIG.agent_tasks].sort()).toEqual(agentTasksExpected);

    // Assert required columns on notifications
    const notificationsExpected = [
      'id', 'incident_id', 'contact_id', 'channel', 'recipient',
      'provider_reference', 'status', 'error_message', 'is_demo', 'retry_count', 'created_at', 'updated_at'
    ].sort();
    expect([...SUPABASE_QUERY_CONFIG.notifications].sort()).toEqual(notificationsExpected);
  });

  it('subscribes to Realtime postgres_changes on incidents, notifications, and agent_tasks', () => {
    const subscribedTables: string[] = [];
    const mockChannel = {
      on: vi.fn().mockImplementation((event: string, filter: { table: string }, _cb: any) => {
        subscribedTables.push(filter.table);
        return mockChannel;
      }),
      subscribe: vi.fn()
    };

    const mockClient = {
      channel: vi.fn().mockReturnValue(mockChannel),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-1' } } })
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null })
        })
      })
    };

    const provider = new SupabaseDataProvider(mockClient);

    expect(mockClient.channel).toHaveBeenCalledWith('web-dashboard-realtime');
    expect(subscribedTables).toContain('incidents');
    expect(subscribedTables).toContain('notifications');
    expect(subscribedTables).toContain('agent_tasks');
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it('loads incident with relations using verified column selections and loads location_history', async () => {
    const mockIncidentData = {
      id: 'inc-test-1',
      session_id: 'sess-123',
      user_id: 'user-1',
      incident_type: 'manual_sos',
      priority: 'high',
      status: 'emergency_initiated',
      detection_source: 'manual',
      is_demo: false,
      created_at: new Date().toISOString()
    };

    const mockLocationData = [
      { id: 'loc-1', session_id: 'sess-123', latitude: 32.24, longitude: 77.18, accuracy: 5.0, recorded_at: new Date().toISOString() }
    ];

    let selectIncidentQuery = '';
    let selectLocationQuery = '';

    const mockClient = {
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn()
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
      },
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'incidents') {
          return {
            select: vi.fn().mockImplementation((cols: string) => {
              selectIncidentQuery = cols;
              return {
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: mockIncidentData, error: null })
                })
              };
            })
          };
        }
        if (table === 'location_history') {
          return {
            select: vi.fn().mockImplementation((cols: string) => {
              selectLocationQuery = cols;
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockLocationData, error: null })
                })
              };
            })
          };
        }
        return {};
      })
    };

    const provider = new SupabaseDataProvider(mockClient);
    const incident = await provider.getIncident('inc-test-1');

    expect(incident).toBeDefined();
    expect(incident?.id).toBe('inc-test-1');
    expect((incident as any).location_history).toHaveLength(1);

    // Verify relations columns were included in the query
    expect(selectIncidentQuery).toContain('triage_assessments');
    expect(selectIncidentQuery).toContain('vital_readings');
    expect(selectIncidentQuery).toContain('agent_tasks');
    expect(selectIncidentQuery).toContain('notifications');
    expect(selectLocationQuery).toContain('accuracy');
    expect(selectLocationQuery).toContain('session_id');
  });
});
