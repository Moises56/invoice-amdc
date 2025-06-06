import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-local-detail',
  templateUrl: './local-detail.page.html',
  styleUrls: ['./local-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText
  ]
})
export class LocalDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
