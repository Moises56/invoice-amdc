import { Component, EventEmitter, Input, Output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SearchICSParams, ICS_VALIDATION } from 'src/app/shared/interfaces/consulta-ics.interface';

export type SearchICSType = 'dni' | 'rtn' | 'ics';

@Component({
  selector: 'app-search-ics-input',
  templateUrl: './search-ics-input.component.html',
  styleUrls: ['./search-ics-input.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SearchIcsInputComponent implements OnDestroy {
  @Input() placeholder: string = 'Ingrese el valor...';
  @Input() disabled: boolean = false;
  @Input() clearOnSearch: boolean = false;
  @Input() debounceTime: number = 300; // Tiempo de debounce en ms
  @Output() search = new EventEmitter<SearchICSParams>();
  @Output() clear = new EventEmitter<void>();

  searchType = signal<SearchICSType>('dni');
  searchValue = signal<string>('');
  isValid = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  private debounceTimer: any = null;

  onSearchTypeChange(type: any) {
    const searchType = type as SearchICSType;
    this.searchType.set(searchType);
    this.searchValue.set('');
    this.isValid.set(true);
    this.errorMessage.set('');
    this.clear.emit();
  }

  onInputChange(value: string) {
    this.searchValue.set(value);
    this.validateInput(value);
    
    // Limpiar el timer anterior
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    if (value.trim() && this.isValid()) {
      // Aplicar debounce solo para búsquedas válidas
      this.debounceTimer = setTimeout(() => {
        this.performSearch();
      }, this.debounceTime);
    } else if (!value.trim()) {
      // Si el campo está vacío, limpiar resultados inmediatamente
      this.clear.emit();
    }
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  private validateInput(value: string): void {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      this.isValid.set(true);
      this.errorMessage.set('');
      return;
    }

    if (this.searchType() === 'dni') {
      // Validación para DNI hondureño (13 dígitos)
      if (!ICS_VALIDATION.DNI.PATTERN.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set(ICS_VALIDATION.DNI.MESSAGE);
        return;
      }
    } else if (this.searchType() === 'rtn') {
      // Validación para RTN hondureño (14 dígitos)
      if (!ICS_VALIDATION.RTN.PATTERN.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set(ICS_VALIDATION.RTN.MESSAGE);
        return;
      }
    } else if (this.searchType() === 'ics') {
      // Validación para código ICS (formato: ICS-XXXXXX)
      const normalizedValue = trimmedValue.toUpperCase();
      if (!ICS_VALIDATION.ICS.PATTERN.test(normalizedValue)) {
        this.isValid.set(false);
        this.errorMessage.set(ICS_VALIDATION.ICS.MESSAGE);
        return;
      }
    }

    this.isValid.set(true);
    this.errorMessage.set('');
  }

  private performSearch(): void {
    const value = this.searchValue().trim();
    
    if (!value || !this.isValid()) {
      return;
    }

    const searchParams: SearchICSParams = {};
    
    if (this.searchType() === 'dni') {
      searchParams.dni = value;
    } else if (this.searchType() === 'rtn') {
      searchParams.rtn = value;
    } else if (this.searchType() === 'ics') {
      searchParams.ics = value.toUpperCase();
    }

    this.search.emit(searchParams);
    
    if (this.clearOnSearch) {
      this.searchValue.set('');
    }
  }

  clearSearch(): void {
    // Limpiar el timer de debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.searchValue.set('');
    this.isValid.set(true);
    this.errorMessage.set('');
    this.clear.emit();
  }

  getPlaceholder(): string {
    switch (this.searchType()) {
      case 'dni':
        return 'Escriba aquí el DNI (13 dígitos)';
      case 'rtn':
        return 'Escriba aquí el RTN (14 dígitos)';
      case 'ics':
        return 'Escriba aquí el código ICS (ICS-XXXXXX)';
      default:
        return 'Ingrese el valor...';
    }
  }

  getSearchTypeLabel(): string {
    switch (this.searchType()) {
      case 'dni':
        return 'DNI';
      case 'rtn':
        return 'RTN';
      case 'ics':
        return 'Código ICS';
      default:
        return 'Búsqueda';
    }
  }

  getHelpText(): string {
    switch (this.searchType()) {
      case 'dni':
        return 'Ingrese el DNI hondureño (13 dígitos consecutivos, ej: 0801199012345)';
      case 'rtn':
        return 'Ingrese el RTN hondureño (14 dígitos consecutivos, ej: 08011990123456)';
      case 'ics':
        return 'Ingrese el código ICS completo (formato: ICS-XXXXXX, ej:  ICS-789012)';
      default:
        return '';
    }
  }

  getIcon(): string {
    switch (this.searchType()) {
      case 'dni':
        return 'card-outline';
      case 'rtn':
        return 'business-outline';
      case 'ics':
        return 'home-outline';
      default:
        return 'search-outline';
    }
  }
}