import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-local-form',
  templateUrl: './local-form.page.html',
  styleUrls: ['./local-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText
  ]
})
export class LocalFormPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
