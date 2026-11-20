import {
  AgentName,
  AgentTask,
  AgentTaskStatus,
  Incident,
  Notification,
  NotificationChannel,
  NotificationStatus,
  IncidentPriority
} from '../contracts';
import { DatabaseClient } from '../types';

export interface ProcessIncidentDeps {
  db: DatabaseClient;
  runAgentTask: (taskId: string) => Promise<void>;
  sendNotification: (notificationId: string) => Promise<void>;
}

export interface ProcessIncidentResult {
  incidentId: string;
  agentTasksCreated: AgentTask[];
  notificationsCreated: Notification[];
  consentedContactsCount: number;
  unconsentedContactsCount: number;
}

export async function processIncidentLogic(
  incidentId: string,
  deps: ProcessIncidentDeps
): Promise<ProcessIncidentResult> {
  const incident = await deps.db.getIncident(incidentId);
  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  // 1. Create the five required multi-agent intelligence task records
  const agentDefinitions: Array<{ agentName: AgentName; taskType: string; initialInput: Record<string, unknown> }> = [
    {
      agentName: AgentName.LOCATION_INTELLIGENCE,
      taskType: 'hospital_lookup',
      initialInput: {
        latitude: incident.latitude,
        longitude: incident.longitude,
        searchRadiusMeters: 25000
      }
    },
    {
      agentName: AgentName.MEDICAL_INTELLIGENCE,
      taskType: 'triage_vital_analysis',
      initialInput: {
        incidentPriority: incident.priority,
        incidentType: incident.incident_type,
        detectionSource: incident.detection_source
      }
    },
    {
      agentName: AgentName.ROUTE_INTELLIGENCE,
      taskType: 'trail_evacuation_routing',
      initialInput: {
        latitude: incident.latitude,
        longitude: incident.longitude,
        sessionId: incident.session_id
      }
    },
    {
      agentName: AgentName.EMERGENCY_COORDINATION,
      taskType: 'rescue_team_orchestration',
      initialInput: {
        priority: incident.priority,
        isDemo: incident.is_demo
      }
    },
    {
      agentName: AgentName.COMMUNICATION,
      taskType: 'emergency_message_synthesis',
      initialInput: {
        incidentId: incident.id,
        status: incident.status
      }
    }
  ];

  const agentTasksCreated: AgentTask[] = [];
  for (const def of agentDefinitions) {
    const task = await deps.db.createAgentTask({
      incident_id: incident.id,
      agent_name: def.agentName,
      task_type: def.taskType,
      status: AgentTaskStatus.PENDING,
      input_data: def.initialInput,
      is_demo: incident.is_demo,
      created_at: new Date().toISOString()
    });
    agentTasksCreated.push(task);
  }

  // 2. Fetch emergency contacts and strictly filter by consent = true
  const allContacts = await deps.db.getEmergencyContacts(incident.user_id);
  const consentedContacts = allContacts.filter(c => c.consent === true);
  const unconsentedContactsCount = allContacts.length - consentedContacts.length;

  const notificationsCreated: Notification[] = [];

  for (const contact of consentedContacts) {
    // Primary SMS notification
    const smsNotif = await deps.db.createNotification({
      incident_id: incident.id,
      contact_id: contact.id,
      channel: NotificationChannel.SMS,
      recipient: contact.phone_number,
      status: NotificationStatus.PENDING,
      is_demo: incident.is_demo,
      created_at: new Date().toISOString()
    });
    notificationsCreated.push(smsNotif);

    // If critical priority, also queue a Voice call notification
    if (incident.priority === IncidentPriority.CRITICAL) {
      const voiceNotif = await deps.db.createNotification({
        incident_id: incident.id,
        contact_id: contact.id,
        channel: NotificationChannel.VOICE,
        recipient: contact.phone_number,
        status: NotificationStatus.PENDING,
        is_demo: incident.is_demo,
        created_at: new Date().toISOString()
      });
      notificationsCreated.push(voiceNotif);
    }
  }

  // 3. Dispatch agent tasks and notifications asynchronously (fire and forget execution)
  for (const task of agentTasksCreated) {
    deps.runAgentTask(task.id).catch(err => {
      console.error(`Error running agent task ${task.id}:`, err);
    });
  }

  for (const notif of notificationsCreated) {
    deps.sendNotification(notif.id).catch(err => {
      console.error(`Error sending notification ${notif.id}:`, err);
    });
  }

  return {
    incidentId: incident.id,
    agentTasksCreated,
    notificationsCreated,
    consentedContactsCount: consentedContacts.length,
    unconsentedContactsCount
  };
}
