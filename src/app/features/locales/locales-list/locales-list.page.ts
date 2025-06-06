import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-locales-list',
  templateUrl: './locales-list.page.html',
  styleUrls: ['./locales-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonText
  ]
})
export class LocalesListPage implements OnInit {

  constructor() {
    addIcons({ addOutline });
  }

  ngOnInit() {}
}
