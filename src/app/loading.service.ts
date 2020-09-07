import { Injectable } from '@angular/core';

@Injectable()
export class LoadingService {

  constructor() { }
  isCharging: boolean = false;
  start:number=0;
  toggleIsCharging() {
    this.isCharging = !this.isCharging;
  }

}
