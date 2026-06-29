from .base import BaseAIAgent
from . import prompts

class PlannerAgent(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.PLANNER_SYSTEM_PROMPT, model=model)

    def generate_plan(self, user, tasks_list, goals_list):
        message = f"Tasks:\n{tasks_list}\n\nGoals:\n{goals_list}"
        return self.call_llm(user, message)


class PriorityAgent(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.PRIORITY_SYSTEM_PROMPT, model=model)

    def analyze_priorities(self, user, tasks_list):
        message = f"Tasks to prioritize:\n{tasks_list}"
        return self.call_llm(user, message)


class ProductivityCoach(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.COACH_SYSTEM_PROMPT, model=model)

    def get_coaching_advice(self, user, habits_list, streaks_data):
        message = f"Habits:\n{habits_list}\n\nStreaks:\n{streaks_data}"
        return self.call_llm(user, message)


class ScheduleOptimizer(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.OPTIMIZER_SYSTEM_PROMPT, model=model)

    def optimize_schedule(self, user, tasks_list):
        message = f"Tasks to optimize:\n{tasks_list}"
        return self.call_llm(user, message)


class DeadlinePredictor(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.DEADLINE_SYSTEM_PROMPT, model=model)

    def predict_deadlines(self, user, backlog_size, upcoming_tasks):
        message = f"Backlog size: {backlog_size}\nUpcoming tasks:\n{upcoming_tasks}"
        return self.call_llm(user, message)


class TaskBreakdownAgent(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.BREAKDOWN_SYSTEM_PROMPT, model=model)

    def breakdown_task(self, user, task_title, task_description):
        message = f"Task: {task_title}\nDescription: {task_description}"
        fallback = '["Analyze requirements", "Implement changes", "Review and test"]'
        return self.call_llm(user, message, fallback_response=fallback)


class MotivationAgent(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.MOTIVATION_SYSTEM_PROMPT, model=model)

    def get_motivation(self, user, current_streaks, completed_count):
        message = f"Streaks: {current_streaks}\nCompleted Tasks: {completed_count}"
        return self.call_llm(user, message)


class DailySummaryGenerator(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.DAILY_SUMMARY_SYSTEM_PROMPT, model=model)

    def generate_summary(self, user, achievements_list):
        message = f"Achievements:\n{achievements_list}"
        return self.call_llm(user, message)


class WeeklySummaryGenerator(BaseAIAgent):
    def __init__(self, model="gpt-4o-mini"):
        super().__init__(prompts.WEEKLY_SUMMARY_SYSTEM_PROMPT, model=model)

    def generate_weekly_report(self, user, stats_data):
        message = f"Weekly statistics:\n{stats_data}"
        return self.call_llm(user, message)
