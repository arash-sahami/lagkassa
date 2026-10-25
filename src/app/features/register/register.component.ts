import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvitationService, InvitationStatus } from '../../core/services/invitation.service';
import { TreasuryService } from '../../core/services/treasury.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: '../login/login.component.scss',
})
export class RegisterComponent implements OnInit {
  private readonly invitations = inject(InvitationService);
  private readonly treasury    = inject(TreasuryService);
  private readonly router      = inject(Router);
  private readonly route       = inject(ActivatedRoute);
  private readonly fb          = inject(FormBuilder);

  readonly status       = signal<InvitationStatus | 'checking'>('checking');
  readonly loading      = signal(false);
  readonly errorMsg     = signal('');
  readonly showPassword = signal(false);

  private token = '';

  readonly form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm:  ['', Validators.required],
  }, { validators: passwordsMatch });

  async ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.status.set('missing');
      return;
    }
    try {
      this.status.set(await this.invitations.status(this.token));
    } catch {
      this.status.set('missing');
    }
  }

  async register() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    try {
      const { email, password } = this.form.getRawValue();
      await this.invitations.register(this.token, email!, password!);
      await this.treasury.reload();
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.errorMsg.set(this.friendlyError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private friendlyError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':   return 'E-postadressen har redan ett konto. Logga in istället.';
      case 'auth/invalid-email':          return 'Ogiltig e-postadress.';
      case 'auth/weak-password':          return 'Lösenordet är för svagt.';
      case 'auth/network-request-failed': return 'Nätverksfel. Kontrollera din anslutning.';
      case 'permission-denied':           return 'Inbjudan är ogiltig, redan använd eller har gått ut.';
      default: return 'Något gick fel. Försök igen.';
    }
  }
}
