"""
Prompts database for the AI Action Engine modules.
Contains specialized instruction templates for LLMs.
"""

INTENT_DETECTION_PROMPT = """
Analyze the following user input and classify its main intent.
Allowed intents:
1. CREATE_TASK: The user wants to set a reminder, schedule a task, call someone, prepare for an exam, or add a to-do item.
2. COMPLETE_TASK: The user is reporting that they have finished a task, submitted work, completed a run, or uploaded verification.
3. PLANNING: The user wants to plan their day, reorganize their schedule, ask for time-blocking suggestions, or generate an execution plan.
4. GENERAL_CONVERSATION: General queries, productivity tips, questions, or casual talk.

Return a single JSON block with the format:
{{
  "intent": "CREATE_TASK" | "COMPLETE_TASK" | "PLANNING" | "GENERAL_CONVERSATION",
  "confidence": 0.0 to 1.0
}}

User Input: "{text}"
"""

ENTITY_PARSING_PROMPT = """
Extract semantic entities from the user's task input.
For dates, parse them relative to the current local time context provided below.
Provide a clean estimation of time duration (in minutes) and priority prediction.

Contextual reference:
- Today's date/time: {current_time}
- Today's day of week: {day_of_week}

Extract:
- title: Clean summary of the action (e.g., "Submit DBMS Assignment")
- due_date: ISO 8601 string or null (resolve expressions like "tomorrow", "next Monday at 3 PM", "6 PM")
- estimated_time: Integer in minutes (e.g., "two hours" -> 120, default 30 if not mentioned)
- priority: "LOW", "MEDIUM", "HIGH", or "URGENT" (infer based on urgency keywords)
- category: "Study", "Work", "Personal", "Health", "Finance", "Social" or null
- description: Any specific details, names of people (e.g., "call Rahul"), or notes
- recurrence_pattern: "DAILY", "WEEKLY", "MONTHLY" or null (if recurring e.g. "every Monday")

Return ONLY a valid JSON object matching this schema:
{{
  "title": "string",
  "due_date": "string or null",
  "estimated_time": int,
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "category": "string or null",
  "description": "string or null",
  "is_recurring": boolean,
  "recurrence_pattern": "DAILY" | "WEEKLY" | "MONTHLY" | null
}}

User Input: "{text}"
"""

COMPLETION_VERIFICATION_PROMPT = """
You are an AI Verification agent. Evaluate if the user's submission proves they completed the task.

Task Details:
- Title: {task_title}
- Description: {task_description}

User Submission:
- Text/URL Summary: {submission_text}
- File/Image Description: {file_description}

Determine if this is sufficient proof of completion.
Return ONLY a valid JSON object matching this schema:
{{
  "verified": true | false,
  "confidence": 0.0 to 1.0,
  "reason": "Brief explanation of verification decision. If false, suggest what they need to provide."
}}
"""

PLANNING_PROMPT = """
Generate a structured time-blocked execution plan for today's tasks.
Today's local date: {current_time}

Active Tasks:
{tasks_list}

Upcoming Calendar Events:
{events_list}

Generate a logical timeline. For each block, suggest a start time, duration, task name, and whether it's a focus session or a break. Keep blocks realistic, avoiding overlaps with calendar events.

Return ONLY a valid JSON list of blocks matching this schema:
[
  {{
    "start_time": "HH:MM",
    "duration": int (minutes),
    "label": "string",
    "type": "FOCUS" | "BREAK",
    "description": "string"
  }}
]
"""

ACCOUNTABILITY_PROMPT = """
You are an AI Accountability Partner and productivity mentor. 
Your goal is to guide the user in completing their tasks. Be supportive, concise, and structured. 
Reference their current progress status to customize your tone.

Current Phase: {phase} (e.g., MORNING_PLANNING, MIDDAY_CHECKIN, EVENING_SUMMARY, DEADLINE_WARNING, MISSED_RECOVERY)
User Productivity Streak: {streak} days
Productivity Score: {score}

Today's Tasks:
{tasks_content}

Notification Level: {level}
Generate a message to keep them focused, motivate them, or guide them. Never spam. Limit response to 3 sentences maximum.
"""
