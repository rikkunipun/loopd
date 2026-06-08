import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useLogStore } from '../store/logStore'
import { getTodayDate } from '../lib/utils'

export function useToday() {
  const { user } = useAuthStore()
  const { todayLog, setTodayLog, setAllLogs } = useLogStore()

  useEffect(() => {
    if (!user) return
    fetchTodayLog()
    fetchAllLogs()
  }, [user])

  async function fetchTodayLog() {
    const today = getTodayDate()
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('log_date', today)
      .maybeSingle()
    setTodayLog(data || { log_date: today, user_id: user.id })
  }

  async function fetchAllLogs() {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('log_date', { ascending: false })
    setAllLogs(data || [])
  }

  async function upsertLog(updates) {
    const today = getTodayDate()
    const { data } = await supabase
      .from('daily_logs')
      .upsert({ user_id: user.id, log_date: today, ...updates }, { onConflict: 'user_id,log_date' })
      .select()
      .single()
    if (data) setTodayLog(data)
    return data
  }

  return { todayLog, upsertLog, refetch: fetchTodayLog }
}
