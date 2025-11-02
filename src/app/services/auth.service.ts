import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

import { LocalStorageService } from './local-storage.service';

interface UserData {
  id?: number;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  createdAt: number;
  role?: 'manager' | 'executant' | 'admin';
  departmentName?: string;
  departmentId?: number;
  manager_id?: number;
  department?: string;
  position?: string;
  avatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  public currentUser$: Observable<any | null> = this.currentUserSubject.asObservable();
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

  constructor(
    private localStorage: LocalStorageService,
    private router: Router
  ) {
    // Initialize auth status - check if user is already logged in
    this.initializeAuthStatus();
  }

  // Departments API for UI
  async listDepartments(): Promise<{ id: number; name: string }[]> {
    const db = this.localStorage.getDatabase();
    const rows = await db.departments.toArray();
    return rows.map(r => ({ id: r.id!, name: r.name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  // Initialize auth status synchronously first, then verify asynchronously
  private initializeAuthStatus(): void {
    const userInfo = window.localStorage.getItem('UserInfo');
    if (userInfo) {
      try {
        const userData = JSON.parse(userInfo);
        // If we have user data in localStorage, restore it immediately
        // This prevents the user from appearing logged out during async verification
        if (userData && userData.email) {
          const user = {
            name: userData.name || '',
            email: userData.email,
            phone: userData.phone || '',
            role: userData.role || 'executant'
          };
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    // Then verify against database asynchronously
    this.verifyAuthStatus();
  }

  // Verify user still exists in database (async, non-blocking)
  private async verifyAuthStatus(): Promise<void> {
    const userInfo = window.localStorage.getItem('UserInfo');
    if (!userInfo) {
      return;
    }

    try {
      // Wait a bit for database to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const userData = JSON.parse(userInfo);
      if (!userData || !userData.email) {
        return;
      }

      // Verify user still exists in database
      const dbUser = await this.getUserByEmail(userData.email);
      
      if (dbUser) {
        const updated = {
          name: dbUser.name,
          email: dbUser.email,
          phone: dbUser.phone,
          role: dbUser.role || 'executant'
        };
        window.localStorage.setItem('UserInfo', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
        this.isAuthenticatedSubject.next(true);
      } else {
        // User not in database - but don't logout, maybe it's a timing issue
        // Only logout if we're sure the user doesn't exist (after multiple retries)
        console.warn('User not found in database during verification, keeping session from localStorage');
      }
    } catch (error) {
      console.error('Error verifying auth status:', error);
      // On error, keep the user logged in from localStorage
      // Don't clear auth state unless we're absolutely sure
    }
  }

  // Hash password using Web Crypto API
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  // Register new user
  async register(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: 'manager' | 'executant' | 'admin' = 'executant',
    departmentName?: string,
    managerId?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const db = this.localStorage.getDatabase();
      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'Email already registered. Please login instead.' };
      }

      // Validate password strength
      if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long.' };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Ensure department exists
      let departmentId: number | undefined = undefined;
      let normalizedDeptName = (departmentName || '').trim();
      if (normalizedDeptName) {
        const existingDept = await db.departments.where('name').equalsIgnoreCase(normalizedDeptName).first();
        if (existingDept) {
          departmentId = existingDept.id!;
          normalizedDeptName = existingDept.name;
        } else {
          departmentId = await db.departments.add({ name: normalizedDeptName });
        }
      }

      // Create user data
      const userData: UserData = {
        name,
        email,
        phone,
        passwordHash,
        createdAt: Date.now(),
        role,
        departmentName: normalizedDeptName || undefined,
        departmentId,
        manager_id: managerId
      };

      // Store user in database
      await db.users.add(userData);

      // Link membership if department provided
      if (departmentId) {
        const created = await this.getUserByEmail(email);
        if (created?.id) {
          const exists = await db.departmentMembers
            .where('[departmentId+userId]').equals([departmentId, created.id]).first();
          if (!exists) {
            await db.departmentMembers.add({ departmentId, userId: created.id });
          }
        }
      }

      // Auto-login after registration
      await this.login(email, password);

      return { success: true, message: 'Registration successful!' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user
  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        return { success: false, message: 'Invalid email or password.' };
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return { success: false, message: 'Invalid email or password.' };
      }

      const userDataToStore = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'executant'
      };
      window.localStorage.setItem('UserInfo', JSON.stringify(userDataToStore));
      this.currentUserSubject.next(userDataToStore);
      this.isAuthenticatedSubject.next(true);

      return { success: true, message: 'Login successful!' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Get user by email
  private async getUserByEmail(email: string): Promise<UserData | undefined> {
    const db = this.localStorage.getDatabase();
    return await db.users.where('email').equals(email).first();
  }

  // Public wrapper for components needing to query by email
  async findUserByEmail(email: string): Promise<any | undefined> {
    const db = this.localStorage.getDatabase();
    return await db.users.where('email').equals(email).first();
  }

  // Get current user
  getCurrentUser(): any | null {
    return this.currentUserSubject.value;
  }

  async getDbUserById(id: number): Promise<any | undefined> {
    const db = this.localStorage.getDatabase();
    return await db.users.get(id);
  }

  async updateCurrentUser(updates: { name?: string; phone?: string; avatar?: string; departmentName?: string }): Promise<void> {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const db = this.localStorage.getDatabase();
    const user = await this.getUserByEmail(current.email);
    if (!user) return;

    let departmentId: number | undefined = user.departmentId;
    let departmentName = updates.departmentName !== undefined ? updates.departmentName : user.departmentName;
    if (updates.departmentName && updates.departmentName.trim()) {
      const norm = updates.departmentName.trim();
      const existing = await db.departments.where('name').equalsIgnoreCase(norm).first();
      if (existing) {
        departmentId = existing.id!;
        departmentName = existing.name;
      } else {
        departmentId = await db.departments.add({ name: norm });
        departmentName = norm;
      }
    }

    await db.users.update(user.id!, {
      name: updates.name !== undefined ? updates.name : user.name,
      phone: updates.phone !== undefined ? updates.phone : user.phone,
      avatar: updates.avatar !== undefined ? updates.avatar : user.avatar,
      departmentName: departmentName,
      departmentId: departmentId
    });

    const updatedLocal = {
      name: updates.name !== undefined ? updates.name : user.name,
      email: user.email,
      phone: updates.phone !== undefined ? updates.phone : user.phone,
      role: user.role || 'executant'
    };
    this.currentUserSubject.next(updatedLocal);
    this.isAuthenticatedSubject.next(true);
    window.localStorage.setItem('UserInfo', JSON.stringify(updatedLocal));
  }

  async assignEmployeesToManager(managerId: number, employeeIds: number[]): Promise<void> {
    const db = this.localStorage.getDatabase();
    for (const eid of employeeIds) {
      await db.users.update(eid, { manager_id: managerId });
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  // Logout user
  logout(): void {
    window.localStorage.removeItem('UserInfo');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  // Removed donation/score update methods
}

