import { Component, EventEmitter, Input, Output, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { SearchParams } from 'src/app/features/estado-cuenta/estado-cuenta.service';
import { SearchICSParams } from 'src/app/shared/interfaces/consulta-ics.interface';

export type SearchType = 'claveCatastral' | 'dni' | 'rtn' | 'ics';
export type SearchParamsUnion = SearchParams | SearchICSParams;

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class SearchInputComponent implements OnDestroy {
  @Input() placeholder: string = 'Ingrese el valor...';
  @Input() disabled: boolean = false;
  @Input() clearOnSearch: boolean = false;
  @Input() debounceTime: number = 300; // Tiempo de debounce en ms - Igual que search-ics-input
  @Output() search = new EventEmitter<SearchParamsUnion>();
  @Output() clear = new EventEmitter<void>();

  searchType = signal<SearchType>('claveCatastral');
  searchValue = signal<string>('');
  isValid = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  private debounceTimer: any = null;

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

    if (this.searchType() === 'claveCatastral') {
      // Validación exacta para clave catastral (formato: XX-XXXX-XXX, exactamente 10 caracteres)
      const claveCatastralPattern = /^[0-9]{2}-[0-9]{4}-[0-9]{3}$/;
      if (!claveCatastralPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('La clave catastral debe tener el formato XX-XXXX-XXX (ej: xx-xxxx-xxx)');
        return;
      }
    } else if (this.searchType() === 'dni') {
      // Validación exacta para DNI hondureño (exactamente 13 dígitos)
      const dniPattern = /^[0-9]{13}$/;
      if (!dniPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('El DNI debe contener exactamente 13 dígitos');
        return;
      }
    } else if (this.searchType() === 'rtn') {
      // Validación exacta para RTN hondureño (exactamente 14 dígitos)
      const rtnPattern = /^[0-9]{14}$/;
      if (!rtnPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('El RTN debe contener exactamente 14 dígitos');
        return;
      }
    } else if (this.searchType() === 'ics') {
      // Validación para código ICS (formato: ICS-XXXXXX)
      const icsPattern = /^ICS-[0-9]{6}$/i;
      if (!icsPattern.test(trimmedValue)) {
        this.isValid.set(false);
        this.errorMessage.set('El código ICS debe tener el formato ICS-XXXXXX (ej: ICS-XXXXXX)');
        return;
      }
    }

    this.isValid.set(true);
    this.errorMessage.set('');
  }

  private performSearch(): void {
    const value = this.searchValue().trim();
    if (!value || !this.isValid()) return;

    let searchParams: SearchParamsUnion = {};
    
    if (this.searchType() === 'claveCatastral') {
      searchParams = { claveCatastral: value } as SearchParams;
    } else if (this.searchType() === 'dni') {
      // Para estado de cuenta tradicional
      if ('claveCatastral' in searchParams || Object.keys(searchParams).length === 0) {
        searchParams = { dni: value } as SearchParams;
      } else {
        // Para consulta ICS
        searchParams = { dni: value } as SearchICSParams;
      }
    } else if (this.searchType() === 'rtn') {
      searchParams = { rtn: value } as SearchICSParams;
    } else if (this.searchType() === 'ics') {
      searchParams = { ics: value.toUpperCase() } as SearchICSParams;
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
      case 'claveCatastral':
        return 'Ej: xx-xxxx-xxx';
      case 'dni':
        return 'Ej: 1234567890123';
      case 'rtn':
        return 'Ej: 12345678901234';
      case 'ics':
        return 'Ej: ICS-XXXXXX';
      default:
        return 'Ingrese el valor...';
    }
  }

  getSearchTypeLabel(): string {
    switch (this.searchType()) {
      case 'claveCatastral':
        return 'Clave Catastral';
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
}