import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertsService } from '../../core/services/alerts.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  public alertsService = inject(AlertsService); // Changed to public

  unreadCount$!: Observable<number>;

  ngOnInit(): void {
    this.unreadCount$ = this.alertsService.unreadCount$;
    this.alertsService.refreshAlerts();
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}

