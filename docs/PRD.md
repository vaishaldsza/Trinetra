# TRINETRA
## Product Requirements Document (PRD)

**Project Name:** TRINETRA  
**Full Name:** Intelligent Outdoor Safety & Emergency Response System  
**Tagline:** See the Danger. Sense the Risk. Save a Life.  
**Category:** Artificial Intelligence · Healthcare · Safety · Emergency Response  
**Platforms:** Web Application, Android and iOS  
**Backend:** Supabase  
**Document Type:** Product Requirements Document  
**Version:** 1.0

---

# 1. Product Overview

TRINETRA is an AI-powered, offline-first outdoor safety and emergency response platform designed to protect hikers, trekkers, mountaineers and adventure enthusiasts.

The system combines mobile sensor intelligence, on-device AI, voice-based emergency assessment, health signal estimation, intelligent agent coordination and emergency communication to identify potential dangers and assist users during critical situations.

TRINETRA consists of two interconnected products:

1. **TRINETRA Mobile Application:** An Android and iOS application that monitors user safety, detects possible falls, performs offline emergency assessment and initiates emergency assistance.
2. **TRINETRA Web Platform:** A centralized monitoring and intelligence dashboard that displays incidents, location information, AI assessments, agent activities and emergency communication status.

Both platforms share a common backend powered by Supabase.

The core principle is that essential safety features should continue functioning even when internet connectivity is unavailable.

# 2. Problem Statement

Hikers and outdoor adventurers frequently travel through remote environments where mobile connectivity is unreliable or unavailable.

During emergencies such as falls, injuries, exhaustion or unconsciousness, individuals may be unable to manually contact emergency services or communicate their condition.

Traditional safety applications often depend on internet connectivity, manual SOS activation and continuous access to external services.

This creates several challenges:

- Delayed emergency detection.
- Inability to request assistance when injured or unconscious.
- Poor connectivity in remote hiking environments.
- Lack of immediate injury assessment.
- Difficulty identifying nearby medical facilities and rescue resources.
- Limited coordination between the injured person, emergency contacts and responders.
- Lack of intelligent offline emergency assistance.

There is a need for an intelligent, offline-first safety system capable of detecting potential emergencies, assessing user conditions and coordinating assistance through available communication channels.

# 3. Proposed Solution

TRINETRA introduces an intelligent outdoor safety ecosystem that combines multiple sensing technologies and AI-driven emergency workflows.

The platform will:

1. Monitor movement using mobile device sensors.
2. Identify potential falls through sensor-based detection.
3. Classify relevant environmental or distress sounds using an audio intelligence model.
4. Conduct offline voice-based emergency assessments.
5. Estimate heart rate using smartphone camera-based photoplethysmography (PPG).
6. Identify nearby medical facilities and potential rescue resources when connectivity is available.
7. Coordinate specialized AI agents to process emergency information.
8. Notify emergency contacts through available communication channels.
9. Store incidents locally and synchronize them with the cloud when connectivity returns.
10. Provide a centralized web dashboard for monitoring and incident management.

TRINETRA is designed as an assistance system, not a replacement for professional emergency services or certified medical devices.

# 4. Project Objectives

## 4.1 Primary Objectives

- Develop an offline-first hiking safety application.
- Implement automatic potential-fall detection.
- Provide local AI-based emergency voice assessment.
- Enable manual and automatic SOS workflows.
- Create a real-time emergency monitoring website.
- Integrate an intelligent multi-agent coordination system.
- Enable emergency notifications through SMS and voice calls.
- Maintain incident records during network interruptions.

## 4.2 Secondary Objectives

- Estimate heart rate using smartphone camera PPG.
- Identify nearby healthcare facilities.
- Visualize hiking routes and emergency locations.
- Provide historical incident analytics.
- Introduce configurable safety monitoring sessions.
- Support both Android and iOS.

# 5. Target Users

## 5.1 Primary Users

- Hikers.
- Trekkers.
- Mountaineers.
- Solo travelers.
- Adventure sports enthusiasts.
- Outdoor expedition groups.

## 5.2 Secondary Users

- Emergency contacts.
- Rescue coordinators.
- Medical assistance providers.
- Hiking organizations.
- Safety monitoring teams.

# 6. Product Architecture

TRINETRA consists of three major layers.

## 6.1 Mobile Application Layer

Built using React Native and Expo.

Responsibilities:

- User authentication.
- Hiking session management.
- Sensor monitoring.
- Potential fall detection.
- Offline AI assessment.
- Camera-based pulse estimation.
- GPS tracking.
- SOS activation.
- Local incident storage.
- Cloud synchronization.

## 6.2 Web Application Layer

Built using Next.js and TypeScript.

Responsibilities:

- Landing page.
- Emergency monitoring dashboard.
- Incident management.
- Interactive rescue map.
- AI assessment visualization.
- Multi-agent monitoring.
- Communication history.
- Analytics and reports.
- Administrative settings.

## 6.3 Backend and Intelligence Layer

Powered by Supabase and external AI services.

Responsibilities:

- Authentication.
- Database management.
- Real-time updates.
- File storage.
- Incident synchronization.
- Emergency workflow processing.
- Agent coordination.
- Notification management.
- Secure server-side integrations.

# 7. Functional Requirements

## FR-01: User Authentication and Profiles

The application shall allow users to:

- Register and log in.
- Manage personal information.
- Add emergency contacts.
- Configure safety preferences.
- View previous hiking sessions.
- Manage notification preferences.

Authentication will use Supabase Auth.

## FR-02: Hiking Safety Sessions

Users shall be able to start and stop a hiking safety session.

A session shall contain:

- Session identifier.
- Start and end timestamps.
- User information.
- Current or last-known location.
- Monitoring status.
- Session history.
- Associated emergency incidents.

The application shall clearly indicate whether monitoring is active.

## FR-03: AI-Based Fall Detection

The application shall use smartphone motion sensors to identify possible falls.

Sensor inputs:

- Accelerometer.
- Gyroscope.
- Motion activity information where supported.

The detection pipeline shall analyze:

- Sudden acceleration changes.
- Possible free-fall patterns.
- Impact events.
- Post-impact movement.
- Periods of inactivity.

When a potential fall is detected:

1. The application generates a fall event.
2. A confirmation countdown is displayed.
3. The user is asked whether assistance is required.
4. If the user confirms an emergency, an incident is created.
5. If the user does not respond, the configured escalation workflow is initiated, subject to platform capabilities and user permissions.

The algorithm must be validated against different phone placements and real-world movement patterns before being considered reliable.

## FR-04: Offline AI Voice Triage

TRINETRA shall provide an offline voice-based emergency assessment feature.

The system will use a compatible locally deployed language model.

Proposed model direction:

- Qwen model family through a compatible local inference runtime.
- ZETIC SDK integration, subject to model and platform compatibility.

The AI assistant shall ask structured questions:

1. Are you conscious and able to respond?
2. Are you having difficulty breathing?
3. Are you experiencing bleeding?
4. Where are you injured?
5. Can you move safely?
6. How severe is your pain, from 0 to 10?

The system shall convert responses into a structured emergency assessment.

Potential assessment fields:

- Consciousness status.
- Breathing difficulty.
- Visible bleeding.
- Injury location.
- Mobility status.
- Pain score.
- Additional observations.
- Assessment timestamp.

Critical warning signs must trigger predefined escalation rules without waiting for an LLM response.

The AI assistant must not independently diagnose medical conditions or recommend unverified treatment.

## FR-05: Camera-Based Vital Estimation

TRINETRA shall provide an experimental heart-rate estimation feature using smartphone camera-based PPG.

Proposed implementation:

- Rear camera.
- Camera flash.
- Camera frame processing.
- Red-channel signal extraction.
- Signal filtering.
- Pulse peak detection.
- Signal-quality assessment.

The feature shall display:

- Estimated heart rate.
- Measurement duration.
- Signal quality.
- Measurement timestamp.

Important limitation: Smartphone camera PPG is intended for experimental heart-rate estimation. It must not be presented as a validated blood-pressure measurement or medical diagnosis.

## FR-06: Environmental Audio Intelligence

TRINETRA shall use an audio classification model to identify potentially relevant environmental sounds.

Proposed model:

- YAMNet.

Potential sound categories:

- Human distress sounds.
- Screaming.
- Cries for help.
- Impact-like sounds.
- Other relevant environmental audio events.

Audio detection shall be permission-based and clearly indicated to the user.

Audio classifications shall be treated as supporting evidence rather than proof of an emergency.

## FR-07: Emergency Incident Management

The application shall create an incident when a user manually activates SOS or when an authorized automated detection workflow escalates.

Each incident shall contain:

- Incident ID.
- User ID.
- Hiking session ID.
- Incident type.
- Incident timestamp.
- GPS coordinates, when available.
- Last-known location.
- Triage assessment.
- Vital estimates, if available.
- Detection source.
- Emergency priority.
- Incident status.
- Synchronization status.

Possible incident statuses:

- Detected.
- Awaiting Confirmation.
- Emergency Initiated.
- Assistance Requested.
- Acknowledged.
- Resolved.
- Cancelled.

## FR-08: Multi-Agent Intelligence System

TRINETRA shall integrate Fetch.ai Agentverse for specialized emergency intelligence tasks.

Proposed agents:

### Location Intelligence Agent

Responsibilities:

- Process incident coordinates.
- Identify nearby medical facilities.
- Identify available location information.
- Provide relevant geographic context.

### Medical Intelligence Agent

Responsibilities:

- Organize triage information.
- Identify emergency warning signs using approved rules.
- Generate structured incident summaries.
- Suggest appropriate escalation pathways.

### Route Intelligence Agent

Responsibilities:

- Analyze available hiking route information.
- Identify relevant access routes.
- Assist in locating nearby rescue access points.

### Emergency Coordination Agent

Responsibilities:

- Coordinate the emergency workflow.
- Organize incident information.
- Track task completion.
- Prepare structured reports.

### Communication Agent

Responsibilities:

- Prepare emergency notification payloads.
- Coordinate permitted notification workflows.
- Track delivery results.

Agent outputs shall be informational and shall not delay immediate emergency escalation.

When internet access is unavailable, agent tasks shall remain queued for later processing.

## FR-09: Emergency Communication

TRINETRA shall provide emergency notification through configured communication services.

Proposed integrations:

- Twilio SMS.
- Twilio Voice.
- ElevenLabs voice generation.

Emergency notifications may contain:

- User name.
- Emergency type.
- Incident timestamp.
- GPS coordinates.
- Location link.
- Injury assessment summary.
- Contact information.

The application shall maintain notification logs.

Possible delivery statuses:

- Pending.
- Processing.
- Sent.
- Delivered, when confirmed by provider.
- Failed.
- Retry Scheduled.

Private service credentials must only be stored in secure server-side environments.

Satellite communication is a future extension and will only be supported through compatible device, carrier and satellite-provider capabilities. It is not assumed to be available on every smartphone.

## FR-10: Offline-First Storage and Synchronization

The mobile application shall store essential incident data locally using Expo SQLite.

Offline capabilities:

- Hiking session records.
- Incident creation.
- Structured triage responses.
- Last-known location.
- Pending notification requests.
- Synchronization queue.

When internet connectivity returns:

1. The application checks pending records.
2. Records are synchronized with Supabase.
3. Duplicate submissions are prevented through unique incident identifiers and idempotency controls.
4. Synchronization status is updated.
5. The web dashboard receives available updates through Supabase Realtime.

Emergency communication cannot be guaranteed without an available communication channel.

## FR-11: Real-Time Web Dashboard

The web application shall provide an emergency monitoring interface.

Dashboard information:

- Total registered hikers.
- Active hiking sessions.
- Total incidents.
- Active emergencies.
- Resolved incidents.
- Pending notifications.
- Recent incident activity.

The dashboard shall subscribe to authorized Supabase Realtime events.

## FR-12: Interactive Rescue Map

The web platform shall provide an interactive map displaying:

- Hiker locations.
- Incident coordinates.
- Nearby hospitals.
- Medical facilities.
- Relevant hiking trails.
- Potential rescue access points.

The map shall use available geographic data and mapping services.

Location information must be timestamped to distinguish current positions from last-known positions.

## FR-13: AI Assessment Dashboard

Authorized dashboard users shall be able to inspect incident reports.

Information displayed:

- Incident overview.
- Detection source.
- Triage transcript.
- Structured assessment.
- Estimated vital readings.
- Emergency priority.
- Agent-generated findings.
- Emergency response timeline.

## FR-14: Agent Monitoring Dashboard

The web platform shall display:

- Available agents.
- Agent status.
- Task assignments.
- Task execution history.
- Agent outputs.
- Processing failures.
- Pending tasks.

Simulated agent activity must be clearly identified as simulated.

## FR-15: Communication Dashboard

The website shall display:

- Emergency contacts.
- SMS history.
- Voice-call history.
- Delivery status.
- Notification timestamps.
- Retry history.
- Incident associations.

# 8. Website Requirements

The TRINETRA web application shall include the following pages.

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing Page | Introduce TRINETRA |
| `/login` | Authentication | User login |
| `/dashboard` | Command Center | Emergency overview |
| `/incidents` | Incident Management | Browse incidents |
| `/incidents/[id]` | Incident Details | Full emergency report |
| `/map` | Rescue Map | Geographic visualization |
| `/agents` | Agent Intelligence | Multi-agent monitoring |
| `/communications` | Communication Center | Notification history |
| `/analytics` | Analytics | Safety statistics |
| `/settings` | Settings | Platform configuration |

The interface shall use a modern, responsive design with a consistent visual identity.

# 9. Mobile Application Requirements

The Android and iOS application shall include:

| Screen | Purpose |
|---|---|
| Splash Screen | Brand introduction |
| Onboarding | Explain safety capabilities |
| Authentication | User login |
| Home | Safety overview |
| Hiking Session | Start and manage monitoring |
| Emergency SOS | Manual emergency activation |
| AI Voice Assistant | Offline triage |
| Vital Monitoring | Heart-rate estimation |
| Incident Details | Review emergency information |
| Emergency Contacts | Manage trusted contacts |
| Session History | Previous hiking sessions |
| Settings | Permissions and preferences |

The application shall clearly communicate permission requirements and background monitoring limitations on both platforms.

# 10. Supabase Database Design

Supabase shall act as the central cloud backend.

Proposed database tables:

### profiles

- id
- full_name
- email
- phone
- avatar_url
- created_at

### emergency_contacts

- id
- user_id
- contact_name
- phone_number
- relationship
- priority
- created_at

### hiking_sessions

- id
- user_id
- start_time
- end_time
- start_location
- end_location
- status
- created_at

### incidents

- id
- user_id
- session_id
- incident_type
- latitude
- longitude
- last_known_location_at
- priority
- status
- detection_source
- created_at
- synced_at

### triage_assessments

- id
- incident_id
- consciousness_status
- breathing_difficulty
- bleeding_status
- injury_location
- mobility_status
- pain_level
- assessment_summary
- created_at

### vital_readings

- id
- incident_id
- heart_rate_estimate
- signal_quality
- measurement_duration
- recorded_at

### agent_tasks

- id
- incident_id
- agent_name
- task_type
- status
- input_data
- output_data
- created_at
- completed_at

### notifications

- id
- incident_id
- contact_id
- channel
- recipient
- provider_reference
- status
- error_message
- created_at
- updated_at

### location_history

- id
- session_id
- latitude
- longitude
- accuracy
- recorded_at

All tables containing personal or emergency information shall use appropriate Row Level Security policies.

# 11. Technology Stack

## Frontend

Website:
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Recharts.
- React Leaflet.

Mobile:
- React Native.
- Expo.
- TypeScript.
- Expo Router.
- Zustand.
- Expo SQLite.

## Backend

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Realtime.
- Supabase Storage.
- Supabase Edge Functions.

## AI and Machine Learning

- ZETIC SDK, subject to integration compatibility.
- Compatible local Qwen model.
- YAMNet.
- Native sensor processing.
- Camera PPG processing.

## Multi-Agent System

- Fetch.ai Agentverse.
- Specialized task-oriented agents.

## Communication

- Twilio SMS.
- Twilio Voice.
- ElevenLabs.

## Mapping

- OpenStreetMap.
- Leaflet.
- GPS location services.

## Deployment

- Vercel for the website.
- Supabase for the cloud backend.
- Expo EAS for mobile builds.
- A secure backend service where integrations exceed Edge Function requirements.

# 12. System Workflow

## Normal Hiking Workflow

1. User opens TRINETRA.
2. User authenticates.
3. User starts a hiking safety session.
4. Application obtains permitted location and sensor access.
5. Local monitoring begins.
6. Session information is stored locally.
7. Available information is synchronized with Supabase.

## Potential Fall Workflow

1. Motion sensors detect a potential fall.
2. The fall detection algorithm evaluates the event.
3. Application presents an emergency confirmation prompt.
4. User confirms or fails to respond within the configured countdown.
5. Incident is created and stored locally.
6. AI triage begins where available.
7. Incident details are prepared.
8. Emergency contacts are notified through the configured workflow.
9. Available agent tasks process geographic and incident information.
10. The incident appears on the web dashboard after synchronization.

Critical emergency escalation must not wait for optional AI, agent or cloud processing.

## Offline Emergency Workflow

1. Internet connectivity is unavailable.
2. A potential emergency is detected or SOS is manually activated.
3. Incident is saved to local SQLite.
4. Offline triage runs using the locally available model or structured questions.
5. Last-known location is attached when available.
6. Pending cloud tasks are queued.
7. User sees the current connectivity and communication limitations.
8. When connectivity returns, the incident synchronizes with Supabase.
9. Authorized web users receive the incident update.

# 13. Hackathon Demonstration Mode

TRINETRA shall include a dedicated Demo Mode for judges.

The mode shall demonstrate the entire emergency workflow without requiring a real accident or contacting real emergency services.

Demonstration scenarios:

### Scenario 1: Hiking Fall

- Simulated fall detection.
- Emergency countdown.
- User confirmation.
- AI triage.
- Incident creation.
- Dashboard synchronization.

### Scenario 2: Critical Emergency

- Simulated unconscious hiker.
- Critical warning signs.
- Emergency escalation workflow.
- Agent coordination.
- Notification history.

### Scenario 3: Remote Trail Without Internet

- Simulated network disconnection.
- Local incident creation.
- Offline assessment.
- Pending synchronization indicator.
- Reconnection and cloud synchronization.

### Scenario 4: Rescue Coordination

- Incident location visualization.
- Nearby medical facility identification.
- Agent task execution.
- Emergency report generation.
- Communication status display.

All simulated incidents, agent outputs, sensor events and communication statuses must be labelled as demonstrations.

Real notifications shall be disabled by default in Demo Mode.

# 14. Non-Functional Requirements

## Performance

- Fast application startup.
- Responsive website navigation.
- Efficient local sensor processing.
- Minimal unnecessary background resource consumption.
- Efficient incident synchronization.

## Reliability

- Persistent local incident storage.
- Retry mechanisms.
- Duplicate prevention.
- Clear synchronization states.
- Graceful handling of network failures.

## Security

- Supabase Row Level Security.
- Secure authentication.
- Protected emergency contact information.
- Server-side API credentials.
- Input validation.
- Rate limiting.
- Secure communication.
- Access control for administrative dashboards.

## Usability

- Simple SOS interface.
- Large emergency activation button.
- Clear status indicators.
- Minimal emergency interaction steps.
- Readable interfaces in outdoor environments.
- Clear permission explanations.

## Compatibility

- Android support.
- iOS support.
- Responsive web support.
- Different screen sizes.
- Platform-specific sensor and background execution constraints.

# 15. Privacy and Safety Considerations

TRINETRA handles sensitive location, emergency and health-related information.

Therefore:

- Location tracking requires explicit user permission.
- Microphone access requires explicit permission and clear user awareness.
- Camera access requires explicit permission.
- Emergency contacts must consent to receiving alerts.
- User data must be protected through access policies.
- Health estimates must be labelled as non-diagnostic.
- Automated fall detection must communicate uncertainty.
- Emergency escalation must follow user-configured and validated rules.
- AI-generated information must not replace professional medical advice.
- Demo Mode must not accidentally trigger real emergency communications.

The system shall not claim guaranteed emergency detection, uninterrupted background monitoring or satellite messaging on unsupported devices.

# 16. Development Priorities

## Phase 1: Core Foundation

- Project repository setup.
- Next.js website.
- Expo mobile application.
- Supabase project configuration.
- Authentication.
- Database schema.
- Shared application types.

## Phase 2: Core Safety Features

- User profiles.
- Emergency contacts.
- Hiking safety sessions.
- Manual SOS.
- Incident management.
- SQLite offline persistence.
- Supabase synchronization.

## Phase 3: Intelligence Features

- Accelerometer and gyroscope processing.
- Potential fall detection.
- Structured voice triage.
- Compatible local AI integration.
- Camera-based heart-rate estimation.

## Phase 4: Emergency Intelligence

- Fetch.ai agent integration.
- Medical facility discovery.
- Route intelligence.
- Twilio SMS.
- Voice notification integration.

## Phase 5: Website Integration

- Real-time command center.
- Incident details.
- Rescue map.
- AI assessment reports.
- Agent monitoring.
- Communication logs.
- Analytics.

## Phase 6: Final Demonstration

- Demo Mode.
- End-to-end testing.
- Offline workflow validation.
- Android testing.
- iOS testing through a suitable Mac or cloud build environment.
- Security checks.
- Final presentation preparation.

# 17. Minimum Viable Product (MVP)

The first hackathon-ready release shall prioritize the following:

**Must Have**

- Responsive TRINETRA website.
- Android and iOS mobile application.
- Supabase authentication.
- Emergency contact management.
- Hiking safety session.
- Manual SOS.
- Basic sensor-based fall detection prototype.
- Offline incident storage.
- Structured AI-assisted triage.
- Cloud synchronization.
- Live web dashboard.
- Incident details and map.
- Demo Mode.

**Should Have**

- Offline local language model.
- Fetch.ai multi-agent integration.
- Twilio SMS.
- Voice notification.
- Camera-based heart-rate estimation.

**Future Enhancements**

- YAMNet audio classification.
- Advanced route risk analysis.
- Verified rescue service integrations.
- Compatible satellite communication support.
- Group hiking safety.
- Predictive environmental risk intelligence.
- Additional language support.

# 18. Success Criteria

The hackathon MVP will be considered successful when:

1. A user can create an account and configure emergency contacts.
2. A user can start a hiking safety session.
3. A potential fall can trigger the confirmation workflow.
4. A user can manually activate SOS.
5. An incident can be saved without internet connectivity.
6. The application can synchronize a pending incident with Supabase.
7. The website can display the synchronized incident.
8. The incident report displays available location and triage information.
9. The emergency workflow can be demonstrated end to end.
10. Simulated and real operations are clearly distinguished.

# 19. Expected Impact

TRINETRA aims to improve outdoor safety by reducing dependence on manual emergency reporting and continuous internet connectivity.

By combining mobile sensor intelligence, offline AI assessment, intelligent emergency coordination and connected monitoring, the platform seeks to make emergency assistance more accessible to people exploring remote environments.

The platform also provides a foundation for future integration with hiking organizations, rescue teams, healthcare facilities and outdoor adventure operators.

# 20. Product Vision

TRINETRA aims to become an intelligent safety companion for people exploring environments where help may be difficult to reach.

Its vision is to combine sensing, intelligence and emergency coordination into one reliable ecosystem.

**TRINETRA — See the Danger. Sense the Risk. Save a Life.**