import { Component } from '@angular/core';
import { FeedService } from './services/feed.service';
import { LocalStorageService } from './services/local-storage.service';
import { AuthService } from './services/auth.service';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'teamlab';

  // constructor(private firebaseDb: AngularFirestore) {

  // }

  showChatPanel = false;
  chatSearch = '';
  chatUsers: { id: number; name: string }[] = [];
  chatFilteredUsers: { id: number; name: string }[] = [];
  chatConversations: { id: string; title: string }[] = [];
  showConversation = false;
  selectedChatUser: { id: number; name: string } | null = null;

  constructor(private feedService: FeedService, private localStorage: LocalStorageService, private auth: AuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      const users = await this.feedService.getAllUsers();
      this.chatUsers = users.map(u => ({ id: u.id, name: u.name }));
      this.chatFilteredUsers = [...this.chatUsers];
      this.chatConversations = [];
    } catch {}

    const setHide = (url: string) => {
      const path = url.split('?')[0];
      this.hideChatUI = path === '/login' || path === '/signup' || path === '';
    };
    setHide(this.router.url);
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        setHide(ev.urlAfterRedirects);
      }
    });
  }

  toggleChatPanel(): void {
    this.showChatPanel = !this.showChatPanel;
  }

  onChatSearch(term: string): void {
    this.chatSearch = term;
    const lc = term.toLowerCase();
    this.chatFilteredUsers = this.chatUsers.filter(u => u.name.toLowerCase().includes(lc));
  }

  toggleChatbot(): void {
    this.showChatbot = !this.showChatbot;
    if (this.showChatbot && this.chatbotMessages.length === 0) {
      this.pushBot("Hi! I'm your TeamLab Assistant. Ask me about posting, filters, pinning, departments, or troubleshooting login/signup. Try: 'how to create a post' or 'filters troubleshooting'.");
    }
  }

  openConversation(user: { id: number; name: string }): void {
    this.selectedChatUser = user;
    this.showConversation = true;
    this.loadConversation();
  }

  closeConversation(): void {
    this.showConversation = false;
    this.selectedChatUser = null;
  }

  messages: { id?: number; conversationId?: number; senderId: number; text: string; createdAt: number }[] = [];
  private conversationId: number | null = null;

  private async loadConversation(): Promise<void> {
    const db = this.localStorage.getDatabase();
    const me = this.auth.getCurrentUser();
    if (!me || !this.selectedChatUser) return;
    const myUser = await this.auth.findUserByEmail(me.email);
    const myId = myUser?.id as number;
    const otherId = this.selectedChatUser.id;
    let conv = await db.conversations
      .where('[userAId+userBId]')
      .equals([Math.min(myId, otherId), Math.max(myId, otherId)])
      .first();
    if (!conv) {
      const id = await db.conversations.add({ userAId: Math.min(myId, otherId), userBId: Math.max(myId, otherId), createdAt: Date.now() });
      conv = { id, userAId: Math.min(myId, otherId), userBId: Math.max(myId, otherId), createdAt: Date.now() } as any;
    }
    this.conversationId = conv.id!;
    const msgs = await db.messages.where('conversationId').equals(this.conversationId).sortBy('createdAt');
    this.messages = msgs as any;
  }

  async sendMessage(input: HTMLInputElement): Promise<void> {
    const text = (input.value || '').trim();
    if (!text || !this.conversationId) return;
    const me = await this.auth.findUserByEmail(this.auth.getCurrentUser()!.email);
    const db = this.localStorage.getDatabase();
    const msg = { conversationId: this.conversationId, senderId: me!.id!, text, createdAt: Date.now() };
    const id = await db.messages.add(msg as any);
    this.messages = [...this.messages, { ...msg, id }];
    input.value = '';
  }

  // Hide chat UI on auth pages
  hideChatUI = false;

  // Chatbot
  showChatbot = false;
  chatbotMessages: { role: 'bot' | 'me'; text: string }[] = [];

  private pushBot(text: string) { this.chatbotMessages = [...this.chatbotMessages, { role: 'bot', text }]; }
  private pushMe(text: string) { this.chatbotMessages = [...this.chatbotMessages, { role: 'me', text }]; }

  sendChatbotMessage(input: HTMLInputElement): void {
    const text = (input.value || '').trim();
    if (!text) return;
    this.pushMe(text);
    input.value = '';
    const replies = this.getBotReply(text.toLowerCase());
    replies.forEach(r => this.pushBot(r));
  }

  closeChatbot(): void { this.showChatbot = false; }

  private getBotReply(q: string): string[] {
    // Simple FAQ/assist logic
    if (q.includes('create post') || q.includes('new post')) {
      return [
        'To create a post: go to Feed, click Create Post, fill title/content, then Save.',
        'You can add tags and task details; pinned posts appear first.'
      ];
    }
    if (q.includes('filter')) {
      return [
        'Open Filters in the Feed header.',
        'Choose Departments (right-side panel) and/or Tags from the dropdown.',
        'Click Done to apply. Selecting “All” twice clears selections.'
      ];
    }
    if (q.includes('pin') || q.includes('pinned')) {
      return [
        'Click the three dots on a post and choose Pin/Unpin.',
        'Pinned posts are ordered by the time they were pinned (newest first).'
      ];
    }
    if (q.includes('department') && (q.includes('signup') || q.includes('register'))) {
      return [
        'On Signup, type to search Department. If none exists, select Add “name”.',
        'Selecting Manager role reveals Assign employees (search and tick).'
      ];
    }
    if (q.includes('login') || q.includes('signup') || q.includes('register')) {
      return [
        'Trouble logging in? Check email and password (≥ 6 chars).',
        'If registered recently, refresh the page and try again.']
    }
    if (q.includes('reaction') || q.includes('like') || q.includes('emoji')) {
      return [
        'Hover the Like circle to choose reactions (Like, Celebrate, Support, Love, etc.).',
        'Click the circle again to remove your reaction.'
      ];
    }
    if (q.includes('manager') && q.includes('employee')) {
      return [
        'Managers can assign employees on Signup, or from a user profile with Add/Remove employee.'
      ];
    }
    if (q.startsWith('go to ') || q.includes('open feed') || q.includes('open profile')) {
      if (q.includes('feed')) this.router.navigate(['/feed']);
      if (q.includes('profile')) this.router.navigate(['/profile']);
      return ['Navigation command received.'];
    }
    return ['Here are some things I can help with: create post, filters, pinning, departments, manager/employee, reactions, or type “go to feed/profile”.'];
  }
}
