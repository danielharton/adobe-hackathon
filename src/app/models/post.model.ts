import { User } from './user.model';

export enum PostType {
  TASK = 'task',
  ANNOUNCEMENT = 'announcement',
  QUESTION = 'question',
  UPDATE = 'update'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  BLOCKED = 'blocked'
}

export class Post {
  id?: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  type: PostType;
  status?: TaskStatus; // For task posts
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: number; // User ID of assignee
  assignedToName?: string;
  tags?: string[];
  attachments?: string[]; // URLs or file paths
  createdAt: number;
  updatedAt: number;
  dueDate?: number; // Timestamp
  commentCount: number;
  reactionCount: number;
  isPinned: boolean;
  pinnedAt?: number; // Timestamp when pinned
  responsibleUserIds?: number[];
}

