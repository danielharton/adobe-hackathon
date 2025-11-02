import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  isOwner = false;
  edit = false;
  isManager = false;
  viewedUserId: number | null = null;
  isSubordinate = false;
  managerName: string = '';

  // Editable fields
  name = '';
  phone = '';
  avatar = '';
  departmentName = '';

  departments: { id: number; name: string }[] = [];
  deptSearch = '';
  deptDropdownOpen = false;

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  async ngOnInit(): Promise<void> {
    const paramId = this.route.snapshot.paramMap.get('id');
    const current = this.auth.getCurrentUser();
    let dbUser: any | undefined;
    if (paramId) {
      dbUser = await this.auth.getDbUserById(Number(paramId));
      this.isOwner = !!(current && dbUser && current.email === dbUser.email);
      this.viewedUserId = Number(paramId);
    } else if (current) {
      const raw = await this.auth.findUserByEmail(current.email);
      dbUser = raw;
      this.isOwner = true;
      this.viewedUserId = raw?.id || null;
    }
    const base = dbUser || current;
    if (base) {
      this.user = base;
      this.name = base.name || '';
      this.phone = base.phone || '';
      this.avatar = base.avatar || '';
      this.departmentName = base.departmentName || '';
      // Load manager name for the inspected user
      if (base.manager_id) {
        try {
          const mgr = await this.auth.getDbUserById(base.manager_id);
          this.managerName = mgr?.name || '';
          (this.user as any).managerName = this.managerName;
        } catch {}
      } else {
        this.managerName = '';
        (this.user as any).managerName = '';
      }
    }
    try { this.departments = await this.auth.listDepartments(); } catch {}
    // Determine if current user is a manager
    if (current) {
      const me = await this.auth.findUserByEmail(current.email);
      this.isManager = (me?.role || 'executant') === 'manager';
      if (this.viewedUserId && me?.id) {
        const viewed = await this.auth.getDbUserById(this.viewedUserId);
        this.isSubordinate = !!(viewed && viewed.manager_id === me.id);
      }
    }
  }

  toggleEdit(): void {
    if (!this.isOwner) return;
    this.edit = !this.edit;
  }

  async save(): Promise<void> {
    if (!this.isOwner) return;
    await this.auth.updateCurrentUser({ name: this.name, phone: this.phone, avatar: this.avatar, departmentName: this.departmentName });
    this.edit = false;
  }

  openDeptDropdown(): void { this.deptDropdownOpen = true; }
  onDeptSearch(term: string): void { this.deptSearch = term; this.deptDropdownOpen = true; }
  selectDept(name: string): void { this.departmentName = name; this.deptSearch = ''; this.deptDropdownOpen = false; }
  hasDeptExact(term: string): boolean { const lc = (term||'').trim().toLowerCase(); return this.departments.some(d=>d.name.toLowerCase()===lc); }

  // Manager actions
  async addEmployee(): Promise<void> {
    if (!this.isManager || !this.viewedUserId) return;
    const me = await this.auth.findUserByEmail(this.auth.getCurrentUser()!.email);
    await this.auth.assignEmployeesToManager(me!.id!, [this.viewedUserId]);
    this.isSubordinate = true;
  }

  async removeEmployee(): Promise<void> {
    if (!this.isManager || !this.viewedUserId) return;
    await (this.auth as any).localStorage.getDatabase().users.update(this.viewedUserId, { manager_id: null });
    this.isSubordinate = false;
  }
}
