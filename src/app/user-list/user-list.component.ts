import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FeedService } from '../services/feed.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: { id: number; name: string; email: string }[] = [];
  name = '';
  email = '';

  constructor(private feed: FeedService, private auth: AuthService) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    const list = await this.feed.getAllUsers();
    this.users = list.map(u => ({ id: u.id, name: u.name, email: u.email }));
  }

  async addUser(): Promise<void> {
    const n = this.name.trim();
    const e = this.email.trim();
    if (!n || !e) return;
    // quick add via register with default password
    await this.auth.register(n, e, '', 'Temp123!', 'executant', undefined);
    this.name = '';
    this.email = '';
    await this.refresh();
  }
}


