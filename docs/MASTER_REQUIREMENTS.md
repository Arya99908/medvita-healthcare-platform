# MASTER PROJECT INSTRUCTION: MEDVITA
## Complete AI-Powered, Life-Stage-Aware Healthcare Management Ecosystem

Act as a senior full-stack software architect, healthcare technology engineer, AI engineer, UI/UX designer, database architect, cybersecurity specialist and product strategist.

Your task is to DESIGN, DEVELOP, TEST AND DEPLOY a complete, professional, responsive, functional healthcare web application called:

# MEDVITA

Brand spelling: M-E-D-V-I-T-A.

Tagline: "Your Health. Your Life. One Connected Ecosystem."

This is not a landing-page-only project, a static UI demonstration or a collection of non-functional buttons.

Build a complete full-stack healthcare management platform with a real frontend, backend, database, authentication, file storage, AI functionality, dashboards, workflows, notifications, calendar, emergency assistance and deployment infrastructure.

The application must be designed to accommodate four life stages:

1. Infants and children.
2. Adolescents.
3. Adults.
4. Elderly individuals.

The long-term vision is to maintain an individual's longitudinal health profile throughout life.

Do not remove, simplify away or silently omit any functionality specified below.

If an external integration requires credentials, implement its integration interface, configuration, error handling and a clearly labelled demo mode. Never pretend an unconfigured external service is operational.

---

# PART 1 — TECHNOLOGY STACK AND INFRASTRUCTURE

Use the following technology stack unless the existing repository has a compelling compatibility requirement.

Frontend:
- Next.js with App Router.
- React.
- TypeScript with strict type checking.
- Tailwind CSS.
- shadcn/ui.
- Lucide icons.
- Responsive design for desktop, tablet and mobile.
- Accessible forms, navigation and interactive components.

Backend:
- Supabase.
- Supabase PostgreSQL.
- Supabase Authentication.
- Supabase Storage.
- Supabase Row Level Security.
- Supabase Edge Functions wherever appropriate.

AI:
- Configurable LLM API integration.
- Server-side AI calls only.
- Structured outputs using validated schemas.
- Retrieval of relevant patient history.
- Clinician-approved deterministic safety rules.
- Strict validation of AI outputs.

Deployment:
- GitHub repository.
- Vercel hosting.
- Supabase hosted backend.
- Environment-specific configurations.
- Production build and deployment verification.

Use a clean modular architecture with reusable components, maintainable code and separation of concerns.

Do not hardcode API keys, passwords, service-role keys or other credentials in frontend code.

---

# PART 2 — BRAND IDENTITY AND USER INTERFACE

Create a premium, modern, professional healthcare technology interface.

The product should feel like a combination of a high-quality digital hospital system, personal health dashboard and modern family-care application.

Brand:
MEDVITA.

Suggested design direction:
- Deep navy blue.
- Teal.
- Emerald green.
- White and subtle neutral backgrounds.
- Clear typography.
- Professional medical icons.
- Soft shadows.
- Rounded but restrained cards.
- Consistent spacing.
- Smooth transitions.
- Minimal visual clutter.

Design requirements:
- Professional desktop dashboard.
- Excellent mobile experience.
- Sidebar navigation on desktop.
- Bottom navigation or mobile drawer on mobile.
- Clear health-status indicators.
- Interactive charts.
- Search and filters.
- Loading states.
- Empty states.
- Error states.
- Confirmation dialogs.
- Success notifications.
- Form validation.

Do not make the interface look like a generic template.

Create a consistent MEDVITA brand identity across every page, including login, registration, dashboards, medical reports and emergency screens.

---

# PART 3 — USER ROLES AND AUTHENTICATION

Implement complete authentication using Supabase.

User roles:

1. Patient.
2. Parent or legal guardian.
3. Family member.
4. Primary caregiver.
5. Professional nurse or caregiver.
6. Doctor.
7. Hospital or clinic administrator.
8. Platform administrator.

Authentication functionality:
- Registration.
- Login.
- Logout.
- Email verification.
- Password reset.
- Session persistence.
- Profile management.
- Role-based onboarding.
- Account deletion and data export workflows.
- Multi-factor authentication support where appropriate.

A user must be able to manage more than one patient profile when authorised.

Examples:
- A parent managing two children.
- A daughter managing an elderly parent.
- A caregiver managing multiple assigned patients.

Implement granular role-based permissions.

A caregiver should not automatically be able to edit a doctor's prescription.

Sensitive adolescent health records must have separate privacy and consent controls. Do not automatically expose sensitive adolescent entries to parents.

Implement account access revocation and audit logs.

---

# PART 4 — UNIVERSAL PERSONAL HEALTH PROFILE

Every patient must have a unified health profile.

Information fields:

Personal:
- Full name.
- Date of birth.
- Age, calculated appropriately.
- Sex and relevant clinical information, when voluntarily supplied.
- Contact details.
- Address, where required.
- Emergency contacts.
- Preferred language.

Medical:
- Blood group, if verified.
- Known allergies.
- Existing conditions.
- Previous diagnoses.
- Surgical history.
- Family medical history.
- Current medication list.
- Past prescriptions.
- Hospital admissions.
- Laboratory reports.
- Imaging reports.
- Vaccination history.
- Doctor information.

Lifestyle:
- Sleep.
- Physical activity.
- Food habits.
- Hydration.
- Relevant health observations.

Build a chronological health timeline.

Each health event must have:
- Date and time.
- Event type.
- Description.
- Source.
- Associated documents.
- Relevant clinical notes.
- Verification status.

The system must distinguish patient-reported information, caregiver-entered information, imported documents and verified clinician-entered information.

---

# PART 5 — CHILD AND INFANT HEALTH MODULE

Create a dedicated child health dashboard.

Features:

1. Feeding tracker:
   - Breastfeeding.
   - Formula feeding.
   - Milk quantity.
   - Feeding duration.
   - Feeding frequency.
   - Feeding observations.

2. Bowel movement tracker:
   - Frequency.
   - Stool consistency.
   - Colour.
   - Unusual observations.
   - Loose stools and diarrhoeal episodes.

3. Vomiting tracker:
   - Frequency.
   - Time.
   - Associated symptoms.
   - Severity and observations.

4. Urination and wet diaper tracking.

5. Temperature recording.

6. Sleep tracking.

7. Growth tracking:
   - Weight.
   - Height or length.
   - Head circumference.
   - Age-appropriate growth charts.

8. Vaccination calendar:
   - Previous vaccinations.
   - Upcoming vaccinations.
   - Reminders.
   - Vaccination documentation.

9. Developmental milestones:
   - Age-appropriate milestones.
   - Parent observations.
   - Follow-up reminders.

10. Pediatric consultation history.

AI functionality:
- Summarise recorded symptoms.
- Identify changes in feeding or symptom frequency.
- Highlight concerning combinations of observations.
- Provide age-appropriate educational guidance.
- Identify missing information.
- Generate pediatric consultation summaries.

Use clinically validated pediatric guidance.

Do not diagnose children or recommend medication dosages independently.

Provide clear urgent-care escalation for concerning symptoms, particularly dehydration, breathing difficulty, unusual drowsiness and other clinician-defined warning signs.

---

# PART 6 — ADOLESCENT HEALTH MODULE

Create a dedicated adolescent wellness section.

Female adolescent health:
- Menstrual cycle calendar.
- Period start and end dates.
- Cycle duration.
- Flow observations.
- Menstrual cramps.
- Associated symptoms.
- Irregularity tracking.
- Menstrual health education.
- Relevant consultation reminders.

Male adolescent health:
- Puberty education.
- General physical development education.
- Skin and acne tracking.
- Hygiene.
- Emotional wellbeing.
- Body image education.
- Sexual wellness education.
- Reproductive health education.

Common adolescent functionality:
- Sleep.
- Nutrition.
- Exercise.
- Emotional wellness.
- Healthy habits.
- Private health journal.
- Relevant medical appointments.

PRIVACY REQUIREMENT:

Implement age-appropriate consent, confidentiality and safeguarding.

Sensitive reproductive health information must not automatically be disclosed to every linked parent or guardian.

Provide appropriate access restrictions and follow applicable Indian legal requirements.

Never use AI to make unsupported conclusions about an adolescent's sexual activity, puberty status or reproductive health.

---

# PART 7 — ADULT HEALTH MANAGEMENT

Create an adult health dashboard.

Features:
- Personal health profile.
- Chronic condition records.
- Blood pressure tracking.
- Blood glucose tracking.
- Weight tracking.
- Physical activity.
- Sleep.
- Medication management.
- Diet and hydration observations.
- Preventive screening reminders.
- Laboratory reports.
- Doctor visits.
- Medical history.

Initially support hypertension and diabetes as demonstration workflows.

Provide trend charts and historical comparisons.

Allow additional conditions to be configured without redesigning the application.

---

# PART 8 — ELDERLY CARE MANAGEMENT

This must be one of the most complete and polished modules.

Features:

1. Complete medical profile.
2. Multiple chronic condition tracking.
3. Medication management.
4. Symptom monitoring.
5. Hospitalisation history.
6. Discharge summaries.
7. Laboratory reports.
8. Doctor information.
9. Caregiver information.
10. Family member connections.
11. Emergency contacts.
12. Follow-up appointments.
13. Mobility and walking observations.
14. Falls and inactivity logs.
15. Vomiting and bowel movement frequency.
16. Appetite and hydration observations.
17. Sleep tracking.
18. Vital signs.
19. Caregiver notes.
20. Health handover reports.

Create a dedicated elderly-care dashboard showing:
- Current health overview.
- Today's care tasks.
- Medication schedule.
- Recent symptoms.
- Upcoming appointments.
- Caregiver availability.
- Recent alerts.
- Emergency access.

---

# PART 9 — MEDICATION MANAGEMENT SYSTEM

Build a fully functional medicine-management module.

Fields:
- Medicine name.
- Generic name, when known.
- Strength.
- Prescribed dosage.
- Route.
- Frequency.
- Administration timing.
- Duration.
- Start date.
- End date.
- Prescribing doctor.
- Prescription attachment.
- Additional instructions.

Features:
- Medicine reminders.
- Medication schedule.
- Taken/not taken logging.
- Missed-dose logging.
- Medication history.
- Refill reminders.
- Discontinued medication history.
- Multiple prescriptions.
- Medicine search.
- Caregiver administration log.
- Medication reconciliation.

Flag:
- Potential duplicate medicines.
- Conflicting prescription information.
- Missing prescription details.
- Possible interaction concerns for professional verification.

Do not independently modify or prescribe medication.

Any interaction checking must use a verified medication knowledge source or appropriately licensed integration.

Never invent medication interactions or safety claims.

---

# PART 10 — AI LONGITUDINAL HEALTH INTELLIGENCE ENGINE

This is a core feature of MEDVITA.

Build an AI-assisted health intelligence system that analyses a patient's recorded history over time.

It must be able to:

1. Read authorised patient records.
2. Analyse structured symptoms.
3. Summarise previous medical history.
4. Compare current and historical symptoms.
5. Identify changes in frequency.
6. Identify relevant trends in recorded measurements.
7. Organise medication history.
8. Summarise laboratory reports.
9. Highlight missing clinical information.
10. Generate consultation summaries.
11. Generate doctor-facing reports.
12. Suggest relevant questions to discuss with doctors.
13. Provide understandable medical terminology explanations.
14. Generate personalised wellness education within safe boundaries.
15. Maintain a dated history of generated summaries.

AI architecture:

Layer 1: Data collection.

Layer 2: Structured data processing.

Layer 3: Patient-history retrieval.

Layer 4: Clinician-approved knowledge retrieval.

Layer 5: Deterministic clinical safety rules.

Layer 6: AI-generated summaries.

Layer 7: Human-reviewed follow-up workflows.

AI must clearly distinguish:
- Confirmed medical diagnoses.
- Patient-reported symptoms.
- Caregiver observations.
- AI-generated interpretations.
- Clinician recommendations.

Every AI report should include:
- Relevant data sources.
- Date range analysed.
- Missing information.
- Uncertainty.
- Safety limitations.
- Recommended next step.

IMPORTANT CLINICAL SAFETY:

MEDVITA must not present itself as an autonomous doctor.

The AI must not independently:
- Diagnose disease.
- Prescribe medicines.
- Change medication dosage.
- Stop medication.
- Replace medical consultation.
- Guarantee patient safety.

High-risk symptoms must trigger deterministic escalation workflows based on clinician-approved rules, not unrestricted LLM judgement.

Never allow AI-generated content to override an emergency warning.

---

# PART 11 — REMEDIES AND PERSONAL WELLNESS CENTRE

Create a dedicated module called:

"MEDVITA REMEDIES & WELLNESS"

This section must be accessible from the main dashboard.

Its purpose is to provide safe, personalised, educational wellness guidance based on the patient's age, documented conditions, preferences and relevant health history.

Organise the entire section into THREE MAIN CATEGORIES.

## A. EXERCISE

Features:
- Age-appropriate physical activity recommendations.
- Walking routines.
- Flexibility exercises.
- Mobility exercises.
- Strength-building education.
- Balance exercises for elderly users.
- Posture and ergonomic guidance.
- Gentle activity recommendations.
- Exercise progress tracking.
- Weekly activity calendar.
- Exercise completion logs.

For children:
- Age-appropriate play and movement guidance.

For adolescents:
- Healthy physical activity and fitness education.

For adults:
- General fitness and condition-aware activity education.

For elderly people:
- Gentle mobility, balance and fall-prevention education.

Do not recommend exercise that conflicts with known medical restrictions.

For users with serious conditions, recent surgery, falls, severe symptoms or mobility limitations, recommend professional assessment before starting an exercise programme.

## B. FOOD AND NUTRITION

Features:
- Healthy meal suggestions.
- Balanced diet education.
- Hydration guidance.
- Food habit tracking.
- Meal planning.
- Dietary preference settings.
- Allergy-aware food suggestions.
- Age-appropriate nutrition guidance.
- Condition-aware educational recommendations.

Separate recommendations for:
- Children.
- Adolescents.
- Adults.
- Elderly patients.

Allow users to record:
- Breakfast.
- Lunch.
- Dinner.
- Snacks.
- Water intake.
- Food-related symptoms.

Consider relevant recorded medical conditions, allergies and dietary restrictions.

Do not generate unsafe diets, extreme calorie restrictions or unsupported therapeutic diets.

Do not recommend supplements or medicines as treatment.

## C. HABITS AND LIFESTYLE

Features:
- Sleep routines.
- Hydration habits.
- Medication adherence habits.
- Walking frequency.
- Personal hygiene.
- Stress-management education.
- Screen-time awareness.
- Smoking cessation education.
- Healthy daily routines.
- Relaxation techniques.
- Consistent follow-up habits.

Create:
- Daily habit tracker.
- Weekly progress report.
- Monthly wellness report.
- Habit streaks.
- Personal goals.
- Reminder notifications.

## Remedy discovery workflow

Create a search and recommendation interface.

A user should be able to:
1. Select or describe a general wellness concern.
2. View relevant educational information.
3. Explore exercise recommendations.
4. Explore food recommendations.
5. Explore lifestyle and habit recommendations.
6. Save relevant suggestions.
7. Add a selected habit to the personal calendar.
8. Track progress.

Every recommendation must display:
- Why it is suggested.
- Intended age group.
- Relevant medical limitations.
- When to stop and seek professional advice.
- Whether clinician approval is required.

CRITICAL:

Do not present home remedies as cures.

Do not recommend unverified traditional remedies, unsafe fasting, medication substitution or unsupported treatments.

Distinguish low-risk general wellness education from condition-specific medical advice.

If a user describes emergency symptoms, do not show routine remedies as the primary response. Display emergency escalation instructions instead.

---

# PART 12 — EMERGENCY ASSISTANCE AND AMBULANCE CALLING

Create a highly visible emergency section throughout MEDVITA.

Implement a prominent emergency button labelled:

"CALL AMBULANCE"

Also provide:
- SOS.
- Call primary caregiver.
- Call secondary caregiver.
- Emergency contact list.
- Share location.
- Emergency medical summary.
- Emergency notification history.

## Ambulance workflow

When the user selects CALL AMBULANCE:

1. Display an immediate emergency confirmation interface.
2. Show the configured local emergency calling number.
3. Initiate the phone dialler through a supported tel: link.
4. Do not silently call without appropriate user interaction.
5. Offer location sharing, subject to permission.
6. Notify designated emergency contacts where configured.
7. Display the patient's emergency medical profile.
8. Record the alert event.
9. Provide a secondary caregiver escalation option.

For India, support configurable emergency numbers, including 112 and regionally applicable ambulance services such as 108.

Do not assume every region has the same ambulance provider.

The administrator must be able to configure:
- Country.
- State.
- Region.
- Emergency number.
- Ambulance provider.
- Emergency contact escalation rules.

Where supported, implement SMS, WhatsApp or voice-call integrations through verified providers and explicit configuration.

If these integrations are unavailable, clearly label the workflow as a prototype or device-assisted function.

Do not claim that an ambulance has been dispatched merely because a user clicked the button.

## Emergency medical card

Create a quick-access medical emergency summary containing:
- Patient name.
- Age.
- Relevant conditions.
- Known allergies.
- Current medication list.
- Emergency contacts.
- Preferred hospital.
- Other relevant medical information.

Implement a privacy-conscious emergency access mechanism.

## Physical buzzer roadmap

Design the application architecture to support a future Bluetooth emergency button or wearable.

Do not claim hardware connectivity until actual hardware testing is completed.

---

# PART 13 — CAREGIVER AND FAMILY MANAGEMENT

Create a full caregiver-management system.

Features:
- Add caregiver.
- Invite family member.
- Assign patient access.
- Define roles.
- Define permissions.
- Record care tasks.
- Record medicine administration.
- Record feeding and hydration.
- Record symptoms.
- Record daily observations.
- Track completed tasks.
- Track missed tasks.
- Emergency contact escalation.

Create a caregiver activity timeline.

Add a HEALTH HANDOVER feature.

It should generate a handover summary containing:
- Current medical conditions.
- Current prescriptions.
- Recent symptoms.
- Upcoming appointments.
- Pending investigations.
- Doctor's instructions.
- Emergency contacts.

The family should be able to transfer caregiving responsibilities with a clear record of the handover.

---

# PART 14 — COMPLETE MEDICAL CALENDAR AND APPOINTMENT MANAGEMENT

Create a dedicated MEDVITA CALENDAR.

This is a core application module, not an optional feature.

The calendar must be accessible through the main navigation and dashboard.

Support:
- Monthly view.
- Weekly view.
- Daily view.
- Agenda view.

## Event types

1. Doctor appointments.
2. Hospital visits.
3. Hospital admissions.
4. Discharge dates.
5. Laboratory tests.
6. Imaging appointments.
7. Vaccination appointments.
8. Follow-up consultations.
9. Medication schedules.
10. Medicine refill dates.
11. Exercise sessions.
12. Meal and nutrition reminders.
13. Personal wellness goals.
14. Caregiver visits.
15. Home nursing visits.
16. Medical procedures.
17. Therapy sessions.
18. General health events.

## Calendar functionality

Allow users to:
- Create events.
- Edit events.
- Delete events.
- Reschedule appointments.
- Set start and end times.
- Add location.
- Add doctor information.
- Add hospital information.
- Attach relevant documents.
- Add notes.
- Select patient profile.
- Assign a caregiver.
- Mark attendance.
- Mark an event completed.
- Mark an event missed.
- Record cancellation.

## Reminders

Support:
- Advance reminders.
- Same-day reminders.
- Custom reminders.
- Push notifications where configured.
- Email reminders where configured.
- Caregiver notifications where authorised.

Include time-zone-aware scheduling.

Prevent duplicate reminders.

Create recurring event support for appropriate events.

## Calendar intelligence

Allow AI to summarise:
- Upcoming appointments.
- Missed visits.
- Pending investigations.
- Overdue follow-ups.
- Upcoming medication refills.

Do not automatically reschedule medical appointments.

Allow the user to export their calendar in a standard format such as ICS.

---

# PART 15 — MEDICAL DOCUMENT MANAGEMENT

Create a complete document-management section.

Allow uploads of:
- Prescriptions.
- Laboratory reports.
- Imaging reports.
- Discharge summaries.
- Vaccination certificates.
- Consultation notes.
- Other relevant medical documents.

Use Supabase Storage with secure access controls.

Implement:
- Upload.
- Preview.
- Download.
- Delete, subject to retention requirements.
- Categorisation.
- Date tagging.
- Patient association.
- Doctor association.
- Document search.

Implement OCR and document extraction.

Extract:
- Document type.
- Date.
- Patient details where present.
- Medicine names.
- Laboratory values.
- Reference ranges.
- Doctor details.
- Relevant findings.

Require user verification before extracted information becomes part of the structured medical record.

Never treat OCR output as a confirmed medical fact.

---

# PART 16 — DOCTOR AND HOSPITAL DASHBOARD

Create a separate professional dashboard.

Features:
- Doctor registration.
- Professional profile.
- Patient invitation.
- Authorised patient list.
- Patient medical timeline.
- Medication list.
- Recent symptoms.
- Uploaded reports.
- Consultation summaries.
- Clinical notes.
- Follow-up recommendations.
- Appointment management.

Doctors must only access records for patients who have granted appropriate access.

Provide the ability to:
- Review AI-generated summaries.
- Correct inaccurate information.
- Add clinical notes.
- Record updated treatment instructions.
- Schedule follow-ups.
- Generate patient reports.

AI-generated information must remain clearly distinguishable from clinician-authored records.

---

# PART 17 — NOTIFICATION SYSTEM

Build a central notification engine.

Notification categories:
- Medication reminders.
- Missed medications.
- Upcoming appointments.
- Missed appointments.
- Follow-up reminders.
- Vaccination reminders.
- Caregiver task reminders.
- Emergency alerts.
- Wellness reminders.
- Document processing status.

Support:
- In-app notifications.
- Email notifications.
- Push notifications where configured.
- SMS integration where configured.

Allow users to manage notification preferences.

Implement duplicate prevention, retries and delivery logs.

---

# PART 18 — ANALYTICS AND HEALTH REPORTS

Create interactive patient analytics.

Charts:
- Weight trends.
- Blood pressure trends.
- Blood glucose trends.
- Symptom frequency.
- Medication adherence.
- Sleep trends.
- Physical activity.
- Feeding trends.
- Growth trends.
- Menstrual cycle history.
- Wellness habit progress.

Generate:
- Weekly reports.
- Monthly reports.
- Doctor consultation reports.
- Caregiver activity reports.
- Medication adherence reports.
- Health event summaries.

Allow secure PDF export.

Every report must display its date range and the source of its underlying information.

Do not imply that an incomplete dataset is a complete representation of the patient's health.

---

# PART 19 — SUPABASE DATABASE DESIGN

Create a properly normalised PostgreSQL database.

Design migrations for at least the following logical entities:

- profiles
- user_roles
- patient_profiles
- patient_relationships
- guardianships
- consent_records
- access_permissions
- audit_logs
- medical_conditions
- allergies
- medical_history
- symptoms
- symptom_observations
- vitals
- feeding_records
- bowel_movement_records
- vomiting_records
- growth_records
- menstrual_records
- medication_records
- prescriptions
- medication_schedules
- medication_administration_logs
- medical_documents
- extracted_document_data
- laboratory_results
- hospital_visits
- hospital_admissions
- discharge_summaries
- doctors
- hospitals
- caregiver_assignments
- caregiver_tasks
- caregiver_handover_records
- appointments
- calendar_events
- event_reminders
- wellness_plans
- exercise_records
- nutrition_records
- habit_records
- wellness_recommendations
- AI_reports
- AI_analysis_sources
- emergency_contacts
- emergency_alerts
- notification_preferences
- notifications
- patient_sharing_sessions

Use UUID primary keys.

Include:
- Foreign keys.
- Appropriate indexes.
- Created timestamps.
- Updated timestamps.
- Status fields.
- Soft deletion where appropriate.
- Data retention considerations.
- Auditability.

Use migrations rather than manually creating tables in the production dashboard.

Implement Row Level Security for every sensitive table.

Verify that one patient cannot access another patient's information.

Verify that caregivers cannot access unassigned patients.

Verify that doctors cannot access records without appropriate authorisation.

Never expose the Supabase service-role key to the client.

---

# PART 20 — SECURITY AND PRIVACY

Implement privacy and security from the beginning.

Requirements:
- Secure authentication.
- Row Level Security.
- Encryption in transit.
- Appropriate encryption at rest.
- Private storage buckets.
- Signed URLs with short expiry.
- Role-based authorisation.
- Access logs.
- Consent records.
- Revocable sharing.
- Secure server-side API routes.
- Rate limiting.
- Input validation.
- Output validation.
- Secure session handling.
- Protection against common web vulnerabilities.
- Backup and recovery strategy.
- Data export.
- Data correction.
- Deletion workflows.

Account for applicable Indian requirements, including the Digital Personal Data Protection framework and relevant healthcare regulations.

For children's data, implement appropriate parental or lawful guardian consent workflows.

For adolescent health information, implement additional confidentiality and safeguarding protections.

Do not claim regulatory compliance merely because security features exist. Obtain appropriate legal and clinical review before production use.

---

# PART 21 — ADMINISTRATOR DASHBOARD

Create an administrative portal.

Features:
- User management.
- Role management.
- Patient access administration.
- Doctor verification workflow.
- Hospital and clinic management.
- Configurable emergency numbers.
- Clinical content management.
- Wellness content management.
- Notification management.
- System monitoring.
- AI usage monitoring.
- Audit-log review.
- Integration configuration.
- Error monitoring.
- Content update history.

Administrator permissions must be separated from ordinary patient access.

Do not allow administrators to casually browse sensitive patient records without an authorised operational reason and audit trail.

---

# PART 22 — MULTILINGUAL AND ACCESSIBILITY FEATURES

Design for Indian users.

Prepare the architecture for:
- English.
- Kannada.
- Hindi.
- Additional Indian languages.

Include:
- Language selector.
- Translation-ready content.
- Voice input capability.
- Text-to-speech support where feasible.
- Large-font accessibility.
- High-contrast options.
- Screen-reader-friendly controls.
- Simplified elderly-friendly interfaces.

Do not rely on AI translation alone for critical medical warnings.

Clinically important content must have reviewed translations.

---

# PART 23 — EXTERNAL INTEGRATIONS

Prepare modular integrations for:

- Google Calendar, where authorised.
- Email providers.
- SMS providers.
- WhatsApp Business API, where approved.
- Maps and location services.
- Compatible wearable devices.
- OCR services.
- AI providers.
- ABDM interoperability, subject to applicable approvals and technical requirements.
- Hospital systems, where partnerships and interfaces exist.

Each integration must have:
- Configuration.
- Authentication.
- Error handling.
- Logging.
- Retry handling.
- Permission management.
- A clear unavailable state.

Never fabricate successful integration.

---

# PART 24 — DEMONSTRATION MODE

Create a demonstration environment with fictional patients.

Include at least:

1. Infant patient.
2. Adolescent patient.
3. Adult patient with hypertension.
4. Elderly patient with diabetes and hypertension.

Populate each profile with realistic but fictional:
- Medical histories.
- Symptoms.
- Prescriptions.
- Appointments.
- Laboratory reports.
- Vitals.
- Caregiver relationships.
- Calendar events.

Make it possible to demonstrate all major workflows without uploading real patient information.

Clearly label demonstration data.

Provide a reset-demo-data option for authorised demonstration users.

---

# PART 25 — USER EXPERIENCE AND FUNCTIONALITY REQUIREMENTS

Every visible button must have a meaningful working action.

Every form must:
- Validate inputs.
- Save to the database.
- Display errors.
- Display success states.

Every dashboard must use real database data or explicitly labelled demonstration data.

Every chart must use actual saved records.

Every navigation link must work.

Every upload must have a real upload workflow.

Every calendar event must persist.

Every reminder must be connected to a notification workflow.

Every AI feature must have a real server-side execution path or a clearly labelled unavailable/demo state.

Do not use placeholder buttons pretending to be functional.

Do not create dead links.

Do not hide unfinished features behind misleading UI.

---

# PART 26 — TESTING AND QUALITY ASSURANCE

Create:
- Unit tests.
- Component tests.
- API tests.
- Authentication tests.
- Database permission tests.
- RLS tests.
- Form validation tests.
- Calendar tests.
- Notification tests.
- AI output validation tests.
- Emergency workflow tests.
- End-to-end tests.

Test all four life-stage workflows.

Test:
- Patient registration.
- Caregiver invitation.
- Patient profile creation.
- Medical document upload.
- Symptom recording.
- Medication logging.
- Calendar scheduling.
- Wellness recommendation saving.
- AI consultation report generation.
- Emergency dialler initiation.
- Access revocation.

Test mobile and desktop layouts.

Run:
- TypeScript checks.
- Linting.
- Production build.
- Automated tests.

Fix errors rather than merely documenting them.

---

# PART 27 — GITHUB REPOSITORY

Create a GitHub repository named:

medvita-healthcare-platform

Before creating it:
- Inspect the authenticated GitHub account.
- Confirm repository ownership.
- Check whether a repository with the same name already exists.
- Do not overwrite an existing project.

Use appropriate repository visibility. Prefer private until the code and configuration have been reviewed.

Repository should include:
- Application source code.
- Supabase migrations.
- Seed scripts.
- Tests.
- README.
- Environment variable example.
- Architecture documentation.
- Deployment instructions.
- API documentation.
- Security documentation.

Never commit:
- .env files containing secrets.
- Supabase service-role keys.
- AI API keys.
- Database passwords.
- Private patient records.

Create meaningful commits.

Push the completed code to GitHub.

---

# PART 28 — SUPABASE PROJECT SETUP

Create or connect a Supabase project.

Required steps:
1. Verify authenticated Supabase access.
2. Create or select the project.
3. Configure PostgreSQL.
4. Apply database migrations.
5. Configure authentication.
6. Create secure storage buckets.
7. Configure RLS.
8. Configure required database functions.
9. Configure Edge Functions if needed.
10. Add synthetic seed data.
11. Test database connectivity.
12. Verify access restrictions.

Provide a complete .env.example file.

Never invent credentials.

If the user must provide a Supabase URL, anonymous/publishable key, database credentials or other secret, request them securely through the appropriate configuration workflow.

Do not expose secrets in chat, source code or GitHub.

---

# PART 29 — VERCEL DEPLOYMENT

Deploy the application on Vercel.

Steps:
1. Connect the GitHub repository.
2. Configure the correct framework.
3. Configure the build command.
4. Configure environment variables.
5. Connect the Supabase backend.
6. Configure production and preview environments.
7. Deploy.
8. Verify the production URL.
9. Test authentication.
10. Test database operations.
11. Test file uploads.
12. Test the emergency workflow.
13. Test AI functionality.
14. Verify responsive layouts.
15. Fix production errors.

Provide:
- Production URL.
- GitHub repository URL.
- Supabase project reference.
- Deployment status.
- Setup documentation.

Never claim successful deployment until it has actually been verified.

---

# PART 30 — PROJECT DELIVERY CHECKLIST

The final project is considered complete only when the following are verified.

[ ] MEDVITA branding throughout.

[ ] Professional landing page.

[ ] Authentication.

[ ] Patient dashboards.

[ ] Parent and guardian access.

[ ] Caregiver dashboard.

[ ] Doctor dashboard.

[ ] Administrator dashboard.

[ ] Child health module.

[ ] Adolescent health module.

[ ] Adult health module.

[ ] Elderly health module.

[ ] Universal health profile.

[ ] Chronological medical timeline.

[ ] Medication management.

[ ] Symptom tracking.

[ ] Feeding and growth tracking.

[ ] Menstrual health tracking.

[ ] Chronic disease tracking.

[ ] AI health intelligence engine.

[ ] Historical health comparison.

[ ] AI consultation summaries.

[ ] Remedies and wellness centre.

[ ] Exercise recommendations.

[ ] Food and nutrition recommendations.

[ ] Habit management.

[ ] Emergency SOS.

[ ] Ambulance calling button.

[ ] Emergency contact escalation.

[ ] Emergency medical card.

[ ] Caregiver management.

[ ] Health handover system.

[ ] Medical calendar.

[ ] Doctor appointments.

[ ] Hospital visits.

[ ] Hospital admissions.

[ ] Investigations and follow-ups.

[ ] Medicine reminders.

[ ] Calendar notifications.

[ ] Document uploads.

[ ] OCR extraction.

[ ] Doctor-facing reports.

[ ] Health analytics.

[ ] PDF report generation.

[ ] Multilingual-ready architecture.

[ ] Privacy and consent management.

[ ] Supabase database.

[ ] Supabase RLS.

[ ] Synthetic demonstration patients.

[ ] Automated tests.

[ ] GitHub repository.

[ ] Vercel deployment.

[ ] Production verification.

---

# FINAL EXECUTION INSTRUCTIONS

Work in the following sequence:

PHASE 1: Inspect the environment, repository and available integrations.

PHASE 2: Produce the system architecture and implementation plan.

PHASE 3: Establish the GitHub repository and Supabase database.

PHASE 4: Build the design system and frontend.

PHASE 5: Implement authentication, profiles and permissions.

PHASE 6: Implement all four life-stage modules.

PHASE 7: Implement medications, symptoms and medical documents.

PHASE 8: Implement the AI intelligence engine.

PHASE 9: Implement remedies, exercise, nutrition and habits.

PHASE 10: Implement emergency assistance and ambulance calling.

PHASE 11: Implement caregiver coordination and medical calendar.

PHASE 12: Implement doctor, hospital and administrator dashboards.

PHASE 13: Implement notifications and external integrations.

PHASE 14: Populate synthetic demonstration data.

PHASE 15: Run all tests, security checks and production builds.

PHASE 16: Deploy on Vercel.

PHASE 17: Verify every major feature in the deployed application.

Do not stop after generating a plan, creating a landing page or producing a UI mockup.

Continue through actual implementation.

If credentials, permissions or user approvals are needed, clearly identify what is required and wait for the appropriate input.

Maintain a progress checklist and report completed, partially completed and blocked features honestly.

The objective is a professional, end-to-end, functional healthcare technology prototype.

MEDVITA must feel like a real healthcare technology startup product, not a student assignment.

Build for reliability, accessibility, clinical safety, privacy, scalability and long-term extensibility.

END OF MASTER INSTRUCTION.