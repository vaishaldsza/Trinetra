# Translation Review Items (Emergency & Medical Vocabulary)

This document catalogs emergency, medical, triage, and sensor terminology across English, Hindi (`hi`), and Kannada (`kn`) that should be reviewed and verified by native speakers and wilderness medical personnel.

---

## 1. Hindi (`hi`) Review Items

| Translation Key | English Source | Hindi Translation | Review Notes // REVIEW |
| :--- | :--- | :--- | :--- |
| `common.tagline` | See the Danger. Sense the Risk. Save a Life. | खतरा पहचानें। जोखिम भांपें। जीवन बचाएं। | // REVIEW: Verify cadence and tone for emergency app tagline. |
| `triage.question1_title` | 1. Consciousness & Responsiveness | 1. चेतना और प्रतिक्रिया | // REVIEW: Confirm colloquial clarity for hikers in distress. |
| `triage.consciousness_dazed` | Dazed / Confused | चक्कर / भ्रमित (Dazed) | // REVIEW: Kept English in parens for unambiguous responder interpretation. |
| `triage.consciousness_unresponsive` | Unresponsive | बेहोश / अनुत्तरदायी (Unresponsive) | // REVIEW: Critical emergency sign; ensure unambiguous understanding. |
| `triage.question2_speak` | Are you experiencing breathing difficulty? | क्या आपको सांस लेने में तकलीफ हो रही है? | // REVIEW: Spoken voice guidance for hypoxia / respiratory distress. |
| `triage.breathing_difficulty` | Labored / Shortness | सांस लेने में भारी तकलीफ (Labored) | // REVIEW: High priority triage trigger. |
| `triage.bleeding_severe` | Severe bleeding | गंभीर रक्तस्राव (Severe) | // REVIEW: Critical clinical escalation trigger. |
| `triage.mobility_immobilized` | Immobilized | चलने में असमर्थ (Immobilized) | // REVIEW: Rescue extraction determinant. |
| `triage.critical_alert_badge` | CRITICAL EVALUATION | अत्यंत गंभीर मूल्यांकन | // REVIEW: Triage status badge translation. |
| `vitals.title` | Camera Vital Estimation (PPG) | कैमरा पल्स माप (PPG) | // REVIEW: Photoplethysmography translation. |
| `vitals.disclaimer` | NON-DIAGNOSTIC ESTIMATE | गैर-नैदानिक अनुमान | // REVIEW: Regulatory health disclaimer wording. |
| `fall.title` | POTENTIAL FALL DETECTED | संभावित गिरावट का पता चला | // REVIEW: Motion sensor alert headline. |

---

## 2. Kannada (`kn`) Review Items

| Translation Key | English Source | Kannada Translation | Review Notes // REVIEW |
| :--- | :--- | :--- | :--- |
| `common.tagline` | See the Danger. Sense the Risk. Save a Life. | ಅಪಾಯವನ್ನು ಗುರುತಿಸಿ. ರಿಸ್ಕ್ ಗ್ರಹಿಸಿ. ಜೀವ ಉಳಿಸಿ. | // REVIEW: Verify natural phrasing and outdoor urgency. |
| `triage.question1_title` | 1. Consciousness & Responsiveness | 1. ಪ್ರಜ್ಞೆ ಮತ್ತು ಸ್ಪಂದನೆ | // REVIEW: Wilderness triage responsiveness terminology. |
| `triage.consciousness_dazed` | Dazed / Confused | ತಲೆತಿರುಗಿದೆ / ಗೊಂದಲದಲ್ಲಿದ್ದಾರೆ (Dazed) | // REVIEW: Medical confusion / shock terminology. |
| `triage.consciousness_unresponsive` | Unresponsive | ಪ್ರಜ್ಞಾಹೀನ / ಸ್ಪಂದಿಸುತ್ತಿಲ್ಲ (Unresponsive) | // REVIEW: Critical sign; vital for life-threatening triage. |
| `triage.breathing_difficulty` | Labored / Shortness | ಉಸಿರಾಟದಲ್ಲಿ ತೀವ್ರ ತೊಂದರೆ (Difficulty) | // REVIEW: Asthma / pulmonary edema symptom terminology. |
| `triage.bleeding_severe` | Severe bleeding | ತೀವ್ರ ರಕ್ತಸ್ರಾವ (Severe) | // REVIEW: Hemorrhage sign escalation. |
| `triage.mobility_immobilized` | Immobilized | ಚಲಿಸಲಾಗದು (Immobilized) | // REVIEW: Musculoskeletal fracture indicator. |
| `triage.critical_alert_badge` | CRITICAL EVALUATION | ಅತ್ಯಂತ ತುರ್ತು ಮೌಲ್ಯಮಾಪನ | // REVIEW: Priority badge translation. |
| `vitals.title` | Camera Vital Estimation (PPG) | ಕ್ಯಾಮೆರಾ ನಾಡಿಮಿಡಿತ ಅಂದಾಜು (PPG) | // REVIEW: Optical pulse measurement wording. |
| `vitals.disclaimer` | NON-DIAGNOSTIC ESTIMATE | ವೈದ್ಯಕೀಯೇತರ ಅಂದಾಜು | // REVIEW: Legal / medical disclaimer phrasing. |
| `fall.title` | POTENTIAL FALL DETECTED | ಸಂಭಾವ್ಯ ಪತನ ಪತ್ತೆಯಾಗಿದೆ | // REVIEW: Kinematic accelerometer alert phrasing. |

---

## 3. General Architecture Recommendation
- All internal database states, machine-to-machine APIs, and triage rule inputs strictly use standardized TypeScript / PostgreSQL enums (`IncidentPriority.CRITICAL`, `'Unresponsive'`, `'Severe bleeding'`).
- The localized strings above are exclusively presented in UI views and synthesized by text-to-speech engines.
