import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.page.html',
  styleUrls: ['./user-dashboard.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class UserDashboardPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
