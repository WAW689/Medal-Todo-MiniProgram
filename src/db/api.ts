import {supabase} from '@/client/supabase'
import type {Task, TaskDifficulty, MedalRarity, Tag} from './types'

// ==================== 标签相关 API ====================

/**
 * 获取用户的所有标签
 */
export async function getUserTags(userId: string): Promise<Tag[]> {
  const {data, error} = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取标签失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建标签
 */
export async function createTag(userId: string, name: string, color: string): Promise<Tag | null> {
  const {data, error} = await supabase
    .from('tags')
    .insert({user_id: userId, name, color})
    .select()
    .single()

  if (error) {
    console.error('创建标签失败:', error)
    throw new Error(error.message)
  }

  return data
}

/**
 * 更新标签
 */
export async function updateTag(tagId: string, name: string, color: string): Promise<boolean> {
  const {error} = await supabase
    .from('tags')
    .update({name, color})
    .eq('id', tagId)

  if (error) {
    console.error('更新标签失败:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * 删除标签
 */
export async function deleteTag(tagId: string): Promise<boolean> {
  const {error} = await supabase
    .from('tags')
    .delete()
    .eq('id', tagId)

  if (error) {
    console.error('删除标签失败:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * 为任务添加标签
 */
export async function addTagToTask(taskId: string, tagId: string): Promise<boolean> {
  const {error} = await supabase
    .from('task_tags')
    .insert({task_id: taskId, tag_id: tagId})

  if (error) {
    console.error('添加任务标签失败:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * 从任务移除标签
 */
export async function removeTagFromTask(taskId: string, tagId: string): Promise<boolean> {
  const {error} = await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', taskId)
    .eq('tag_id', tagId)

  if (error) {
    console.error('移除任务标签失败:', error)
    throw new Error(error.message)
  }

  return true
}

/**
 * 获取任务的所有标签
 */
export async function getTaskTags(taskId: string): Promise<Tag[]> {
  const {data, error} = await supabase
    .from('task_tags')
    .select('tags(*)')
    .eq('task_id', taskId)

  if (error) {
    console.error('获取任务标签失败:', error)
    return []
  }

  return Array.isArray(data) ? data.map((item: any) => item.tags).filter(Boolean) : []
}

/**
 * 批量设置任务的标签
 */
export async function setTaskTags(taskId: string, tagIds: string[]): Promise<boolean> {
  // 先删除所有现有标签
  await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', taskId)

  // 如果有新标签，批量插入
  if (tagIds.length > 0) {
    const {error} = await supabase
      .from('task_tags')
      .insert(tagIds.map(tagId => ({task_id: taskId, tag_id: tagId})))

    if (error) {
      console.error('设置任务标签失败:', error)
      throw new Error(error.message)
    }
  }

  return true
}

/**
 * 获取带标签的任务列表
 */
export async function getTasksWithTags(
  userId: string, 
  isCompleted?: boolean, 
  tagIds?: string[]
): Promise<Task[]> {
  const {data, error} = await supabase.rpc('get_tasks_with_tags', {
    p_user_id: userId,
    p_is_completed: isCompleted ?? null,
    p_tag_ids: tagIds && tagIds.length > 0 ? tagIds : null
  })

  if (error) {
    console.error('获取任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 任务相关 API ====================

/**
 * 获取用户的所有任务（包括自己创建的和协作的）
 */
export async function getUserTasks(userId: string, isCompleted?: boolean) {
  const {data, error} = await supabase.rpc('get_user_all_tasks', {
    p_user_id: userId,
    p_is_completed: isCompleted ?? null
  })

  if (error) {
    console.error('获取任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取单个任务详情
 */
export async function getTaskById(taskId: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .maybeSingle()

  if (error) {
    console.error('获取任务详情失败:', error)
    return null
  }

  return data
}

/**
 * 创建新任务
 */
export async function createTask(task: {
  user_id: string
  title: string
  description?: string
  deadline: string
  difficulty: TaskDifficulty
  estimated_hours?: number
}) {
  const {data, error} = await supabase
    .from('tasks')
    .insert({
      user_id: task.user_id,
      title: task.title,
      description: task.description || null,
      deadline: task.deadline,
      difficulty: task.difficulty,
      estimated_hours: task.estimated_hours || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建任务失败:', error)
    return null
  }

  return data
}

/**
 * 更新任务
 */
export async function updateTask(
  taskId: string,
  updates: {
    title?: string
    description?: string
    deadline?: string
    difficulty?: TaskDifficulty
    estimated_hours?: number
  }
) {
  const cleanUpdates: Record<string, unknown> = {}
  
  if (updates.title !== undefined) cleanUpdates.title = updates.title
  if (updates.description !== undefined) cleanUpdates.description = updates.description || null
  if (updates.deadline !== undefined) cleanUpdates.deadline = updates.deadline
  if (updates.difficulty !== undefined) cleanUpdates.difficulty = updates.difficulty
  if (updates.estimated_hours !== undefined) cleanUpdates.estimated_hours = updates.estimated_hours || null

  const {data, error} = await supabase
    .from('tasks')
    .update(cleanUpdates)
    .eq('id', taskId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新任务失败:', error)
    return null
  }

  return data
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string) {
  const {error} = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    console.error('删除任务失败:', error)
    return false
  }

  return true
}

/**
 * 完成任务并生成勋章
 */
export async function completeTask(taskId: string, userId: string) {
  const {data, error} = await supabase.rpc('complete_task_with_collaborators', {
    p_task_id: taskId,
    p_user_id: userId
  })

  if (error) {
    console.error('完成任务失败:', error)
    return {success: false, error: '完成任务失败'}
  }

  if (!data || !data.success) {
    return {success: false, error: data?.error || '完成任务失败'}
  }

  return {success: true, medal: data.medal}
}

/**
 * 计算勋章稀有度和信息
 */
function calculateMedal(task: Task): {name: string; rarity: MedalRarity; description: string} {
  let score = 0

  // 任务难度评分
  const difficultyScores = {easy: 1, medium: 2, hard: 3}
  score += difficultyScores[task.difficulty]

  // 预估耗时评分
  if (task.estimated_hours) {
    if (task.estimated_hours >= 8) score += 3
    else if (task.estimated_hours >= 3) score += 2
    else if (task.estimated_hours >= 1) score += 1
  }

  // 是否准时完成评分
  const deadline = new Date(task.deadline)
  const completedAt = new Date(task.completed_at || new Date())
  if (completedAt <= deadline) {
    score += 2
  }

  // 根据总分确定稀有度
  let rarity: MedalRarity
  let name: string
  let description: string

  if (score >= 7) {
    rarity = 'legendary'
    name = '传说·极限勋章'
    description = `准时完成一项${getDifficultyText(task.difficulty)}任务（预估耗时 ${task.estimated_hours || 0} 小时）`
  } else if (score >= 5) {
    rarity = 'epic'
    name = '破晓勋章'
    description = `完成一项${getDifficultyText(task.difficulty)}任务（预估耗时 ${task.estimated_hours || 0} 小时）`
  } else if (score >= 3) {
    rarity = 'rare'
    name = '专注之章'
    description = `完成一项${getDifficultyText(task.difficulty)}任务`
  } else {
    rarity = 'common'
    name = '初心之印'
    description = `完成一项任务`
  }

  return {name, rarity, description}
}

function getDifficultyText(difficulty: TaskDifficulty): string {
  const map = {easy: '简单', medium: '中等', hard: '困难'}
  return map[difficulty]
}

/**
 * 更新用户统计信息
 */
async function updateUserStats(userId: string) {
  const tasks = await getUserTasks(userId, true)
  const medals = await getUserMedals(userId)

  await supabase
    .from('profiles')
    .update({
      total_tasks_completed: tasks.length,
      total_medals: medals.length
    })
    .eq('id', userId)
}

// ==================== 勋章相关 API ====================

/**
 * 获取用户的所有勋章
 */
export async function getUserMedals(userId: string) {
  const {data, error} = await supabase
    .from('medals')
    .select('*, tasks(id, title, description, difficulty)')
    .eq('user_id', userId)
    .order('obtained_at', {ascending: false})

  if (error) {
    console.error('获取勋章失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取单个勋章详情（包含关联的任务信息）
 */
export async function getMedalById(medalId: string) {
  const {data, error} = await supabase
    .from('medals')
    .select(`
      *,
      tasks(
        *,
        task_collaborators(
          role,
          status,
          profiles:user_id(
            id,
            username,
            nickname,
            avatar_url
          )
        )
      )
    `)
    .eq('id', medalId)
    .maybeSingle()

  if (error) {
    console.error('获取勋章详情失败:', error)
    return null
  }

  return data
}

// ==================== 用户相关 API ====================

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string) {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('获取用户资料失败:', error)
    return null
  }

  return data
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    nickname?: string
    avatar_url?: string
  }
) {
  const cleanUpdates: Record<string, unknown> = {}
  
  if (updates.nickname !== undefined) cleanUpdates.nickname = updates.nickname || null
  if (updates.avatar_url !== undefined) cleanUpdates.avatar_url = updates.avatar_url || null

  const {data, error} = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('id', userId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新用户资料失败:', error)
    return null
  }

  return data
}

/**
 * 获取指定日期范围内的任务
 */
export async function getTasksByDateRange(userId: string, startDate: string, endDate: string) {
  const {data, error} = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('deadline', startDate)
    .lte('deadline', endDate)
    .order('deadline', {ascending: true})

  if (error) {
    console.error('获取任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取指定日期的任务
 */
export async function getTasksByDate(userId: string, date: string) {
  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  return getTasksByDateRange(userId, startOfDay, endOfDay)
}

/**
 * 搜索用户（用于邀请协作者）
 */
export async function searchUsers(keyword: string) {
  const {data, error} = await supabase
    .from('profiles')
    .select('id, username, nickname, avatar_url')
    .or(`username.ilike.%${keyword}%,nickname.ilike.%${keyword}%`)
    .limit(10)

  if (error) {
    console.error('搜索用户失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 添加任务协作者
 */
export async function addTaskCollaborator(
  taskId: string,
  userId: string,
  role: 'viewer' | 'editor',
  invitedBy: string
) {
  const {data, error} = await supabase
    .from('task_collaborators')
    .insert({
      task_id: taskId,
      user_id: userId,
      role,
      invited_by: invitedBy,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('添加协作者失败:', error)
    throw error
  }

  return data
}

/**
 * 获取任务的所有协作者
 */
export async function getTaskCollaborators(taskId: string) {
  const {data, error} = await supabase
    .from('task_collaborators')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        nickname,
        avatar_url
      )
    `)
    .eq('task_id', taskId)
    .order('invited_at', {ascending: false})

  if (error) {
    console.error('获取协作者失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取用户参与的协作任务
 */
export async function getUserCollaborations(userId: string) {
  const {data, error} = await supabase
    .from('task_collaborators')
    .select('task_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  if (error) {
    console.error('获取协作任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data.map(c => c.task_id) : []
}

/**
 * 响应协作邀请
 */
export async function respondToInvitation(
  collaboratorId: string,
  status: 'accepted' | 'declined'
) {
  const {data, error} = await supabase
    .from('task_collaborators')
    .update({
      status,
      accepted_at: status === 'accepted' ? new Date().toISOString() : null
    })
    .eq('id', collaboratorId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('响应邀请失败:', error)
    throw error
  }

  return data
}

/**
 * 移除协作者
 */
export async function removeTaskCollaborator(collaboratorId: string) {
  const {error} = await supabase
    .from('task_collaborators')
    .delete()
    .eq('id', collaboratorId)

  if (error) {
    console.error('移除协作者失败:', error)
    throw error
  }
}

/**
 * 获取用户的待处理邀请
 */
export async function getPendingInvitations(userId: string) {
  const {data, error} = await supabase
    .from('task_collaborators')
    .select(`
      *,
      tasks:task_id (
        id,
        title,
        deadline,
        difficulty
      ),
      inviter:invited_by (
        id,
        username,
        nickname,
        avatar_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('invited_at', {ascending: false})

  if (error) {
    console.error('获取待处理邀请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取任务的所有留言
 */
export async function getTaskComments(taskId: string) {
  const {data, error} = await supabase
    .from('task_comments')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        nickname,
        avatar_url
      )
    `)
    .eq('task_id', taskId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取留言失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 添加任务留言
 */
export async function addTaskComment(taskId: string, userId: string, content: string) {
  const {data, error} = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      content
    })
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        nickname,
        avatar_url
      )
    `)
    .maybeSingle()

  if (error) {
    console.error('添加留言失败:', error)
    throw error
  }

  return data
}

/**
 * 删除任务留言
 */
export async function deleteTaskComment(commentId: string) {
  const {error} = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('删除留言失败:', error)
    throw error
  }
}
