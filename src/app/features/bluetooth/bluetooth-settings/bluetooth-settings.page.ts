import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-bluetooth-settings',
  templateUrl: './bluetooth-settings.page.html',
  styleUrls: ['./bluetooth-settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText
  ]
})
export class BluetoothSettingsPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
