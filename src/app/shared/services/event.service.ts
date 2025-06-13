import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface EventData {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private eventSubject = new Subject<EventData>();
  public events$: Observable<EventData> = this.eventSubject.asObservable();

  /**
   * Emitir un evento para que sea escuchado por otros componentes
   */
  emit(type: string, payload?: any): void {
    this.eventSubject.next({ type, payload });
  }

  /**
   * Destruir el Subject al finalizar
   */
  destroy(): void {
    this.eventSubject.complete();
  }
}
