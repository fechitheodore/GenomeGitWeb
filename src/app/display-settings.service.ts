import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DisplaySettingsService {

  mode: string;
  groupsChecked: Array<any>;

  constructor() { }
}
