import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiClientService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(path: string, params: HttpParams = new HttpParams()): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}${path}`, { params, withCredentials: true });
  }

  post<T>(path: string, body: object = {}): Observable<T> {
    return this.http.post<T>(
      `${this.apiUrl}${path}`,
      JSON.stringify(body),
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  put<T>(path: string, body: object = {}): Observable<T> {
    return this.http.put<T>(
      `${this.apiUrl}${path}`,
      JSON.stringify(body),
      { headers: this.getHeaders(), withCredentials: true }
    );
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${path}`, { headers: this.getHeaders(), withCredentials: true });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
}
