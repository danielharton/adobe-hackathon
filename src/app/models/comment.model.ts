export class Comment {
  id?: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  updatedAt?: number;
  reactionCount: number;
  parentId?: number; // For nested comments/replies
}

