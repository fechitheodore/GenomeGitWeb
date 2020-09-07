import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from './../dialog.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-dialog-container',
  templateUrl: './dialog-container.component.html',
  styleUrls: ['./dialog-container.component.css']
})
export class DialogContainerComponent implements OnInit {

  projectPanel: any;

  displayFastainfo = false;
  displayVCFinfo = false;
  displayGFFinfo = false;
  displayBedinfo = false;
  displayDiffinfo = false;
  displayBaminfo = false;
  displayExpressioninfo = false;
  displayLinkInfo = false;
  displayShareProject = false;
  displayImportFile = false;
  displayFileInfo = false;
  addProjectDialogVisible = false;
  showFastaParam = false;
  displayAddColumnTypesLink = false;
  newProjectTitle: string;
  newProjectDescription: string;
  public = true;

  additionalLinkColumns = null;
  linkWorder = null;

  linkTypes = [
            {label: 'Numeric', value: 'numeric'},
            {label: 'Level', value: 'level'},
            {label: 'Text', value: 'text'},
        ];


  @ViewChild('cd') cd;
  @ViewChild('linkTable') linkTable;
  @ViewChild('sharedialog') sharedialog;
  @ViewChild('importdialog') importdialog;

  constructor(private dialogService: DialogService, private confirmationService: ConfirmationService, private userService: UserService) { }

  ngOnInit() {

    this.dialogService.fastaDialog.subscribe(() => {
      this.displayFastainfo = true;
    });
    this.dialogService.vcfInfoDialog.subscribe(() => {
      this.displayVCFinfo = true;
    });
    this.dialogService.gffInfoDialog.subscribe(() => {
      this.displayGFFinfo = true;
    });
    this.dialogService.fileInfoDialog.subscribe(() => {
      this.displayFileInfo = true;
    })
    this.dialogService.bedInfoDialog.subscribe(() => {
      this.displayBedinfo = true;
    });
    this.dialogService.diffInfoDialog.subscribe(() => {
      this.displayDiffinfo = true;
    });
    this.dialogService.bamInfoDialog.subscribe(() => {
      this.displayBaminfo = true;
    });
    this.dialogService.expressionInfoDialog.subscribe(() => {
      this.displayExpressioninfo = true;
    });
    this.dialogService.linkInfoDialog.subscribe(() => {
      this.displayLinkInfo = true;
    });
    this.dialogService.addProjectDialog.subscribe((origin) => {
      this.addProjectDialogVisible = true;
      this.projectPanel = origin;
    });
    this.dialogService.importFileDialog.subscribe((origin) => {
      this.importdialog.open(origin);
    });
    this.dialogService.shareProjectDialog.subscribe((project) => {
      this.sharedialog.open(this.userService.selectedProject.id);
    });
    this.dialogService.paramFastaDialog.subscribe((origin) => {
      this.projectPanel = origin;
      this.confirmFasta();
      this.showFastaParam = true;
    });
    this.dialogService.linkTableDialog.subscribe((input) => {
      this.projectPanel = input.projectPanel;
      this.linkTable.open(input.file);
    });
    this.dialogService.columnTypeLinkDialog.subscribe((input) => {
      this.additionalLinkColumns  = input.columns.map(x => { return {name: x, value: x, selectedType: 'numeric'}; });
      this.projectPanel = input.projectPanel;
      this.linkWorder = input.worker;
      this.displayAddColumnTypesLink = true;
    });
  }

  confirmFasta() {
    this.confirmationService.confirm({
      message: '<br>In order to parse your FASTA reference genome, the programs needs the\
          <br>"chromosome signature" of the description lines (starting with ">").\
          <br>This corresponds to what preceeds and follows the chromosome number (0\
          <br>included) or letter.\
          <br>For example:\
          <br>"Chr00-2012-12-18-BGI#" => beginning :Chr; end :-\
          <br>or "1 CHROMOSOME Feb/3/09 16:9" => beginning : ; end : CHROMOSOME\
          <br>(don\'t forget the space before CHROMOSOME)',
      reject: (event) => {
      }
    });
  }


  //moved this outside the confirmFasta() because the reference in html was to cd.accept which wasn't working
  accept(){
    this.projectPanel.chromosomeSignature.use = true;
    this.cd.hide();
    this.projectPanel.fileupload.el.nativeElement.children[0].children[2].click();
  }

  defaultFasta() {
    this.projectPanel.chromosomeSignature.use = false;
    this.cd.hide();
    this.projectPanel.fileupload.el.nativeElement.children[0].children[2].click();
  }

  confirmLinksType() {
    this.projectPanel.confirmLinksType(this.linkWorder, this.additionalLinkColumns);
  }

}
