import { Component, OnInit, HostListener } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ViewChild, ElementRef } from '@angular/core';
import { FeedService } from '../services/feed.service';

// Custom validator function (outside class to avoid initialization order issues)
function passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
  const password = group.get('passwordFormControl')?.value;
  const confirmPassword = group.get('confirmPasswordFormControl')?.value;
  
  if (!password || !confirmPassword) {
    return null; // Don't validate if fields are empty (required validator will handle it)
  }
  
  if (password !== confirmPassword) {
    const confirmControl = group.get('confirmPasswordFormControl');
    if (confirmControl) {
      const currentErrors = confirmControl.errors || {};
      confirmControl.setErrors({ ...currentErrors, passwordMismatch: true });
    }
    return { passwordMismatch: true };
  } else {
    const confirmControl = group.get('confirmPasswordFormControl');
    if (confirmControl && confirmControl.hasError('passwordMismatch')) {
      const errors = { ...confirmControl.errors };
      delete errors['passwordMismatch'];
      const hasOtherErrors = Object.keys(errors).length > 0;
      confirmControl.setErrors(hasOtherErrors ? errors : null);
    }
    return null;
  }
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  private viewportHeight: number = typeof window !== 'undefined' ? window.innerHeight : 800;
  // Departments
  departments: { id: number; name: string }[] = [];
  filteredDepartments: { id: number; name: string }[] = [];
  departmentSearch: string = '';
  selectedDepartmentName: string = '';
  // Manager employees selection
  employees: { id: number; name: string; email: string; role?: string }[] = [];
  filteredEmployees: { id: number; name: string; email: string; role?: string }[] = [];
  employeeSearch: string = '';
  selectedEmployeeIds: number[] = [];
  departmentDropdownOpen: boolean = false;
  employeesListOpen = false;

  @ViewChild('nameInput') nameInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('signupFormBox') formBoxRef!: ElementRef<HTMLFormElement>;

  signupFormGroup = new FormGroup({
    nameFormControl: new FormControl('', [Validators.required, Validators.minLength(2)]),
    emailFormControl: new FormControl('', [Validators.required, Validators.email]),
    phoneFormControl: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]),
    passwordFormControl: new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPasswordFormControl: new FormControl('', [Validators.required]),
    typeFormControl: new FormControl('executant', [Validators.required]),
    departmentFormControl: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  constructor(
    private authService: AuthService,
    private router: Router,
    private feedService: FeedService
  ) {}

  @HostListener('window:resize')
  onWindowResize(): void {
    this.viewportHeight = typeof window !== 'undefined' ? window.innerHeight : this.viewportHeight;
  }

  ngOnInit(): void {
    // If already logged in, redirect to home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
    this.loadDepartments();
    this.loadEmployees();

    // Ensure Name field is fully visible when switching to Manager
    this.signupFormGroup.get('typeFormControl')?.valueChanges.subscribe((val) => {
      if (val === 'manager') {
        setTimeout(() => {
          if (this.formBoxRef?.nativeElement) {
            this.formBoxRef.nativeElement.scroll({ top: 0, behavior: 'smooth' });
          }
          if (this.nameInputRef?.nativeElement) {
            this.nameInputRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
      }
    });
  }

  async loadDepartments(): Promise<void> {
    try {
      this.departments = await this.authService.listDepartments();
      this.filteredDepartments = [...this.departments];
    } catch {}
  }

  async loadEmployees(): Promise<void> {
    try {
      const users = await this.feedService.getAllUsers();
      this.employees = (users as any[]).map(u => ({ id: u.id, name: u.name, email: u.email, role: (u as any).role }))
        .filter(u => (u.role || 'executant') !== 'manager');
      this.filteredEmployees = [...this.employees];
    } catch {}
  }

  async signup(event?: Event): Promise<void> {
    // Prevent default form submission
    if (event) {
      event.preventDefault();
    }

    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate form
    if (this.signupFormGroup.invalid) {
      this.markFormGroupTouched(this.signupFormGroup);
      console.log('Form is invalid:', this.signupFormGroup.errors);
      return;
    }

    this.isLoading = true;

    const name = this.signupFormGroup.get('nameFormControl')?.value;
    const email = this.signupFormGroup.get('emailFormControl')?.value;
    const phone = this.signupFormGroup.get('phoneFormControl')?.value;
    const password = this.signupFormGroup.get('passwordFormControl')?.value;
    const role = this.signupFormGroup.get('typeFormControl')?.value === 'manager' ? 'manager' : 'executant';
    const departmentName = (this.selectedDepartmentName || '').trim();

    try {
      const result = await this.authService.register(name, email, phone, password, role as any, departmentName);
      
      if (result.success) {
        this.successMessage = result.message;
        // Redirect after successful registration (auto-login happens in service)
        setTimeout(async () => {
          if (role === 'manager' && this.selectedEmployeeIds.length > 0) {
            const mgr = await this.authService.findUserByEmail(email);
            if (mgr?.id) {
              await this.authService.assignEmployeesToManager(mgr.id, this.selectedEmployeeIds);
            }
          }
          this.router.navigate(['/home']);
        }, 1000);
      } else {
        this.errorMessage = result.message;
      }
    } catch (error) {
      this.errorMessage = 'Registration failed. Please try again.';
      console.error('Signup error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  onDepartmentSearch(term: string): void {
    this.departmentSearch = term;
    const lc = term.toLowerCase();
    this.filteredDepartments = this.departments.filter(d => d.name.toLowerCase().includes(lc));
    this.departmentDropdownOpen = true;
  }

  selectDepartment(name: string): void {
    this.selectedDepartmentName = name;
    this.signupFormGroup.get('departmentFormControl')?.setValue(name);
    this.departmentSearch = '';
    this.departmentDropdownOpen = false;
  }

  hasDeptExactMatch(term: string): boolean {
    const lc = (term || '').toLowerCase().trim();
    if (!lc) return false;
    return this.departments.some(d => d.name.toLowerCase() === lc);
  }

  openDeptDropdown(): void {
    this.departmentDropdownOpen = true;
  }

  confirmDepartment(): void {
    const name = (this.departmentSearch || this.selectedDepartmentName || '').trim();
    if (name) {
      this.selectDepartment(name);
    } else {
      this.departmentDropdownOpen = false;
    }
  }

  onEmployeeSearch(term: string): void {
    this.employeeSearch = term;
    const lc = term.toLowerCase();
    this.filteredEmployees = this.employees.filter(e => e.name.toLowerCase().includes(lc) || e.email.toLowerCase().includes(lc));
    this.employeesListOpen = true;
  }

  openEmployeesList(): void { this.employeesListOpen = true; }

  toggleEmployee(id: number): void {
    if (this.selectedEmployeeIds.includes(id)) {
      this.selectedEmployeeIds = this.selectedEmployeeIds.filter(x => x !== id);
    } else {
      this.selectedEmployeeIds = [...this.selectedEmployeeIds, id];
    }
  }

  // Helper method to mark all form fields as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get isManagerSelected(): boolean {
    return this.signupFormGroup.get('typeFormControl')?.value === 'manager';
  }

  get formMaxHeight(): number {
    const base = 0.9 * this.viewportHeight;
    let extra = 0;
    if (this.isManagerSelected) extra += 0.05 * this.viewportHeight;
    if (this.employeesListOpen) extra += 0.05 * this.viewportHeight;
    const hardMax = 0.96 * this.viewportHeight;
    return Math.min(base + extra, hardMax);
  }
}
