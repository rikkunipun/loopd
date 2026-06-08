import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function getDailyPulse(todayLog, habitsCompleted, totalHabits, daysOfData) {
  const prompt = `
You are a personal coach for a 21-year-old CS student building his life.
He has been using this tracker for ${daysOfData} day(s).

TODAY'S DATA:
- Habits completed: ${habitsCompleted} of ${totalHabits}
- Context: ${todayLog.context_tag || 'not set'}
- Mood arc: Afternoon ${todayLog.mood_afternoon}/5 → Evening ${todayLog.mood_evening}/5 → Night ${todayLog.mood_night}/5
- Energy: ${todayLog.q_energy}/3
- Goal progress: ${todayLog.q_goal_progress}/3
- Focus blocker: ${todayLog.q_focus_blocker || 'not logged'}
- Day word: ${todayLog.q_day_word || 'not logged'}
- Screen time (social): ${todayLog.screen_social_mins ? todayLog.screen_social_mins + ' mins' : 'not logged'}
- Sleep last night: ${todayLog.sleep_hours ? todayLog.sleep_hours + 'h' : 'not logged'}

${daysOfData < 3 ? 'This is early data — keep it encouraging and observational.' : ''}
${daysOfData >= 7 ? 'You have a week of data — you can start pointing out patterns.' : ''}

Write a daily pulse: 2-3 sentences max. Be specific, honest, and human.
Not generic. Not motivational-poster language.
End with one concrete suggestion for tomorrow.

Return JSON only:
{
  "score": <number 1-10>,
  "headline": "<5 words max, honest summary of the day>",
  "body": "<2-3 sentences, specific to their data>",
  "tomorrow": "<one concrete suggestion>"
}
`
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 300
  })

  return JSON.parse(response.choices[0].message.content)
}

export async function getDeepInsights(logs, habitCompletions, tasks, daysOfData) {
  if (daysOfData < 7) {
    return [{
      title: 'Keep going',
      body: `You have ${daysOfData} day(s) of data. Deep pattern analysis unlocks after 7 days. The more you log, the more specific this gets.`,
      category: 'info'
    }]
  }

  const prompt = `
You are a personal performance analyst. Analyze this user's data from the last ${daysOfData} days.

DAILY LOGS:
${JSON.stringify(logs)}

HABIT COMPLETIONS:
${JSON.stringify(habitCompletions)}

TASK DATA:
${JSON.stringify(tasks)}

Find 4-5 specific, honest patterns. Focus on:
- What conditions predict their best days
- Where they consistently lose (habits that often break together)
- Task patterns: what they complete vs avoid
- Screen time vs deep work relationship if data exists
- Sleep vs next-day performance if data exists
- Any chronic carry-forward tasks

Rules:
- Use their actual numbers, not generalities
- Be direct, not motivational
- Short: 2-3 sentences per insight
- ${daysOfData < 15 ? 'Note these are early patterns — more data will confirm or change them' : ''}

Return JSON only:
{
  "insights": [{
    "title": "<punchy 4-6 word title>",
    "body": "<2-3 sentences with their actual data>",
    "category": "habit | task | mood | energy | screen_time | sleep"
  }]
}
`
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800
  })

  const parsed = JSON.parse(response.choices[0].message.content)
  return parsed.insights || parsed
}
