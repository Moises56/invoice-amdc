import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonButton, IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

@Component({
  selector: 'app-facturas-list',
  templateUrl: './facturas-list.page.html',
  styleUrls: ['./facturas-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonButton, IonIcon, IonText
  ]
})
export class FacturasListPage implements OnInit {

  constructor() {
    addIcons({ addOutline });
  }

  ngOnInit() {}
}
