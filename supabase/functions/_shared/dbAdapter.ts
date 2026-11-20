import { SupabaseClient } from '@supabase/supabase-js';
import {
  AgentTask,
  EmergencyContact,
  Incident,
  Notification,
  TriageAssessment,
  VitalReading
} from '@trinetra/shared';
import { DatabaseClient } from './types.ts';

/**
 * Creates a DatabaseClient backed by a real SupabaseClient instance
 */
export function createSupabaseDbClient(supabase: SupabaseClient): DatabaseClient {
  return {
    async getIncident(id: string): Promise<Incident | null> {
      const { data, error } = await supabase.from('incidents').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
      const { data, error } = await supabase.from('emergency_contacts').select('*').eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },

    async createAgentTask(task: Omit<AgentTask, 'id'> & { id?: string }): Promise<AgentTask> {
      const { data, error } = await supabase.from('agent_tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },

    async getAgentTask(id: string): Promise<AgentTask | null> {
      const { data, error } = await supabase.from('agent_tasks').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<void> {
      const { error } = await supabase.from('agent_tasks').update(updates).eq('id', id);
      if (error) throw error;
    },

    async createNotification(notif: Omit<Notification, 'id'> & { id?: string }): Promise<Notification> {
      const { data, error } = await supabase.from('notifications').insert(notif).select().single();
      if (error) throw error;
      return data;
    },

    async getNotification(id: string): Promise<Notification | null> {
      const { data, error } = await supabase.from('notifications').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data;
    },

    async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
      const { error } = await supabase.from('notifications').update(updates).eq('id', id);
      if (error) throw error;
    },

    async getTriageAssessment(incidentId: string): Promise<TriageAssessment | null> {
      const { data, error } = await supabase.from('triage_assessments').select('*').eq('incident_id', incidentId).maybeSingle();
      if (error) throw error;
      return data;
    },

    async getVitalReadings(incidentId: string): Promise<VitalReading[]> {
      const { data, error } = await supabase.from('vital_readings').select('*').eq('incident_id', incidentId);
      if (error) throw error;
      return data || [];
    }
  };
}
