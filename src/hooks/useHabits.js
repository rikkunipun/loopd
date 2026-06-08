import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { getTodayDate, calculateStreak } from '../lib/utils'

const DEFAULT_HABITS = [
  { name: 'Gym', icon: 'Dumbbell', sort_order: 0 },
  { name: 'Deep work', icon: 'Brain', sort_order: 1 },
  { name: 'Eating clean', icon: 'Salad', sort_order: 2 },
  { name: 'Water intake', icon: 'Droplets', sort_order: 3 },
  { name: 'Sleep quality', icon: 'Moon', sort_order: 4 },
  { name: 'No doom scrolling', icon: 'Ban', sort_order: 5 },
  { name: 'Content creation', icon: 'Pencil', sort_order: 6 },
]

export function useHabits() {
  const { user } = useAuthStore()
  const [allHabits, setAllHabits] = useState([])       // source of truth — includes inactive
  const [completions, setCompletions] = useState([])   // today's completions
  const [allCompletions, setAllCompletions] = useState([]) // history for streak calc
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    initHabits()
  }, [user])

  async function ensureProfile() {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id }, { onConflict: 'id' })
    if (error) console.error('[useHabits] profile upsert error:', error)
  }

  async function initHabits() {
    setLoading(true)
    console.log('[useHabits] init for user:', user.id)

    await ensureProfile()

    const { data: existing, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at')  // oldest first so we keep the original row on dedup

    console.log('[useHabits] fetched habits:', existing?.length, 'error:', error)

    let habits = existing || []

    // Deduplicate by name — keep the first occurrence, delete extras from DB.
    // This cleans up any duplicates created by the previous two-seeder race condition.
    if (habits.length > 0) {
      const seen = new Map()
      const toDelete = []
      for (const h of habits) {
        if (seen.has(h.name)) {
          toDelete.push(h.id)
        } else {
          seen.set(h.name, h)
        }
      }
      if (toDelete.length > 0) {
        console.log('[useHabits] removing', toDelete.length, 'duplicate habit(s)')
        await supabase.from('habits').delete().in('id', toDelete)
        habits = habits.filter(h => !toDelete.includes(h.id))
      }
    }

    if (habits.length === 0) {
      console.log('[useHabits] no habits — seeding defaults')
      const { data: seeded, error: seedErr } = await supabase
        .from('habits')
        .insert(DEFAULT_HABITS.map(h => ({ ...h, user_id: user.id })))
        .select()
      if (seedErr) console.error('[useHabits] seed error:', seedErr)
      else console.log('[useHabits] seeded', seeded?.length, 'habits')
      habits = seeded || []
    }

    setAllHabits(habits)
    await Promise.all([fetchTodayCompletions(), fetchHistoricalCompletions()])
    setLoading(false)
  }

  async function fetchTodayCompletions() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
    setCompletions(data || [])
    return data || []
  }

  async function fetchHistoricalCompletions() {
    const { data } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
    setAllCompletions(data || [])
    return data || []
  }

  async function toggleHabit(habitId) {
    const today = getTodayDate()
    const existing = completions.find(c => c.habit_id === habitId && c.log_date === today)
    const newCompleted = existing ? !existing.completed : true

    const { data } = await supabase
      .from('habit_completions')
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        log_date: today,
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      }, { onConflict: 'user_id,habit_id,log_date' })
      .select()
      .single()

    if (data) {
      const without = (arr) => arr.filter(c => !(c.habit_id === habitId && c.log_date === today))
      setCompletions(prev => [...without(prev), data])
      setAllCompletions(prev => [...without(prev), data])
    }
  }

  // ── Management ─────────────────────────────────────────

  async function toggleHabitActive(habitId, isActive) {
    const { data } = await supabase
      .from('habits')
      .update({ is_active: isActive })
      .eq('id', habitId)
      .select()
      .single()
    if (data) setAllHabits(prev => prev.map(h => h.id === habitId ? data : h))
  }

  async function deleteHabit(habitId) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', user.id)  // belt-and-suspenders: never delete another user's row

    if (error) {
      console.error('[useHabits] deleteHabit error:', error)
      return false
    }
    setAllHabits(prev => prev.filter(h => h.id !== habitId))
    return true
  }

  async function addCustomHabit(name) {
    const maxOrder = allHabits.length > 0
      ? Math.max(...allHabits.map(h => h.sort_order)) + 1
      : 0
    const { data } = await supabase
      .from('habits')
      .insert({ user_id: user.id, name: name.trim(), icon: 'Star', sort_order: maxOrder, is_active: true })
      .select()
      .single()
    if (data) setAllHabits(prev => [...prev, data])
    return data
  }

  // ── Derived ────────────────────────────────────────────

  function getStreak(habitId) {
    const today = getTodayDate()
    const historical = allCompletions.filter(c => c.log_date !== today)
    const merged = [...historical, ...completions]
    return calculateStreak(merged, habitId)
  }

  const habits = allHabits.filter(h => h.is_active)
  const completedCount = completions.filter(
    c => c.log_date === getTodayDate() && c.completed
  ).length

  return {
    habits,
    allHabits,
    completions,
    completedCount,
    loading,
    toggleHabit,
    getStreak,
    toggleHabitActive,
    deleteHabit,
    addCustomHabit,
  }
}
