import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb     = inject(FormBuilder);

  readonly loading       = signal(false);
  readonly errorMsg      = signal('');
  readonly resetSent     = signal(false);
  readonly showPassword  = signal(false);
  readonly showReset     = signal(false);

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly resetForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async login() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email!, password!);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMsg.set(this.friendlyError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  async sendReset() {
    if (this.resetForm.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      await this.auth.resetPassword(this.resetForm.getRawValue().email!);
      this.resetSent.set(true);
    } catch (e: any) {
      this.errorMsg.set(this.friendlyError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private friendlyError(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Fel e-post eller lösenord.';
      case 'auth/too-many-requests':  return 'För många försök. Försök igen senare.';
      case 'auth/network-request-failed': return 'Nätverksfel. Kontrollera din anslutning.';
      default: return 'Något gick fel. Försök igen.';
    }
  }
}
