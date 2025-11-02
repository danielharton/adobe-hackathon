import { Component, OnInit } from '@angular/core';
import { FeedService } from '../services/feed.service';
import { AuthService } from '../services/auth.service';
import { Post, PostType, TaskStatus } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { Reaction, ReactionType } from '../models/reaction.model';
import { MatDialog } from '@angular/material/dialog';
import { CreatePostDialogComponent } from './create-post-dialog/create-post-dialog.component';

@Component({
  selector: 'app-feed',
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  currentUser: any | null = null;
  showCommentSection: { [key: number]: boolean } = {};
  expandedPosts: Set<number> = new Set();
  showReplyInput: { [key: number]: boolean } = {};
  users: { id: number; name: string; email: string; departmentName?: string; departmentId?: number }[] = [];
  filteredUsers: { id: number; name: string; email: string; departmentName?: string; departmentId?: number }[] = [];
  mention = {
    active: false,
    search: '',
    context: { type: '' as 'post' | 'reply', postId: 0, commentId: 0 },
    targetInput: null as HTMLTextAreaElement | null
  };
  // Filters
  availableTags: string[] = [];
  selectedTags: string[] = [];
  availableDepartments: string[] = [];
  selectedDepartments: string[] = [];
  showDepartmentsPanel = false;
  
  // Expose enum to template
  ReactionType = ReactionType;

  constructor(
    private feedService: FeedService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Load users first to derive departments, then posts
    this.loadUsers().then(() => this.loadPosts());
  }

  async loadPosts(): Promise<void> {
    this.posts = await this.feedService.getPosts();
    // Load comments and reactions for each post
    for (const post of this.posts) {
      const flatComments = await this.feedService.getCommentsByPostId(post.id!);
      post['comments'] = flatComments;
      // Unique commenters for hover list
      const nameSet = new Set<string>();
      post['uniqueCommenters'] = [];
      for (const c of flatComments) {
        if (c.authorName && !nameSet.has(c.authorName)) {
          nameSet.add(c.authorName);
          (post['uniqueCommenters'] as any[]).push(c);
        }
      }
      post['reactions'] = await this.feedService.getReactionsByPostId(post.id!);
      post['reactionCounts'] = await this.feedService.getReactionCountsForPost(post.id!);
      post['onItUsers'] = await this.feedService.getOnItUsersByPostId(post.id!);
      let author = this.users.find(u => u.id === post.authorId);
      if (!author) {
        // Fallback match: some posts used hashed email as authorId
        author = this.users.find(u => this.computeEmailHash(u.email) === post.authorId);
      }
      post['authorUserId'] = author?.id;
      post['authorDepartment'] = (author as any)?.departmentName || (author as any)?.department || '';
      if (this.currentUser) {
        post['userReaction'] = await this.feedService.getUserReaction(post.id, undefined, this.getUserId());
        for (const c of flatComments) {
          c['userReaction'] = await this.feedService.getUserReaction(undefined, c.id, this.getUserId());
        }
        post['userOnIt'] = await this.feedService.getUserOnIt(post.id!, this.getUserId());
      }
      post['commentTree'] = this.buildCommentTree(flatComments);
    }
    // Build available tags from posts
    const tagSet = new Set<string>();
    for (const p of this.posts) {
      (p.tags || []).forEach(t => tagSet.add(t));
    }
    this.availableTags = Array.from(tagSet).sort();
    this.applyFilters();
  }

  private buildCommentTree(comments: any[]): any[] {
    const byId: { [key: number]: any } = {};
    const roots: any[] = [];
    for (const c of comments) {
      // Map author userId from known users by id or by email hash
      let authorUserId: number | undefined = undefined;
      const direct = this.users.find(u => u.id === c.authorId);
      if (direct) authorUserId = direct.id; else {
        const viaHash = this.users.find(u => this.computeEmailHash(u.email) === c.authorId);
        if (viaHash) authorUserId = viaHash.id;
      }
      byId[c.id] = { ...c, authorUserId, children: [], depth: 0 };
    }
    for (const c of comments) {
      const node = byId[c.id];
      if (c.parentId) {
        const parent = byId[c.parentId];
        if (parent) {
          node.depth = (parent.depth || 0) + 1;
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  private async loadUsers(): Promise<void> {
    this.users = await this.feedService.getAllUsers();
    this.filteredUsers = [...this.users];
    try {
      const depts = await this.authService.listDepartments();
      this.availableDepartments = depts.map(d => d.name);
    } catch {
      const deptSet = new Set<string>();
      for (const u of this.users) {
        const d = (u as any).departmentName || (u as any).department || '';
        if (d) deptSet.add(d);
      }
      this.availableDepartments = Array.from(deptSet).sort();
    }
  }

  openCreatePostDialog(): void {
    const dialogRef = this.dialog.open(CreatePostDialogComponent, {
      width: '600px',
      data: { currentUser: this.currentUser }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPosts();
      }
    });
  }

  toggleComments(postId: number): void {
    this.showCommentSection[postId] = !this.showCommentSection[postId];
  }

  async addComment(postId: number, content: string): Promise<void> {
    const trimmedContent = content?.trim();
    if (!trimmedContent || !this.currentUser) return;

    const comment: Partial<Comment> = {
      postId,
      authorId: this.getUserId(),
      authorName: this.currentUser.name,
      content: trimmedContent
    };

    await this.feedService.createComment(comment);
    await this.loadPosts();
    // Keep comment section open
    this.showCommentSection[postId] = true;
  }

  async toggleReaction(postId: number, type: ReactionType): Promise<void> {
    if (!this.currentUser) return;

    const existingReaction = await this.feedService.getUserReaction(postId, undefined, this.getUserId());
    
    if (existingReaction && existingReaction.type === type) {
      // Remove reaction
      await this.feedService.removeReaction(postId, undefined, this.getUserId());
    } else {
      // Add or update reaction
      await this.feedService.addReaction({
        postId,
        userId: this.getUserId(),
        userName: this.currentUser.name,
        type
      });
    }

    await this.loadPosts();
  }

  async onPostReactionButtonClick(post: any): Promise<void> {
    if (!this.currentUser) return;
    if (post['userReaction']) {
      await this.feedService.removeReaction(post.id!, undefined, this.getUserId());
      post['userReaction'] = undefined;
    } else {
      await this.feedService.addReaction({
        postId: post.id!,
        userId: this.getUserId(),
        userName: this.currentUser.name,
        type: ReactionType.LIKE
      });
      post['userReaction'] = { type: ReactionType.LIKE } as any;
    }
  }

  async toggleOnIt(post: any): Promise<void> {
    if (!this.currentUser) return;
    await this.feedService.toggleOnIt(post.id!, this.getUserId(), this.currentUser.name);
    const currentlyOnIt = !!post['userOnIt'];
    post['userOnIt'] = !currentlyOnIt;
    if (!post['onItUsers']) post['onItUsers'] = [];
    if (post['userOnIt']) {
      if (!post['onItUsers'].some((u: any) => u.id === this.getUserId())) {
        post['onItUsers'] = [...post['onItUsers'], { id: this.getUserId(), name: this.currentUser.name }]
          .sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    } else {
      post['onItUsers'] = post['onItUsers'].filter((u: any) => u.id !== this.getUserId());
    }
  }

  showResponsibleForPostId: number | null = null;
  openResponsible(postId: number): void {
    this.showResponsibleForPostId = postId;
  }
  closeResponsible(): void {
    this.showResponsibleForPostId = null;
  }

  getReactionEmoji(type: ReactionType): string {
    const emojiMap: { [key: string]: string } = {
      'like': '👍',
      'celebrate': '🎉',
      'support': '🤝',
      'love': '❤️',
      'insightful': '💡',
      'curious': '🤔'
    };
    return emojiMap[type] || '👍';
  }

  getReactionLabel(type: ReactionType | undefined): string {
    if (!type) return '';
    const labelMap: { [key: string]: string } = {
      'like': 'Like',
      'celebrate': 'Celebrate',
      'support': 'Support',
      'love': 'Love',
      'insightful': 'Insightful',
      'curious': 'Curious'
    };
    return labelMap[type] || '';
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  getStatusColor(status?: string): string {
    const colorMap: { [key: string]: string } = {
      'todo': '#757575',
      'in_progress': '#2196F3',
      'done': '#4CAF50',
      'blocked': '#F44336'
    };
    return colorMap[status || ''] || '#757575';
  }

  getPriorityColor(priority?: string): string {
    const colorMap: { [key: string]: string } = {
      'low': '#4CAF50',
      'medium': '#FF9800',
      'high': '#F44336',
      'urgent': '#9C27B0'
    };
    return colorMap[priority || ''] || '#757575';
  }

  private getUserId(): number {
    // For now, use a hash of email or generate from user data
    // In a real app, users should have numeric IDs
    if (!this.currentUser || !this.currentUser.email) return 0;
    return Math.abs(this.currentUser.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  }

  private computeEmailHash(email: string | undefined): number {
    if (!email) return -1;
    return Math.abs(email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  }

  canManagePost(post: Post): boolean {
    if (!this.currentUser) return false;
    // Managers and admins can manage any post, authors can manage their own
    const userRole = (this.currentUser as any).role;
    return userRole === 'manager' || userRole === 'admin' || post.authorId === this.getUserId();
  }

  async pinPost(postId: number, pin: boolean): Promise<void> {
    await this.feedService.updatePost(postId, { isPinned: pin });
    await this.loadPosts();
  }

  async toggleCommentReaction(commentId: number, type: ReactionType): Promise<void> {
    if (!this.currentUser) return;
    const existingReaction = await this.feedService.getUserReaction(undefined, commentId, this.getUserId());
    if (existingReaction && existingReaction.type === type) {
      await this.feedService.removeReaction(undefined, commentId, this.getUserId());
    } else {
      await this.feedService.addReaction({
        commentId,
        userId: this.getUserId(),
        userName: this.currentUser.name,
        type
      });
    }
    await this.loadPosts();
  }

  async onCommentReactionButtonClick(comment: any): Promise<void> {
    if (!this.currentUser) return;
    if (comment['userReaction']) {
      await this.feedService.removeReaction(undefined, comment.id!, this.getUserId());
      comment['userReaction'] = undefined;
    } else {
      await this.feedService.addReaction({
        commentId: comment.id!,
        userId: this.getUserId(),
        userName: this.currentUser.name,
        type: ReactionType.LIKE
      });
      comment['userReaction'] = { type: ReactionType.LIKE } as any;
    }
  }

  toggleReply(commentId: number): void {
    this.showReplyInput[commentId] = !this.showReplyInput[commentId];
  }

  async addReply(postId: number, parentCommentId: number, content: string): Promise<void> {
    const trimmedContent = content?.trim();
    if (!trimmedContent || !this.currentUser) return;
    const reply: Partial<Comment> = {
      postId,
      authorId: this.getUserId(),
      authorName: this.currentUser.name,
      content: trimmedContent,
      parentId: parentCommentId
    };
    await this.feedService.createComment(reply);
    await this.loadPosts();
    this.showReplyInput[parentCommentId] = false;
  }

  onTextareaKeyup(event: KeyboardEvent, contextType: 'post' | 'reply', postId: number, input: HTMLTextAreaElement, commentId?: number): void {
    const key = (event as any).key as string;
    if (key === '@') {
      this.mention.active = true;
      this.mention.search = '';
      this.mention.context = { type: contextType, postId, commentId: commentId || 0 };
      this.mention.targetInput = input;
      this.filteredUsers = [...this.users];
    }
  }

  onMentionSearchChange(value: string): void {
    this.mention.search = value;
    const term = value.toLowerCase();
    this.filteredUsers = this.users.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
  }

  selectMention(user: { id: number; name: string; email: string }): void {
    const input = this.mention.targetInput;
    if (!input) return;
    const cursorPos = input.selectionStart || 0;
    const value = input.value;
    const atIndex = value.lastIndexOf('@', cursorPos - 1);
    const before = atIndex >= 0 ? value.substring(0, atIndex) : value.substring(0, cursorPos);
    const after = value.substring(cursorPos);
    const insertText = `@${user.name}`;
    input.value = `${before}${insertText} ${after}`;
    const newCursor = (before + insertText + ' ').length;
    input.setSelectionRange(newCursor, newCursor);
    input.dispatchEvent(new Event('input'));
    this.mention.active = false;
  }

  closeMention(): void {
    this.mention.active = false;
  }

  // Filters actions
  openDepartmentsPanel(): void { this.showDepartmentsPanel = true; }
  closeDepartmentsPanel(): void { this.showDepartmentsPanel = false; }
  toggleTag(tag: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedTags.includes(tag)) this.selectedTags = [...this.selectedTags, tag];
    } else {
      this.selectedTags = this.selectedTags.filter(t => t !== tag);
    }
    this.applyFilters();
  }
  toggleAllTagsToggle(): void {
    const allSelected = this.availableTags.length > 0 && this.selectedTags.length === this.availableTags.length;
    this.selectedTags = allSelected ? [] : [...this.availableTags];
    this.applyFilters();
  }
  toggleDepartment(dept: string, checked: boolean): void {
    if (checked) {
      if (!this.selectedDepartments.includes(dept)) this.selectedDepartments = [...this.selectedDepartments, dept];
    } else {
      this.selectedDepartments = this.selectedDepartments.filter(d => d !== dept);
    }
    this.applyFilters();
  }
  get allDepartmentsSelected(): boolean {
    return this.availableDepartments.length > 0 && this.selectedDepartments.length === this.availableDepartments.length;
  }
  toggleAllDepartmentsToggle(): void {
    const allSelected = this.allDepartmentsSelected;
    this.selectedDepartments = allSelected ? [] : [...this.availableDepartments];
    this.applyFilters();
  }

  private applyFilters(): void {
    const hasTagFilter = this.selectedTags.length > 0;
    const hasDeptFilter = this.selectedDepartments.length > 0;
    if (!hasTagFilter && !hasDeptFilter) {
      this.filteredPosts = [...this.posts];
      return;
    }
    this.filteredPosts = this.posts.filter((p: any) => {
      const tagMatch = !hasTagFilter || (p.tags || []).some((t: string) => this.selectedTags.includes(t));
      const dept = (p['authorDepartment'] || '').toString();
      const deptMatch = !hasDeptFilter || this.selectedDepartments.some(d => (d || '').toString().trim().toLowerCase() === dept.trim().toLowerCase());
      return tagMatch && deptMatch;
    });
  }

  async markTaskDone(postId: number): Promise<void> {
    await this.feedService.updatePost(postId, { status: TaskStatus.DONE });
  }
}

