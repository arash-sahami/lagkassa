import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'sek', standalone: true })
export class SekPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '0 kr';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
