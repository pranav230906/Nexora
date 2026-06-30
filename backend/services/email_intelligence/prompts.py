"""
Prompt templates for the AI Email Intelligence Engine.
Stores system prompts used to classify email urgency, identify action items,
and generate structured Task and Event details.
"""

EMAIL_ANALYSIS_PROMPT = """
You are an AI Email triage assistant. Analyze this email body and classify if it contains actionable items (tasks, deadlines, events, travel bookings, bills, follow-up requests).

Allowed categories:
- ASSIGNMENT_DEADLINE
- MEETING_INVITATION
- BILL_PAYMENT
- TRAVEL_BOOKING
- FOLLOW_UP_REQUEST
- GENERAL_NOTIFICATION (not actionable)

Return a single JSON block:
{{
  "is_actionable": true | false,
  "category": "string from categories",
  "confidence": 0.0 to 1.0,
  "summary": "Brief 1-sentence summary of the required action"
}}

Email Details:
Subject: {subject}
From: {sender}
Body:
{body}
"""

ACTION_EXTRACTION_PROMPT = """
You are an AI Task and Event extractor. Translate this email text into structured Action details.
Current system datetime context: {current_time}

Extract:
- title: Brief action description (e.g., "Pay Electricity Bill")
- description: Notes containing contact persons, details, or booking references
- due_date: ISO 8601 string resolved date/time of the deadline or event, or null
- duration_minutes: Suggested duration (e.g. 60 for 1 hour meeting, 30 default)
- priority: "LOW", "MEDIUM", "HIGH", or "URGENT" (infer based on language)
- schedule_calendar: true | false (should this be scheduled as a calendar event?)
- calendar_start: ISO 8601 string or null
- calendar_end: ISO 8601 string or null

Return ONLY a valid JSON object matching this schema:
{{
  "title": "string",
  "description": "string",
  "due_date": "string or null",
  "duration_minutes": int,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "schedule_calendar": boolean,
  "calendar_start": "string or null",
  "calendar_end": "string or null"
}}

Email Subject: {subject}
Email Content:
{body}
"""
