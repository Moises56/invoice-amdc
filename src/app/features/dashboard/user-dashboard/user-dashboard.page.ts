
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
  styleUrls: ['./user-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})

export class UserDashboardPage implements OnInit {
  userName = '';

  constructor(private router: Router, private authService: AuthService) { }

  ngOnInit() {
    const name = this.authService.userName();
    this.userName = name && name.trim() ? name : '';
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
