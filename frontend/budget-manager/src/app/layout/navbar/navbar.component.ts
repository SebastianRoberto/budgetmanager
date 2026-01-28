import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  sidebarOpen = signal(false);

  public authService = inject(AuthService);
  private themeService = inject(ThemeService);

  theme$!: Observable<Theme>;
  isDarkMode = false;

  ngOnInit(): void {
    this.theme$ = this.themeService.theme$;
    this.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
    document.querySelector('.sidebar')?.classList.toggle('open');
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }
}

