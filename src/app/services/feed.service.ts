import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { Reaction, ReactionType } from '../models/reaction.model';
import { LocalStorageService } from './local-storage.service';

interface PostData {
  id?: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  type: string;
  status?: string;
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
  type?: string;
  onIt?: boolean;
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class FeedService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  public posts$: Observable<Post[]> = this.postsSubject.asObservable();

  constructor(private localStorage: LocalStorageService) {
    this.loadPosts();
  }

  async getAllUsers(): Promise<{ id: number; name: string; email: string; departmentName?: string; departmentId?: number }[]> {
    const db = this.localStorage.getDatabase();
    const users = await db.users.toArray();
    return users.map(u => ({ id: u.id!, name: u.name, email: u.email, departmentName: (u as any).departmentName, departmentId: (u as any).departmentId }));
  }

  private async loadPosts(): Promise<void> {
    const posts = await this.getPosts();
    this.postsSubject.next(posts);
  }

  // POSTS
  async createPost(post: Partial<Post>): Promise<Post> {
    const db = this.localStorage.getDatabase();
    const now = Date.now();
    
    const postData: PostData = {
      authorId: post.authorId!,
      authorName: post.authorName!,
      authorAvatar: post.authorAvatar,
      title: post.title!,
      content: post.content!,
      type: post.type!,
      status: post.status,
      priority: post.priority,
      assignedTo: post.assignedTo,
      assignedToName: post.assignedToName,
      tags: post.tags || [],
      attachments: post.attachments || [],
      createdAt: now,
      updatedAt: now,
      dueDate: post.dueDate,
      commentCount: 0,
      reactionCount: 0,
      isPinned: false,
      pinnedAt: 0,
      responsibleUserIds: []
    };

    const id = await db.posts.add(postData);
    await this.loadPosts();
    
    return this.convertPostData({ ...postData, id });
  }

  async getPosts(): Promise<Post[]> {
    const db = this.localStorage.getDatabase();
    const posts = await db.posts.orderBy('createdAt').reverse().toArray();
    // Sort: pinned first (by pinnedAt desc), then unpinned by createdAt desc
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        const aPinned = a.pinnedAt || 0;
        const bPinned = b.pinnedAt || 0;
        return bPinned - aPinned;
      }
      return b.createdAt - a.createdAt;
    });
    return posts.map(p => this.convertPostData(p));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const db = this.localStorage.getDatabase();
    const post = await db.posts.get(id);
    return post ? this.convertPostData(post) : undefined;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<void> {
    const db = this.localStorage.getDatabase();
    const updateData: any = {
      updatedAt: Date.now()
    };
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assignedTo = updates.assignedTo;
    if (updates.assignedToName !== undefined) updateData.assignedToName = updates.assignedToName;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate;
    if (updates.isPinned !== undefined) {
      updateData.isPinned = updates.isPinned;
      updateData.pinnedAt = updates.isPinned ? Date.now() : 0;
    }
    if ((updates as any).responsibleUserIds !== undefined) {
      updateData.responsibleUserIds = (updates as any).responsibleUserIds;
    }

    await db.posts.update(id, updateData);
    await this.loadPosts();
  }

  async deletePost(id: number): Promise<void> {
    const db = this.localStorage.getDatabase();
    await db.posts.delete(id);
    // Also delete related comments and reactions
    await db.comments.where('postId').equals(id).delete();
    await db.reactions.where('postId').equals(id).delete();
    await this.loadPosts();
  }

  // COMMENTS
  async createComment(comment: Partial<Comment>): Promise<Comment> {
    const db = this.localStorage.getDatabase();
    const now = Date.now();
    
    const commentData: CommentData = {
      postId: comment.postId!,
      authorId: comment.authorId!,
      authorName: comment.authorName!,
      authorAvatar: comment.authorAvatar,
      content: comment.content!,
      createdAt: now,
      reactionCount: 0,
      parentId: comment.parentId
    };

    const id = await db.comments.add(commentData);
    
    // Update post comment count
    const post = await db.posts.get(comment.postId!);
    if (post) {
      await db.posts.update(comment.postId!, { commentCount: (post.commentCount || 0) + 1 });
      await this.loadPosts();
    }

    return this.convertCommentData({ ...commentData, id });
  }

  async getCommentsByPostId(postId: number): Promise<Comment[]> {
    const db = this.localStorage.getDatabase();
    const comments = await db.comments.where('postId').equals(postId).sortBy('createdAt');
    return comments.map(c => this.convertCommentData(c));
  }

  async updateComment(id: number, content: string): Promise<void> {
    const db = this.localStorage.getDatabase();
    await db.comments.update(id, { content, updatedAt: Date.now() });
  }

  async deleteComment(id: number): Promise<void> {
    const db = this.localStorage.getDatabase();
    const comment = await db.comments.get(id);
    if (comment) {
      // Delete comment and its reactions
      await db.comments.delete(id);
      await db.reactions.where('commentId').equals(id).delete();
      
      // Update post comment count
      const post = await db.posts.get(comment.postId);
      if (post) {
        await db.posts.update(comment.postId, { commentCount: Math.max(0, (post.commentCount || 0) - 1) });
        await this.loadPosts();
      }
    }
  }

  // REACTIONS
  async addReaction(reaction: Partial<Reaction>): Promise<void> {
    const db = this.localStorage.getDatabase();
    
    // Check if user already reacted (avoid compound index dependency)
    let existing: ReactionData | undefined;
    if (reaction.postId) {
      existing = await db.reactions
        .where('postId')
        .equals(reaction.postId)
        .and(r => r.userId === reaction.userId)
        .first();
    } else if (reaction.commentId) {
      existing = await db.reactions
        .where('commentId')
        .equals(reaction.commentId)
        .and(r => r.userId === reaction.userId)
        .first();
    }

    if (existing) {
      // Update existing reaction
      await db.reactions.update(existing.id!, { type: reaction.type! });
    } else {
      // Create new reaction
      const reactionData: ReactionData = {
        postId: reaction.postId,
        commentId: reaction.commentId,
        userId: reaction.userId!,
        userName: reaction.userName!,
        type: reaction.type!,
        createdAt: Date.now()
      };
      await db.reactions.add(reactionData);
      
      // Update reaction count
      if (reaction.postId) {
        const post = await db.posts.get(reaction.postId);
        if (post) {
          await db.posts.update(reaction.postId, { reactionCount: (post.reactionCount || 0) + 1 });
        }
      } else if (reaction.commentId) {
        const comment = await db.comments.get(reaction.commentId);
        if (comment) {
          await db.comments.update(reaction.commentId, { reactionCount: (comment.reactionCount || 0) + 1 });
        }
      }
    }
  }

  async removeReaction(postId: number | undefined, commentId: number | undefined, userId: number): Promise<void> {
    const db = this.localStorage.getDatabase();
    
    let reaction;
    if (postId) {
      reaction = await db.reactions
        .where('postId')
        .equals(postId)
        .and(r => r.userId === userId)
        .first();
    } else if (commentId) {
      reaction = await db.reactions
        .where('commentId')
        .equals(commentId)
        .and(r => r.userId === userId)
        .first();
    }

    if (reaction) {
      await db.reactions.delete(reaction.id!);
      
      // Update reaction count
      if (postId) {
        const post = await db.posts.get(postId);
        if (post) {
          await db.posts.update(postId, { reactionCount: Math.max(0, (post.reactionCount || 0) - 1) });
        }
      } else if (commentId) {
        const comment = await db.comments.get(commentId);
        if (comment) {
          await db.comments.update(commentId, { reactionCount: Math.max(0, (comment.reactionCount || 0) - 1) });
        }
      }
    }
  }

  async getReactionsByPostId(postId: number): Promise<Reaction[]> {
    const db = this.localStorage.getDatabase();
    const reactions = await db.reactions.where('postId').equals(postId).toArray();
    return reactions.map(r => this.convertReactionData(r));
  }

  async getReactionCountsForPost(postId: number): Promise<{ [key: string]: number }> {
    const db = this.localStorage.getDatabase();
    const reactions = await db.reactions.where('postId').equals(postId).toArray();
    const counts: { [key: string]: number } = {};
    for (const r of reactions) {
      if (!r.type) continue; // ignore non-emoji records (e.g., onIt only)
      const key = r.type;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  async getReactionsByCommentId(commentId: number): Promise<Reaction[]> {
    const db = this.localStorage.getDatabase();
    const reactions = await db.reactions.where('commentId').equals(commentId).toArray();
    return reactions.map(r => this.convertReactionData(r));
  }

  async getUserReaction(postId: number | undefined, commentId: number | undefined, userId: number): Promise<Reaction | undefined> {
    const db = this.localStorage.getDatabase();
    
    let reaction;
    if (postId) {
      reaction = await db.reactions
        .where('postId')
        .equals(postId)
        .and(r => r.userId === userId)
        .first();
    } else if (commentId) {
      reaction = await db.reactions
        .where('commentId')
        .equals(commentId)
        .and(r => r.userId === userId)
        .first();
    }
    
    return reaction ? this.convertReactionData(reaction) : undefined;
  }

  // Helper methods to convert data
  private convertPostData(data: PostData): Post {
    return {
      id: data.id,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      title: data.title,
      content: data.content,
      type: data.type as any,
      status: data.status as any,
      priority: data.priority as any,
      assignedTo: data.assignedTo,
      assignedToName: data.assignedToName,
      tags: data.tags || [],
      attachments: data.attachments || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      dueDate: data.dueDate,
      commentCount: data.commentCount,
      reactionCount: data.reactionCount,
      isPinned: data.isPinned,
      pinnedAt: data.pinnedAt,
      responsibleUserIds: data.responsibleUserIds || []
    } as Post;
  }

  private convertCommentData(data: CommentData): Comment {
    return {
      id: data.id,
      postId: data.postId,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      content: data.content,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      reactionCount: data.reactionCount,
      parentId: data.parentId
    };
  }

  private convertReactionData(data: ReactionData): Reaction {
    return {
      id: data.id,
      postId: data.postId,
      commentId: data.commentId,
      userId: data.userId,
      userName: data.userName,
      type: data.type as ReactionType,
      createdAt: data.createdAt
    };
  }

  // ON IT (per-post stored on post)
  async toggleOnIt(postId: number, userId: number, userName: string): Promise<void> {
    const db = this.localStorage.getDatabase();
    const post = await db.posts.get(postId);
    if (!post) return;
    const ids = Array.isArray(post.responsibleUserIds) ? [...post.responsibleUserIds] : [];
    const idx = ids.indexOf(userId);
    if (idx >= 0) ids.splice(idx, 1); else ids.push(userId);
    await db.posts.update(postId, { responsibleUserIds: ids, updatedAt: Date.now() });
  }

  async getOnItUsersByPostId(postId: number): Promise<{ id: number; name: string }[]> {
    const db = this.localStorage.getDatabase();
    const post = await db.posts.get(postId);
    const ids = (post?.responsibleUserIds || []).filter((v, i, a) => a.indexOf(v) === i);
    if (ids.length === 0) return [];
    const users = await db.users.where('id').anyOf(ids).toArray();
    const mapped = users.map(u => ({ id: u.id!, name: u.name }));
    mapped.sort((a, b) => a.name.localeCompare(b.name));
    return mapped;
  }

  async getUserOnIt(postId: number, userId: number): Promise<boolean> {
    const db = this.localStorage.getDatabase();
    const post = await db.posts.get(postId);
    const ids = post?.responsibleUserIds || [];
    return ids.includes(userId);
  }
}

