import { defineStore } from 'pinia'
import type { Database } from '~/types/database.types'
import { ref, computed } from 'vue'
import type { Member } from '~/types/models.types'

export const useMemberStore = defineStore('memberStore', () => {
  const client = useSupabaseClient<Database>()
  const members = ref<Member[]>([])
  const loading = ref(false)
  const isReady = ref(false)
  const error = ref<Error | null>(null)

  const getMemberById = (id: number) =>
    members.value.find((member) => member.id === id)

  async function fetchMembers() {
    if (members.value.length > 0) return

    loading.value = true
    error.value = null

    try {
      const { data, error: supabaseError } = await client
        .from('members')
        .select(
          'id, name, has_left, created_at, updated_at, has_ladv_startpass'
        )
        .eq('has_left', false)
        .order('name')

      if (supabaseError) throw supabaseError
      members.value = data || []
      isReady.value = true
    } catch (err) {
      error.value = err as Error
      console.error('Fehler beim Laden der Mitglieder:', err)
    } finally {
      loading.value = false
    }
  }

  async function refreshMembers() {
    members.value = [] // Cache leeren
    await fetchMembers()
  }

  const memberOptions = computed(() => {
    return members.value.map((member) => ({
      label: member.name,
      value: member.id,
    }))
  })

  const startpassMemberOptions = computed(() => {
    return members.value
      .filter((member) => member.has_ladv_startpass)
      .map((member) => ({
        label: member.name,
        value: member.id,
      }))
  })

  onMounted(async () => {
    await fetchMembers()
  })

  return {
    members,
    loading,
    error,
    getMemberById,
    fetchMembers,
    refreshMembers,
    memberOptions,
    isReady,
    startpassMemberOptions,
  }
})
