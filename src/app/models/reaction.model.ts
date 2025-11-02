export enum ReactionType {
  LIKE = 'like',
  CELEBRATE = 'celebrate',
  SUPPORT = 'support',
  LOVE = 'love',
  INSIGHTFUL = 'insightful',
  CURIOUS = 'curious'
}

export class Reaction {
  id?: number;
  postId?: number;
  commentId?: number;
  userId: number;
  userName: string;
  type: ReactionType;
  createdAt: number;
}

