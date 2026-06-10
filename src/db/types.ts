// 数据库类型定义

export type UserRole = 'user' | 'admin'

export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export type MedalRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface Profile {
  id: string
  username: string | null
  openid: string | null
  role: UserRole
  avatar_url: string | null
  nickname: string | null
  total_tasks_completed: number
  total_medals: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface TaskTag {
  task_id: string
  tag_id: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  deadline: string
  difficulty: TaskDifficulty
  estimated_hours: number | null
  is_completed: boolean
  completed_at: string | null
  reminder_enabled: boolean
  reminder_time: number
  reminder_sent: boolean
  subscription_id: string | null
  created_at: string
  updated_at: string
  tags?: Tag[]  // 关联的标签（可选）
}

export interface Medal {
  id: string
  user_id: string
  task_id: string
  name: string
  rarity: MedalRarity
  description: string
  obtained_at: string
  tasks?: Task  // 关联的任务信息（可选）
}

export interface TaskWithMedal extends Task {
  medal?: Medal
}

export interface MedalWithTask extends Medal {
  tasks: Task & {
    task_collaborators?: Array<{
      role: CollaboratorRole
      status: CollaboratorStatus
      profiles?: Partial<Profile>
    }>
  }  // 关联的任务信息（必需）
}

// 协作者角色
export type CollaboratorRole = 'viewer' | 'editor'

// 协作者状态
export type CollaboratorStatus = 'pending' | 'accepted' | 'declined'

// 任务协作者
export interface TaskCollaborator {
  id: string
  task_id: string
  user_id: string
  role: CollaboratorRole
  status: CollaboratorStatus
  invited_by: string
  invited_at: string
  accepted_at: string | null
  profiles?: Partial<Profile>  // 关联的用户信息
  tasks?: Partial<Task>  // 关联的任务信息
  inviter?: Partial<Profile>  // 邀请人信息
}

// 带协作者的任务
export interface TaskWithCollaborators extends Task {
  collaborators?: TaskCollaborator[]
}

// 任务留言
export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Partial<Profile>  // 关联的用户信息
}


