export function calculateStreak(completions, habitId) {
  const days = completions
    .filter(c => c.habit_id === habitId && c.completed)
    .map(c => c.log_date)
    .sort((a, b) => new Date(b) - new Date(a))

  if (days.length === 0) return 0

  let streak = 1
  let graceDayUsed = false

  for (let i = 0; i < days.length - 1; i++) {
    const diff = Math.round(
      (new Date(days[i]) - new Date(days[i + 1])) / (1000 * 60 * 60 * 24)
    )
    if (diff === 1) {
      streak++
    } else if (diff === 2 && !graceDayUsed) {
      streak++
      graceDayUsed = true
    } else {
      break
    }
  }
  return streak
}

export function calculateDayScore(habitsCompleted, totalHabits, goalProgress) {
  const rate = totalHabits > 0 ? habitsCompleted / totalHabits : 0
  if (rate >= 0.7 && goalProgress >= 2) return 'win'
  if (rate >= 0.4 || goalProgress >= 1) return 'partial'
  return 'loss'
}

export function getDaysOfData(logs) {
  return logs ? logs.length : 0
}

export function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}
