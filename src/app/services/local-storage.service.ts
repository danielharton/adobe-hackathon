import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Observable } from 'rxjs';

// Define the database schema
interface UserData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  passwordHash: string; // Hashed password
  createdAt: number;
  role?: 'manager' | 'executant' | 'admin';
  departmentName?: string;
  departmentId?: number;
  manager_id?: number;
  department?: string;
  position?: string;
  avatar?: string;
}

interface PostData {
  id?: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  type: string; // PostType enum as string
  status?: string; // TaskStatus enum as string
  priority?: string;
  assignedTo?: number;
  assignedToName?: string;
  tags?: string[];
  attachments?: string[];
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
  commentCount: number;
  reactionCount: number;
  isPinned: boolean;
  pinnedAt?: number;
  responsibleUserIds?: number[];
}

interface CommentData {
  id?: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  reactionCount: number;
  parentId?: number;
}

interface ReactionData {
  id?: number;
  postId?: number;
  commentId?: number;
  userId: number;
  userName: string;
  type?: string; // ReactionType enum as string
  onIt?: boolean;
  createdAt: number;
}

interface DepartmentData {
  id?: number;
  name: string;
}

interface DepartmentMemberData {
  id?: number;
  departmentId: number;
  userId: number;
}

interface ConversationData {
  id?: number;
  userAId: number;
  userBId: number;
  createdAt: number;
}

interface MessageData {
  id?: number;
  conversationId: number;
  senderId: number;
  text: string;
  createdAt: number;
}

// Create IndexedDB database
class AppDatabase extends Dexie {
  users!: Table<UserData, number>;
  posts!: Table<PostData, number>;
  comments!: Table<CommentData, number>;
  reactions!: Table<ReactionData, number>;
  departments!: Table<DepartmentData, number>;
  departmentMembers!: Table<DepartmentMemberData, number>;
  conversations!: Table<ConversationData, number>;
  messages!: Table<MessageData, number>;

  constructor() {
    super('TeamLabDB');
    this.version(4).stores({
      users: '++id, email, name, phone, role',
      posts: '++id, authorId, type, status, createdAt, isPinned',
      comments: '++id, postId, authorId, createdAt, parentId',
      reactions: '++id, postId, commentId, userId, type, [postId+userId], [commentId+userId]'
    });
    // Add departments and membership, add departmentId index to users
    this.version(5).stores({
      users: '++id, email, name, phone, role, departmentId',
      posts: '++id, authorId, type, status, createdAt, isPinned',
      comments: '++id, postId, authorId, createdAt, parentId',
      reactions: '++id, postId, commentId, userId, type, [postId+userId], [commentId+userId]',
      departments: '++id, name',
      departmentMembers: '++id, departmentId, userId, [departmentId+userId]',
      conversations: '++id, userAId, userBId, [userAId+userBId]'
    });
    this.version(6).stores({
      messages: '++id, conversationId, senderId, createdAt'
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private db: AppDatabase;

  constructor() {
    this.db = new AppDatabase();
  }
  
  // Get database instance for advanced operations
  getDatabase(): AppDatabase {
    return this.db;
  }
}
