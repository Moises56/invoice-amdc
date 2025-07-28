import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SearchParams } from 'src/app/features/estado-cuenta/estado-cuenta.service';

export type SearchType = 'claveCatastral' | 'dni';

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SearchInputComponent {
  @Input() placeholder: string = 'Ingrese el valor...';
  @Input() disabled: boolean = false;
  @Input() clearOnSearch: boolean = false;
  @Output() search = new EventEmitter<SearchParams>();
  @Output() clear = new EventEmitter<void>();

  searchType = signal<SearchType>('claveCatastral');
  searchValue = signal<string>('');
  isValid = signal<boolean>(true);
  errorMessage = signal<string>('');

  onSearchTypeChange(type: any) {
    const searchType = type as SearchType;
    this.searchType.set(searchType);
    this.searchValue.set('');
    this.isValid.set(true);
    this.errorMessage.set('');
    this.clear.emit();
  }

  onInputChange(value: string) {
    this.searchValue.set(value);
    this.validateInput(value);
    
    if (value.trim() && this.isValid()) {
      this.performSearch();
    } else if (!value.trim()) {
      this.clear.emit();
    }
  }

  private validateInput(value: string): void {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      this.isValid.set(true);
      this.errorMessage.set('');
      return;
    }

    if (this.searchType() === 'claveCatastral') {
      // Validación para clave catastral (formato: números y guiones)
      const claveCatastralPattern = /^[0-9-]+$/;
      if (!claveCatastralPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('La clave catastral solo debe contener números y guiones');
        return;
      }
      
      if (trimmedValue.length < 5) {
        this.isValid.set(false);
        this.errorMessage.set('La clave catastral debe tener al menos 5 caracteres');
        return;
      }
    } else if (this.searchType() === 'dni') {
      // Validación para DNI hondureño (13 dígitos)
      const dniPattern = /^[0-9]{13}$/;
      if (!dniPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('El DNI debe contener exactamente 13 dígitos');
        return;
      }
    }

    this.isValid.set(true);
    this.errorMessage.set('');
  }

  private performSearch(): void {
    const value = this.searchValue().trim();
    if (!value || !this.isValid()) return;

    const searchParams: SearchParams = {};
    
    if (this.searchType() === 'claveCatastral') {
      searchParams.claveCatastral = value;
    } else {
      searchParams.dni = value;
    }

    this.search.emit(searchParams);
    
    if (this.clearOnSearch) {
      this.searchValue.set('');
    }
  }

  clearSearch(): void {
    this.searchValue.set('');
    this.isValid.set(true);
    this.errorMessage.set('');
    this.clear.emit();
  }

  getPlaceholder(): string {
    if (this.searchType() === 'claveCatastral') {
      return 'Ej: 12345-67890';
    } else {
      return 'Ej: 1234567890123';
    }
  }

  getSearchTypeLabel(): string {
    return this.searchType() === 'claveCatastral' ? 'Clave Catastral' : 'DNI';
  }
}