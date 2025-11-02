import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  currentUser: any | null = null;
  isAuthenticated: boolean = false;
  private authSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state
    this.authSubscription = this.authService.isAuthenticated$.subscribe(
      isAuth => {
        this.isAuthenticated = isAuth;
        if (!isAuth) {
          this.currentUser = null;
        }
      }
    );

    // Subscribe to current user
    this.userSubscription = this.authService.currentUser$.subscribe(
      user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      }
    );
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  showDetails(): void {
    this.router.navigate(['details']);
  }

  goToFeed(): void {
    this.router.navigate(['home']);
  }

  logout(): void {
    this.authService.logout();
  }
}
