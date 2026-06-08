import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTaskStore } from '../store/taskStore'
import { getTodayDate } from '../lib/utils'

export function useTasks() {
  const { user } = useAuthStore()
  const { tasks, setTasks, addTask, updateTask, removeTask } = useTaskStore()

  useEffect(() => {
    if (!user) return
    fetchTodayTasks()
  }, [user])

  async function fetchTodayTasks() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('planned_date', today)
      .order('created_at')
    setTasks(data || [])
  }

  async function fetchCarriedTasks() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .eq('skipped', false)
      .lt('planned_date', today)
      .order('planned_date')
    return data || []
  }

  async function createTask(taskData) {
    const today = getTodayDate()
    const { data } = await supabase
      .from('tasks')
      .insert({ user_id: user.id, planned_date: today, ...taskData })
      .select()
      .single()
    if (data) addTask(data)
    return data
  }

  async function completeTask(id) {
    const { data } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (data) updateTask(id, data)
  }

  async function skipTask(id, reason) {
    const { data } = await supabase
      .from('tasks')
      .update({ skipped: true, skip_reason: reason })
      .eq('id', id)
      .select()
      .single()
    if (data) updateTask(id, data)
  }

  async function carryTask(id, currentCount) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    const { data } = await supabase
      .from('tasks')
      .update({ planned_date: tomorrowStr, carry_count: (currentCount || 0) + 1 })
      .eq('id', id)
      .select()
      .single()
    if (data) updateTask(id, data)
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    removeTask(id)
  }

  async function moveCarriedToToday(id) {
    const today = getTodayDate()
    const { data } = await supabase
      .from('tasks')
      .update({ planned_date: today })
      .eq('id', id)
      .select()
      .single()
    if (data) addTask(data)
    return data
  }

  return { tasks, fetchTodayTasks, fetchCarriedTasks, createTask, completeTask, skipTask, carryTask, deleteTask, moveCarriedToToday }
}
