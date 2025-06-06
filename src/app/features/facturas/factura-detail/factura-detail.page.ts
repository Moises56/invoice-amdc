import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton,
  IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-factura-detail',
  templateUrl: './factura-detail.page.html',
  styleUrls: ['./factura-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonBackButton, IonText
  ]
})
export class FacturaDetailPage implements OnInit {

  constructor() { }

  ngOnInit() {}
}
