import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  hidePassword: boolean = true;
  isLoading: boolean = false;
  errorMessage: string = '';
  returnUrl: string = '/home';

  loginFormGroup = new FormGroup({
    emailFormControl: new FormControl('', [Validators.required, Validators.email]),
    passwordFormControl: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to '/home'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  async loginUser(event?: Event): Promise<void> {
    // Prevent default form submission
    if (event) {
      event.preventDefault();
    }

    // Reset error message
    this.errorMessage = '';

    // Validate form
    if (this.loginFormGroup.invalid) {
      this.markFormGroupTouched(this.loginFormGroup);
      console.log('Form is invalid:', this.loginFormGroup.errors);
      return;
    }

    this.isLoading = true;

    const email = this.loginFormGroup.get('emailFormControl')?.value;
    const password = this.loginFormGroup.get('passwordFormControl')?.value;

    try {
      const result = await this.authService.login(email, password);
      
      if (result.success) {
        // Navigate to return URL or home
        this.router.navigate([this.returnUrl]);
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      this.errorMessage = 'An error occurred. Please try again.';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Helper method to mark all form fields as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
