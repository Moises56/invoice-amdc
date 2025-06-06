import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-factura-form',
  templateUrl: './factura-form.page.html',
  styleUrls: ['./factura-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText
  ]
})
export class FacturaFormPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
