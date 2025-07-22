import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-estado-cuenta',
  templateUrl: './estado-cuenta.page.html',
  styleUrls: ['./estado-cuenta.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class EstadoCuentaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
