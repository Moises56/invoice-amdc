import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly apiUrlE = environment.apiUrlE;

  constructor(private http: HttpClient) { }

  get<T>(path: string, params: HttpParams = new HttpParams(), requiresAuth: boolean = false): Observable<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : this.getHeaders();
    
    return this.http.get<T>(`${this.apiUrlE}${path}`, { 
      params, 
      headers, 
      withCredentials: true 
    })
      .pipe(
        timeout(35000), // 35 segundos timeout
        catchError(error => {
          console.error('Error en API Client:', error);
          return throwError(() => error);
        })
      );
  }

  post<T>(path: string, body: object = {}, requiresAuth: boolean = false): Observable<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : this.getHeaders();
    
    return this.http.post<T>(
      `${this.apiUrlE}${path}`,
      JSON.stringify(body),
      { headers, withCredentials: true }
    );
  }

  put<T>(path: string, body: object = {}, requiresAuth: boolean = false): Observable<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : this.getHeaders();
    
    return this.http.put<T>(
      `${this.apiUrlE}${path}`,
      JSON.stringify(body),
      { headers, withCredentials: true }
    );
  }

  delete<T>(path: string, requiresAuth: boolean = false): Observable<T> {
    const headers = requiresAuth ? this.getAuthHeaders() : this.getHeaders();
    
    return this.http.delete<T>(`${this.apiUrlE}${path}`, { 
      headers, 
      withCredentials: true 
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeaders(): HttpHeaders {
    // Para autenticación basada en cookies HTTP-only,
    // no necesitamos agregar Authorization header manualmente
    // Las cookies se envían automáticamente con withCredentials: true
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
}
