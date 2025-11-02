import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FeedService } from '../../services/feed.service';
import { Post, PostType, TaskStatus } from '../../models/post.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-create-post-dialog',
  templateUrl: './create-post-dialog.component.html',
  styleUrls: ['./create-post-dialog.component.css']
})
export class CreatePostDialogComponent {
  postForm: FormGroup;
  postTypes = Object.values(PostType);
  taskStatuses = Object.values(TaskStatus);
  priorities = ['low', 'medium', 'high', 'urgent'];
  users: any[] = [];
  isManager: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<CreatePostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { currentUser: any | null },
    private feedService: FeedService,
    private authService: AuthService
  ) {
    this.isManager = (data.currentUser as any)?.role === 'manager' || (data.currentUser as any)?.role === 'admin';
    
    this.postForm = new FormGroup({
      title: new FormControl('', [Validators.required, Validators.minLength(3)]),
      content: new FormControl('', [Validators.required, Validators.minLength(10)]),
      type: new FormControl(PostType.UPDATE, [Validators.required]),
      status: new FormControl(TaskStatus.TODO),
      priority: new FormControl('medium'),
      assignedTo: new FormControl(null),
      assignedToName: new FormControl(''),
      tags: new FormControl(''), // Comma-separated
      dueDate: new FormControl(null)
    });

    // Load users for assignment (if manager)
    this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    // In a real app, load from user service
    // For now, just leave empty or mock
    this.users = [];
  }

  async onSubmit(): Promise<void> {
    if (this.postForm.invalid) {
      return;
    }

    const formValue = this.postForm.value;
    const tags = formValue.tags 
      ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
      : [];

    const postData: Partial<Post> = {
      authorId: this.getUserId(),
      authorName: this.data.currentUser?.name || 'Unknown',
      title: formValue.title,
      content: formValue.content,
      type: formValue.type,
      status: formValue.type === PostType.TASK ? formValue.status : undefined,
      priority: formValue.type === PostType.TASK ? formValue.priority : undefined,
      assignedTo: formValue.assignedTo,
      assignedToName: formValue.assignedToName,
      tags: tags,
      dueDate: formValue.dueDate ? new Date(formValue.dueDate).getTime() : undefined
    };

    try {
      await this.feedService.createPost(postData);
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  get showTaskFields(): boolean {
    return this.postForm.get('type')?.value === PostType.TASK;
  }

  private getUserId(): number {
    if (!this.data.currentUser || !this.data.currentUser.email) return 0;
    return Math.abs(this.data.currentUser.email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
  }
}

