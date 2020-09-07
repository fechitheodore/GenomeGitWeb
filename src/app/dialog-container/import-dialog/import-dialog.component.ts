import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../user.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.css']
})
export class ImportDialogComponent implements OnInit {


  projectsListWithoutDisplayed: Array<any>;
  importDialogVisible = false;
  selectedProjectForImport: any;
  projectPanel: any;
  filesSelectedForImport: any;
  importableFiles: Array<any>;

  constructor(private userService: UserService, private http: HttpClient) { }

  ngOnInit() {
  }


  open(origin) {

    this.projectPanel = origin;
    if (this.userService.projects.length > 0) {
      this.projectsListWithoutDisplayed = []; // initialize the array
      for (let i = 0; i < this.userService.projects.length; i++) { // populate it with all the user projects, except the one currently displayed
        if (this.userService.projects[i].title !== this.userService.selectedProject.title) {
          this.projectsListWithoutDisplayed.push(this.userService.projects[i]);
        }
      }
    }
    this.importDialogVisible = true;
  }

  projectToImportChanged() {

    const url = environment.host + 'getFilesNames?id=' + this.selectedProjectForImport.id + '&token=' + this.userService.getToken();
    this.http.get(url).subscribe((data: any) => {
      if (data) {
        this.importableFiles = [];
        for (let i = 0; i < data.length; i++) {
          this.importableFiles.push({ name: data[i].name, format: data[i].format, id: data[i]._id });
        }
      }
    });
  }

  importFiles() {
    const filesToImportIds = [];
    const filesToImport = [];
    let fileAlreadyExists;
    for (let i = 0; i < this.filesSelectedForImport.length; i++) {
      let existingList;
      fileAlreadyExists = false;
      switch (this.filesSelectedForImport[i].format) {
        case 'fasta':
          existingList = this.projectPanel.fastaFiles;
          break;
        case 'vcf':
          existingList = this.projectPanel.vcfFiles;
          break;
        case 'annotation':
          existingList = this.projectPanel.annotationFiles;
          break;
        case 'diffExp':
          existingList = this.projectPanel.DEFiles;
          break;
        case 'de':
          existingList = this.projectPanel.DEFiles;
          break;
        case 'results':
          existingList = this.projectPanel.expressionFiles;
          break;
        case 'bam':
          existingList = this.projectPanel.genomicCovFiles;
          break;
        case 'bai':
          existingList = this.projectPanel.genomicCovFiles;
          break;
        case 'bedcov':
          existingList = this.projectPanel.transcriptomicCovFiles;
          break;
      }
      for (let j = 0; j < existingList.length; j++) {
        if (existingList[i].name === this.filesSelectedForImport[i].name) {
          fileAlreadyExists = true;
          break;
        }
      }
      if (!fileAlreadyExists) {
        filesToImport.push(this.filesSelectedForImport[i]);
        filesToImportIds.push(this.filesSelectedForImport[i].id);
      }
    }

    const url = environment.host + 'importFiles';
    this.http.post(url, { project: this.userService.selectedProject.id, files: JSON.stringify(filesToImportIds), token: this.userService.getToken() }).subscribe((data: any) => {
      this.importDialogVisible = false;
      this.filesSelectedForImport = [];

      for (let i = 0; i < filesToImport.length; i++) {
        switch (filesToImport[i].format) {
          case 'fasta':
            this.projectPanel.fastaFiles.push(filesToImport[i]);
            break;
          case 'vcf':
            this.projectPanel.vcfFiles.push(filesToImport[i]);
            break;
          case 'annotation':
            this.projectPanel.annotationFiles.push(filesToImport[i]);
            break;
          case 'diffExp':
            this.projectPanel.DEFiles.push(filesToImport[i]);
            break;
          case 'de':
            this.projectPanel.DEFiles.push(filesToImport[i]);
            break;
          case 'results':
            this.projectPanel.expressionFiles.push(filesToImport[i]);
            break;
          case 'bam':
            this.projectPanel.genomicCovFiles.push(filesToImport[i]);
            break;
          case 'bai':
            this.projectPanel.genomicCovFiles.push(filesToImport[i]);
            break;
          case 'bedcov':
            this.projectPanel.transcriptomicCovFiles.push(filesToImport[i]);
            break;
        }
      }
    });

  }

}
