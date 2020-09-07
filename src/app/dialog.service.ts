import { Injectable } from '@angular/core';
import "rxjs/Rx";
import { Subject } from "rxjs/Subject";

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  fastaDialog: Subject<any>;
  vcfInfoDialog: Subject<any>;
  gffInfoDialog: Subject<any>;
  bedInfoDialog: Subject<any>;
  diffInfoDialog: Subject<any>;
  bamInfoDialog: Subject<any>;
  expressionInfoDialog: Subject<any>;
  linkInfoDialog: Subject<any>;
  paramFastaDialog: Subject<any>;
  linkTableDialog: Subject<any>;
  columnTypeLinkDialog: Subject<any>;
  addProjectDialog: Subject<any>;
  shareProjectDialog: Subject<any>;
  importFileDialog: Subject<any>;
  fileInfoDialog: Subject<any>;

  constructor() {
    this.fastaDialog = new Subject<any>();
    this.vcfInfoDialog = new Subject<any>();
    this.gffInfoDialog = new Subject<any>();
    this.bedInfoDialog = new Subject<any>();
    this.diffInfoDialog = new Subject<any>();
    this.bamInfoDialog = new Subject<any>();
    this.expressionInfoDialog = new Subject<any>();
    this.linkInfoDialog = new Subject<any>();
    this.shareProjectDialog = new Subject<any>();
    this.importFileDialog = new Subject<any>();
    this.addProjectDialog = new Subject<any>();
    this.paramFastaDialog = new Subject<any>();
    this.linkTableDialog = new Subject<any>();
    this.columnTypeLinkDialog = new Subject<any>();
    this.fileInfoDialog = new Subject<any>();
  }
}
