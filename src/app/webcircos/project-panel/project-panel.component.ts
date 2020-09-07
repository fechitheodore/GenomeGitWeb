import { Component, OnInit, Output, EventEmitter, ViewChild, Input, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { MenuItem } from "primeng/api";
import { ToastrService } from "ngx-toastr";
import { DisplaySettingsService } from "../../display-settings.service";
import { UserService } from "../../user.service";
import { ParserService } from "../../parser.service";
import { LoadingService } from "../../loading.service";
import { DialogService } from "../../dialog.service";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Assembly } from "../../assembly-list/assembly-list.model";
import { WebcircosComponent } from "../webcircos.component";
import { CommonService } from "../../common.service";
import { CircosControlsComponent } from "../circos-controls/circos-controls.component";

import { CdkTreeNestedExample } from "../file-management/cdk-tree-nested-example";
import { ActivatedRoute } from "@angular/router";
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BehaviorSubject, of as observableOf } from 'rxjs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { GrowlModule } from 'primeng/growl';
import { SelectItem } from 'primeng/components/common/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { _countGroupLabelsBeforeOption } from "@angular/material/core";
import { CommitInfo } from "../../../../public/repositoryParser/parser_types"
import {FastaLink, LinksDataPoint} from "../../../../public/repositoryParser/parser_types"
import * as html2canvas from 'html2canvas';
// import * as svg from 'save-svg-as-png';
import * as svgg from '../../../../node_modules/save-svg-as-png/lib/saveSvgAsPng.js'
import { nodeChildrenAsMap } from "@angular/router/src/utils/tree";
import { CompileShallowModuleMetadata } from "@angular/compiler";
// import { WelcomeComponent } from "../../welcome/welcome.component";

interface Project {
  title: string;
  id?: string;
  _id?: string;
  description?: string;
  files?: string[];
  users?: string[];
  public?: boolean;
  issues?: [any];
}

interface File {
  name: string;
  format: string;
  id: string;
}

export class DisplayData {
  groups: FileNode[];
  links: FastaLink[];
  get hasLinks(): boolean { return this.links.length > 0 ? true : false }
}


export class FileNode {
  nodeIndex: number =-1;
  children: FileNode[];
  fastaID: string;
  fileName: string;
  fileID: string;
  commitInfo: CommitInfo
  isManual: boolean = false;
  projectID: string;
  format: string;
  isSelected: boolean;
  data: any[];
  get shortFileName(): string {
    if (this.fileName.length > 20) {
      return this.fileName.substring(0, 7) + "..." + "" + this.fileName.substring(this.fileName.length - 7, this.fileName.length);
    } else {
      return this.fileName;
    }
  }
  getLinkData(linkFileID: string): FastaLink {
    if (linkFileID !== undefined) {
      for (let i = 0; i < this.links.length; i++) {
        if (this.links[i].fileID === linkFileID) {
          return this.links[i];
        }
      }
    } else if (this.isLink && this.links && this.links.length > 0) {
      //this works because links FileNode has only one link object in array
      return this.links[0];
    } else {
      return new FastaLink;
    }
  }

  dataUnscaled: any[];
  links: FastaLink[];
  displayLinkArc: boolean = false;
  //this is inelegant, but simplest way to present all data in single tree
  OldFasta: string;
  NewFasta: string;
  color: string = 'green'; //this is the color of biocircos chromosome band and also file name colour
  get isFasta(): boolean { return (this.format === "fasta" ? true : false); }
  get isLink(): boolean { return (this.format === "rearrangment" ? true : false); }
  showArcAndLinks: boolean = false;
  get id(): string { return this.fileID; } //required for backward compatability with the original app
  get name(): string { return this.fileName; } //required for backward compatability with the original app
  get selectedIDs(): string[] {
    var result: string[] = [];
    if (this.isSelected) { result.push(this.fileID); }
    for (let child of this.children) {
      if (child.isSelected) {
        result.push(child.fileID);
      }
    }
    return result;
  }

  get selectedItems(): FileNode[] {
    var result: FileNode[] = [];
    for (let child of this.children) {
      if (child.isSelected) {
        result.push(child);
      }
    }
    return result;
  }
}

@Injectable()
export class FileDatabase {
  dataChange = new BehaviorSubject<FileNode[]>([]);
  nodes = Array() as FileNode[];

  get data(): FileNode[] { return this.dataChange.value; }
  

  get allNodes(): FileNode[] {
    let result: Array<FileNode>=[];
    for (let fasta of this.nodes){
      result.push(fasta);
      for (let i=0; i<fasta.children.length; i++){
        result.push(fasta.children[i]);
      }
    }
    return result;
  }

  constructor() {
    this.initialize();
  }

  initialize() {
    const data = this.buildFileTree(null, null);

    // Notify the change.
    // this.dataChange.next(data);
  }

  buildFileTree(obj: object, commits: Map<string,CommitInfo>) {
    this.nodes = [];
     //dict for filename, id
     var parentdict = {};
    if (obj !== null) {
      //data has the following format:
      //for fasta files: data{chromosomes as Array}, format{file format as string}, name{filename as string},project{project ids as Array}, _id{fileID}
      //for other files: fasta{fastaID as string}, format{file format as string}, name{filename as string},project{project ids as Array}, _id{fileID}
      if (Array.isArray(obj)) {
        //create links files
       
        //create fasta Nodes first
        for (let i = 0; i < obj.length; i++) {
          if (obj[i].format === "fasta") {
            let parentNode = new FileNode;
            parentNode.nodeIndex=i;
            parentNode.projectID = (obj[i].projects.length > 0) ? obj[i].projects[0] : "";
            parentNode.commitInfo= (commits.has(obj[i].hash)) ? commits.get(obj[i].hash) : new CommitInfo;
            parentNode.format = "fasta";
            parentNode.fileID = obj[i]._id;
            parentNode.fileName = obj[i].name;
            parentNode.children = Array() as FileNode[];
            parentNode.links = Array() as FastaLink[];
            //create dict to name children nodes
            parentdict[obj[i]._id] = obj[i].name
            //create child nodes
            for (let j = 0; j < obj.length; j++) {
              //create file nodes that are not link files - main reason for difference is links have different data structure
              let child = new FileNode;
              if (obj[j].format !== "fasta" && obj[j].format !== "InDelSNP" && obj[j].format !== "rearrangment" && obj[j].fasta === parentNode.fileID) {
                child.projectID = parentNode.projectID;
                child.format = obj[j].format;
                //merging Filtered.snp and Filtered.delta was a wrong decision
                child.fileID = obj[j]._id;
                child.fastaID = parentNode.fileID;
                child.fileName = obj[j].name;
                child.children = Array() as FileNode[];
        				if (obj[j].isManual) {child.isManual = obj[j].isManual}
                parentNode.children.push(child);
              }
              if (obj[j].format === "InDelSNP" && (obj[j].OldFasta === parentNode.fileID || obj[j].NewFasta === parentNode.fileID)) {
                //each link is split into two nodes. One will show (as biocircos heatmap) InDels and SNPs
                //the othe will show movement of fragments.
                child.projectID = parentNode.projectID;
                child.format = obj[j].format;
                child.fileID = obj[j].fileID;
                //child.fileName = (obj[j].OldFasta === parentNode.fileID) ? "InDels & SNPs vs newer genome" : "InDels & SNPs vs older genome";
                child.fastaID = parentNode.fileID;
                //a bit too nested for my taste
                this._createFastaInDelLink(obj[j], child, ((obj[j].OldFasta === parentNode.fileID) ? true : false));
                child.dataUnscaled=child.data;
                parentNode.children.push(child);
              }  else if (obj[j].format === "rearrangment" && (obj[j].OldFasta === parentNode.fileID || obj[j].NewFasta === parentNode.fileID)){
                //create the node to show movements
                child = new FileNode;
                child.projectID = parentNode.projectID;
                child.format = obj[j].format
                child.fileID = obj[j].fileID;
                //child.fileName = (obj[j].OldFasta === parentNode.fileID) ? "Rearrangment vs newer genome" : "Rearrangment vs older genome";
                child.OldFasta = obj[j].OldFasta;
                child.NewFasta = obj[j].NewFasta;
                child.fastaID = parentNode.fileID;
                child.links = [];
                //a bit too nested for my taste
                let link = this._creatRearrangmentLink(obj[j], child);
                child.links.push(link);
                parentNode.links.push(link);
                parentNode.children.push(child);
              }
            }
            this.nodes.push(parentNode);
          }
        }
      } 
      for (let file of this.allNodes){
        if (file.format === 'rearrangment'){
          //could change to commit name rather than fasta name
          file.fileName = (file.OldFasta === file.fastaID) ? "Link: " + parentdict[file.NewFasta] : "Link: " + parentdict[file.OldFasta]
        }
        if (file.format === "InDelSNP"){
          file.fileName = (file.OldFasta === file.fastaID) ? "InDelSNP: " + parentdict[file.NewFasta] : "InDelSNP: " + parentdict[file.OldFasta]
        }
      }
    }
    this.dataChange.next(this.nodes);

  }


  _creatRearrangmentLink(linkData: any, child: FileNode) {
    let newLinkFile = new FastaLink;
    newLinkFile.NewFasta = linkData.NewFasta;
    newLinkFile.OldFasta = linkData.OldFasta;
    newLinkFile.data = [];
    for (let value of linkData.data) {
      if (value.isDelta){
        value.color="#0000ff"
        newLinkFile.data.push(value);
      }
    }
    return newLinkFile;
  }

  _createFastaInDelLink(linkData: any, child: FileNode, g1: boolean) {
    child.data = [];
    for (let value of linkData.data) {
      if (!value.isDelta){
        if (g1){
          child.data.push({chr: value.g1chr, start: value.g1start, end: value.g1start+30000, 
              color: this.getColour(value.g1value, value.g2value), des: value.g2value+">"+value.g1value});
        } else {
          child.data.push({chr: value.g2chr, start: value.g2start, end: value.g2start+30000, 
              color: this.getColour(value.g2value, value.g1value), des: value.g1value+">"+value.g2value});
        }
      }
    }
  }



  getColour(val1: string, val2: string): string{
    if (val1!="." && val2!=".") {
      return "#0000ff"
    } else if (val1!=".") {
      return "#ff0000"
    } else {
      return "#00ff00"
    }
  }

  getSelectedNodes(): FileNode[] {
    var files: Array<FileNode> = [];
    for (let file of this.data) {
      if (file.isSelected && file.isFasta) {
        files = files.concat(file);
        files = files.concat(file.selectedItems);
      }
    }
    return files;
  }
}

@Component({
  selector: 'project-panel',
  templateUrl: './project-panel.component.html',
  styleUrls: ['./project-panel.component.css'],
  providers: [FileDatabase, WebcircosComponent, CommonService]
})
export class ProjectPanelComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  linkFiles: Array<FastaLink> = [];
  showLinksAndArc: boolean = false;
  displayData: DisplayData = new DisplayData;

  selectedFiles: Array<any> = [];
  fastaFiles: File[] = [];
  selectedFasta: File;
  selectedFastaIndex: number = null;

  vcfFiles: File[] = [];
  preLoadedFiles: Map<any, any>;
  fileForNextLoading = {}; // Name of the file preuploaded and list of the files
  genomicCovFiles: File[] = [];
  database: FileDatabase;
  transcriptomicCovFiles: File[] = [];
  annotationFiles: File[] = [];
  DEFiles: File[] = [];
  expressionFiles: File[] = [];
  groupItems: MenuItem[] = [];
  uploadFastaID: string;

  // ----Import dialog-----------

  importDialogVisible = false;
  projectsListWithoutDisplayed: Project[];
  selectedProjectForImport: Project;
  importableFiles: File[] = [];
  filesSelectedForImport: File[];
  listEmails = [];
  currentEmail: string;

  // -----------Booleans --------
  isCharging = true;
  parsingBool = false;
  defaultFasta = true;

  uploads: any[] = [];
  populatePickList: any[] = [];
  chromosomes = [];
  chromosomeSignature: any;

  // -----------groups-------------
  newGroupName = "";
  groups: Array<string> = [];
  // groups1: Array<any> = [];
  id: string;
  selectedFileLinksIndex: number;
  userName: string;
  projectName: string;
  isChecked: boolean = false;
  private sub: any;
  publicAccess: boolean = false;
  routerLong: boolean = false;

  projects: Array<Project>;

  @ViewChild("cdkTreeNestedExample") CdkTreeNestedExample;
  @ViewChild("fileupload") fileupload;
  @ViewChild("fileLinkUpload") fileLinkUpload;
  @ViewChild("sharedialog") sharedialog;
  @ViewChild("uploadPanel") uploadPanel;

  @Output()
  ClearMessage = new EventEmitter<any>();
  @Output()
  CreateMessage = new EventEmitter<any>();
  @Output()
  onEmittingPopulatedPickList = new EventEmitter<Object>();
  @Output()
  onAddGroup = new EventEmitter<string>();
  @Output()
  onDeleteGroup = new EventEmitter<string>()
  @Output()
  onEditGroup = new EventEmitter<string>();

  @Output()
  onUpdateGroup1 = new EventEmitter<Array<any>>();

  @Output()
  hasLinks = new EventEmitter<boolean>();

  @Output()
  onClear = new EventEmitter<any>();

  @Output()
  onProjectSelected = new EventEmitter<any>();

  @Output()
  displayFileLinks = new EventEmitter<any>();

  @Output()
  onHideLinks = new EventEmitter<any>();

  constructor(public userService: UserService,
    private http: HttpClient,
    private parserService: ParserService,
    private toastr: ToastrService,
    private loadingService: LoadingService,
    private dialogService: DialogService,
    private displaySettingsService: DisplaySettingsService,
    private commonService: CommonService,
    private route: ActivatedRoute, database: FileDatabase) {

    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    this.database = database;
    const _this = this;
    database.dataChange.subscribe(data => _this.nestedDataSource.data = data);

    //use one object that stores references to all visualisation data
    this.displayData.links = this.linkFiles;
    this.displayData.groups = this.database.data;
  }

  hasNestedChild(_: number, nodeData: FileNode) {
    if (nodeData.children && nodeData.children.length > 0) {
      return true;
    } else {
      return false;
    }
  }

  private _getChildren = (node: FileNode) => observableOf(node.children);

  ngOnInit() {
    this.userService.selectedProject = null;
    if (this.route.params.subscribe(params => params["id"])){


      this.route.params.subscribe(params => {this.id = params["id"]});
      this.commonService.getProject(this.id).subscribe(res => {
        
        this.userService.selectedProject = res.json().data;
        this.userService.selectedProject.title = res.json().data.title;
        this.userService.selectedProject.id = res.json().data._id;
        this.routerLong = true;
        this.getFilesNames();
      });
      
    } else {
      this.userService.selectedProject = null;
    }

    if (this.userService.getIsSignedIn()) {
      this.getProjects();
    } else {
      this.sub = this.route.params.subscribe(params => {
        this.id = params["id"];
      });
      //If user is not signed in
      //Get only genome files from common service GetGenome function
      this.getGenome(this.id);

    }
    this.preLoadedFiles = new Map();
    this.fileForNextLoading = { file: '', list: this.preLoadedFiles };
    this.chromosomeSignature = { begins: '', ends: ' CHROMOSOM' };
  }

  assembly: any;
  getGenome(id: string) {
    this.commonService.getGenome(this.id).subscribe(res => {
      this.assembly = res.json();
      this.getProjects();
    });
  }

  toggleSelectedFiles(node: FileNode) {
    //add a clause that deselects second file of the same type when more than one fasta is selected
    //i.e. only one type is selected per group when more than 1 group selected

    //switch selection value
    node.isSelected = !node.isSelected;

    if (node.format === "fasta" && !node.isSelected) {
      //deselect all child items
      let childFastas = [];
      for (let value of node.children) {
        if (value.format=== "rearrangment" && value.isSelected){
          childFastas=[value.OldFasta, value.NewFasta];
        }
        value.isSelected = false;
      }
      for (let file of this.database.allNodes){ 
        if (file.format=== "rearrangment" && childFastas.length===2 && file.NewFasta===childFastas[1] && file.OldFasta===childFastas[0]){
          file.isSelected=false;
        }
      }
    } else if (node.format=== "rearrangment") {
      for (let file of this.database.allNodes){
        if (file.format==="fasta" && (file.fileID===node.NewFasta || file.fileID===node.OldFasta)){
          if (!file.isSelected) { file.isSelected = true; }
        } else if (file.format=== "rearrangment" && file.NewFasta===node.NewFasta && file.OldFasta===node.OldFasta){
          file.isSelected=node.isSelected;
        }
      }
    } else if (node.format !== "fasta" && node.isSelected) {
      //check relevant fasta is selected
      //console.log("test")
      for (let fasta of this.database.data) {
        if (fasta.format === "fasta" && fasta.fileID === node.fastaID) {
          if (!fasta.isSelected) { fasta.isSelected = true; }
          break;
        }
      }
    }

    //provide the list of FileNodes which are selected including any child nodes
    var files: Array<FileNode> = this.database.getSelectedNodes();
    this.loadingService.isCharging = true;
     let linksBoolean: boolean = false;
    for (let file of files){
      if (file.format === "InDelSNP"){
        linksBoolean = true;
        break;
      }
    }

    //reset the group names for links objects, otherwise they may potentially 
    //only be displayed on one group
    for (let file of files){
      let alreadyGrouped=false;
      if (file.format === "InDelSNP"){
        for (let dataPoint of file.data) {
          if (!alreadyGrouped && file.data[0].chr.indexOf("_")!=-1){
            alreadyGrouped=true
          }
          if (alreadyGrouped){
            dataPoint.chr=dataPoint.chr.split("_")[1]
          }

        }
      }
    }

    this.onUpdateGroup1.emit(files);
    this.hasLinks.emit(linksBoolean);
    
    this.loadingService.isCharging = false;

  }


  onAddFileClick(event: FileNode): boolean {
    //this.dialogService.paramFastaDialog.next(this);

    if (event.format==="fasta") {
      this.uploadFastaID=event.fileID;
      this.fileupload.el.nativeElement.children[0].children[2].click();
    }

    return true;
   }

  updateGroups(data) {
    this.groupItems = [];
    for (let i in data) {
      this.groupItems.push(
        {
          label: data[i], icon: 'fa-plus', command: (event: any) => {
          }
        });
    }
  }

  reload() {
    this.clearProject();
    this.getProjects();
  }

  clear() {
    this.userService.projects = [];
    this.userService.selectedProject = null;
    this.clearProject();
  }

  clearProject() {
    this.fastaFiles = [];
    this.selectedFastaIndex = null;
    this.genomicCovFiles = [];
    this.transcriptomicCovFiles = [];
    this.annotationFiles = [];
    this.DEFiles = [];
    this.vcfFiles = [];
    this.expressionFiles = [];
    this.groups = [];
    this.chromosomes = [];
    this.selectedFiles = [];
    this.onClear.emit();
  }


  getProjects() {
    this.isCharging = false;

    const url = environment.host + 'getProjects?email=' + this.userService.getEmail() + '&token=' + this.userService.getToken();
    this.http.get(url).subscribe((data: Array<any>) => {
      this.userService.projects = [];
      if (this.userService.getIsSignedIn() && this.userService.projects.length < 1) {
        for (let i = 0; i < data.length; i++) {
          this.userService.projects.push({ title: data[i].title, id: data[i].id });
        }
      } else if (!this.userService.getIsSignedIn()){
        this.getGenome(this.id);
        this.userService.projects.push({title: this.assembly.title, id: this.assembly.id});
      }
    },
      error => {
        console.log(error);
      });
    this.isCharging = false;
  }

  getCardTitle() {
    if (this.userService.selectedProject) {
      return this.userService.selectedProject.title;
    }
    return 'Project';
  }

  addProject(newProjectTitle, publicPrivate, newProjectDescription) {
    console.log("add project")
    this.ClearMessage.emit();
    this.CreateMessage.emit('Upload Fasta File');
    const url = environment.host + 'addProject';
    const that = this;
    this.http.post(url, {
      title: newProjectTitle, token: this.userService.getToken(),
      user: this.userService.getID(),
      username: this.userService.getusername(),
      public: publicPrivate,
      description: newProjectDescription
    }).subscribe((data: any) => {
      if (data.id === "exists"){
        alert("Project name already exists! Please choose a different name.")
      }
      else {

      
      this.clearProject();
      let newProject: Project = { title: newProjectTitle, id: data.id, public: publicPrivate };

      let newArray = JSON.parse(JSON.stringify(that.userService.projects));
      newArray.push(newProject);
      that.userService.projects = newArray;
      that.userService.selectedProject = null;
      newProjectTitle = '';
      }

    },
      error => {
        console.log(error);
      });

  }

  functionName(userName: string, projectName: string) {
    userName = this.userService.username;
    projectName = this.userService.selectedProject.title;
    this.commonService.functionName(userName, projectName);
  }

  getFilesNames() {
    this.isCharging = true;
    this.clearProject();
    const url = environment.host + "getFilesNames?id=" + this.userService.selectedProject.id + "&token=" + this.userService.getToken();

    this.http.get(url).subscribe((data: any) => {

      this.onProjectSelected.emit();
      if (data) {
        //get commits information, I don't think the database is well structured to handle the 
        //many to one commit-fasta relationship (same fasta can be in many commits, but only one fasta per commit)
        const url = environment.host + "getCommitInfo?id=" + this.userService.selectedProject.id;
        this.http.get(url).subscribe((commits: any ) => {
          var date = /\..*$/g;
          //unfortunately, the get/res doesn't seem able to pass Map(), thus the subsequent lines
          let commitMap = new Map<string, CommitInfo>();
          for (let i=0; i<commits.length; i++){
            var year = commits[i][1].created.match(/\d{4}/);
            var month = commits[i][1].created.match(/-(\d{1,2})-/);
            var day = commits[i][1].created.match(/-(\d{1,2})T/)[1].replace("T", "");
            commits[i][1].created = commits[i][1].created.replace("T", " ").replace(date, "").replace(/:\d\d$/, "").replace(/(\d{4})-(\d{1,2})-(\d{1,2})/, day + "-" + month[1] + "-" + year + " ");
            commitMap.set(commits[i][0], commits[i][1]);
            commits[i][1].longMessage = commits[i][1].message;
            commits[i][1].message = commits[i][1].message.slice(0,9).concat("... ");
          }
          
          this.database.buildFileTree(data, commitMap);
          let fastaIDs: Array<string> = []
          for (let i = 0; i < data.length; i++) {
            if (data[i].format === "fasta") {
              fastaIDs.push(data[i]._id);
            }
          }

        },
          error => {
            console.log(error);
            return false;
          });
      }
      this.isCharging = false;
    },
      error => {
        console.log(error);
        return false;
      });

  }

  getProjectData(files, callback) {

    const url = environment.host + "getBins?id=" + this.userService.selectedProject.id +
      "&token=" + this.userService.getToken() + "&files=" + JSON.stringify(files);
    this.http.get(url).subscribe((data: any) => {


      this.chromosomes = [{ id: 'All', length: null, start: 0, end: 100, range: [0, 100] }];
      for (let i = 0; i < data.fasta.data.length; i++) {
        this.chromosomes.push({
          id: data.fasta.data[i][0], length: data.fasta.data[i][1], start: 0,
          end: data.fasta.data[i][1] - 1, range: [0, data.fasta.data[i][1] - 1]
        });
      }

      callback(data);
    },
      error => {
        console.log(error);
      });
  }


  uploadFile(event) {
    this.parsingBool = true;
    const f = event.files[0]; // get the uploaded file
    const _this = this;

    let extension = f.name.split('.');
    extension = extension[extension.length - 1]; // extract the file extension
    if (extension[extension.length - 2])
      var ext2 = extension[extension.length - 2];
    if (!_this.userService.selectedProject) {
      _this.userService.selectedProject = {
        title: "Project",
        id: "",
        public: false
      };
    }

    // creating a new worker
    const worker = new Worker("parser_worker.js");

    // For bedcov uploading, check that an annotation File is selected
    if (
      extension === "bedcov" ||
      extension === "results" ||
      extension === "de" ||
      extension === "txt" ||
      ext2 === "de"
    ) {
      let annotationFound = false;
      let annotationID;
      for (let i = 0; i < this.selectedFiles.length; i++) {
        if (annotationFound) {
          break;
        }

        for (let j = 0; j < this.annotationFiles.length; j++) {
          if (this.selectedFiles[i] == this.annotationFiles[j].id) {
            annotationFound = true;
            annotationID = this.selectedFiles[i];
            _this.fileForNextLoading = { file: annotationID, list: _this.preLoadedFiles };
            break;
          }
        }
      }
      if (!annotationFound) {
        alert("Please select an annotation file corresponding to the .bedcov before proceeding");
        _this.fileupload.clear();
        return;
      }
    }

    if (this.uploadFastaID != "") {
      worker.postMessage([f, _this.userService.selectedProject.id, _this.userService.getToken(), this.uploadFastaID, _this.fileForNextLoading, _this.chromosomeSignature, true]);
    } else {
      return;
    }
    _this.fileupload.clear();
    worker.onmessage = function (msg) {

      if (msg.data.error) {

        let summary;
        summary = msg.data.error.severity === 'warn' ? 'Warn Message' : 'Error Message';
        _this.toastr.error(summary, msg.data.error.message, { positionClass: 'toast-bottom-right' });

      } else {
        if (msg.data.projectID) {
          _this.userService.selectedProject.id = msg.data.projectID;
          _this.userService.selectedProject.title = msg.data.projectTitle;
        } else if (msg.data.IsBam) {
          alert("The BAI file should be uploaded first. You have entered BAM file, please first enter the corresponding BAI, then try again");
          _this.fileupload.clear();
        } else if (msg.data.IsBai) {
          alert("You have entered BAI file, please now enter the corresponding BAM");
          _this.preLoadedFiles.set(msg.data.file, msg.data.format);
          _this.fileForNextLoading = { file: msg.data.file, list: _this.preLoadedFiles };
          _this.fileupload.clear();
        } else if (msg.data.init) {

          _this.uploads.push({ name: msg.data.name, value: 0 });

        } else {

          for (let i = 0; i < _this.uploads.length; i++) {

            if (_this.uploads[i].name === msg.data.name) {

              _this.uploads[i].value = Math.floor(msg.data.value);

              if (msg.data.value == 100 && msg.data.format) {
				
				_this.getFilesNames();

                // const insertedFile = { name: msg.data.name, format: msg.data.format, id: msg.data.id };
                // _this.populatePickList.push(insertedFile);

                // if (msg.data.format === 'fasta') {
                  // _this.fastaFiles.push(insertedFile);
                  // _this.selectedFastaIndex = _this.fastaFiles.length - 1;
                  // _this.toastr.warning('Warning message', 'Be sure to select the correct fasta file before uploading other files', { positionClass: 'toast-top-right' });
                // } else if (msg.data.format === 'vcf') {
                  // _this.vcfFiles.push(insertedFile)
                // } else if (msg.data.format === 'annotation') {
                  // _this.annotationFiles.push(insertedFile)
                // } else if (msg.data.format === 'diff' || msg.data.format === 'de') {
                  // _this.DEFiles.push(insertedFile)
                // } else if (msg.data.format === 'bam' || msg.data.format === 'bai') {
                  // _this.genomicCovFiles.push(insertedFile)
                // } else if (msg.data.format === 'bedcov') {
                  // _this.transcriptomicCovFiles.push(insertedFile)
                // } else if (msg.data.format === 'results') {
                  // _this.expressionFiles.push(insertedFile)
                // }


                //_this.onEmittingPopulatedPickList.emit(_this.populatePickList);

                _this.uploads.splice(i);
              }
            }
          }
        }
      }
    };
  }

  deleteProject() {
    this.isCharging = true;
    const sure = confirm("Are you sure you want to delete this project ?");
    if (sure) {
      const url = environment.host + "deleteProject";
      this.http
        .post(url, {
          project: this.userService.selectedProject.id,
          user: this.userService.getusername()
        })
        .subscribe(
          data => {
            this.clearProject();
            let index = this.userService.projects.indexOf(
              this.userService.selectedProject
            );

            let newArray = this.userService.projects;
            this.userService.projects = [];
            newArray.splice(index, 1);
            this.userService.projects = newArray;

            const that = this;

            setTimeout(function () {
              that.userService.selectedProject = null;
              that.reload();
              this.isCharging = false;
            }, 2000);
          },
          error => {
            console.log("Error: project couldn't be deleted");
            this.isCharging = false;
          }
        );
    }
  }

  
  
  deleteFile(file: FileNode) {
    const url = environment.host + "deleteFile?id=" + file.id.toString();
    this.http.get(url).subscribe((commits: any ) => {
      this.getFilesNames();    
    })
  }

  openShareDialog() {
    this.sharedialog.open(this.userService.selectedProject.id);
  }

  addEmailToList() {
    this.listEmails.push(this.currentEmail);
    // this.sharedialog.open(this.userService.selectedProject.id);
  }

  shareProject() {
    const rep = this.userService.addUsersToProject(
      this.listEmails,
      this.userService.selectedProject.id
    );
    rep.subscribe((data: any) => {
      if (data.complete) {
        this.toastr.success("Success", "Project Shared !", {
          positionClass: "toast-top-right"
        });
      } else {
        this.toastr.error(
          "Warn Message",
          "User not found, project not shared.",
          { positionClass: "toast-bottom-right" }
        );
      }
      this.listEmails = [];
      this.currentEmail = "";
    });
  }

  saveSvg(svgEl, name) {
    const svg = document.getElementById("biocircos");
    svg.setAttribute("xmlns", environment.host);
    const svgData = svg.outerHTML;
    console.log(svgData);
    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
    let svgBlob = new Blob([preface, svgData], {
      type: "image/svg+xml;charset=utf-8"
    });
    let svgUrl = URL.createObjectURL(svgBlob);
    let downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }


  savePng(svgEl, name) {
    const svg = document.getElementById("biocircos");
    svg.setAttribute("xmlns", environment.host);
    const svgData = svg.outerHTML;
    //saveSvgAsPng(svgData, "diagram.png");
  }

  savePNG(pngEl, name){
    var canvas = document.getElementsByTagName("svg");
    svgg.saveSvgAsPng(document.getElementById("biocircos").firstChild, "biocircos.png");
    // saveSvgAsPng(document.getElementById("biocircos"), "biocircos.png");
    // var img = canvas.to
    // svg.saveSvgAsPng(document.getElementById("biocircos"), "test.png")
  }


  addGroup() {
    var files: Array<FileNode> = this.database.getSelectedNodes();
    this.onAddGroup.emit(this.newGroupName);
  }

  deleteGroup(group) {
    this.onDeleteGroup.emit(group);
    this.groups.splice(this.groups.indexOf(group), 1);
  }

  editGroup(group) {
    this.onEditGroup.emit(group);
  }

  onSelectedFilesChange(fastaIndex) {
    if (fastaIndex == undefined) {
      fastaIndex = this.selectedFastaIndex;
    }
    this.loadingService.isCharging = true;
    const tracks = JSON.parse(JSON.stringify(this.selectedFiles));
    const files: Array<any> = [this.fastaFiles[fastaIndex]];
    for (let i = 0; i < tracks.length; i++) {
      files.push(this.findFile(tracks[i]));
    }
    this.onUpdateGroup1.emit(files);
    tracks.push(this.fastaFiles[fastaIndex].id);
    const _this = this;
    this.ClearMessage.emit();
    this.CreateMessage.emit(['Select Chromosome to Visualise as the whole Circos']);
    this.loadingService.isCharging = false;
  }

  findFile(id): any {
    for (let i = 0; i < this.vcfFiles.length; i++) {
      if (this.vcfFiles[i].id === id) {
        return this.vcfFiles[i];
      }
    }
    for (let i = 0; i < this.annotationFiles.length; i++) {
      if (this.annotationFiles[i].id === id) {
        return this.annotationFiles[i];
      }
    }
    for (let i = 0; i < this.DEFiles.length; i++) {
      if (this.DEFiles[i].id === id) {
        return this.DEFiles[i];
      }
    }
    for (let i = 0; i < this.expressionFiles.length; i++) {
      if (this.expressionFiles[i].id === id) {
        return this.expressionFiles[i];
      }
    }
    for (let i = 0; i < this.genomicCovFiles.length; i++) {
      if (this.genomicCovFiles[i].id === id) {
        return this.genomicCovFiles[i];
      }
    }
    for (let i = 0; i < this.transcriptomicCovFiles.length; i++) {
      if (this.transcriptomicCovFiles[i].id === id) {
        return this.transcriptomicCovFiles[i];
      }
    }
  }

  checkGenomeSize(fasta, tracks) {
    let track;
    for (let i = 0; i < tracks.length; i++) {
      track = tracks[i];
      if (track.format !== 'fasta') {
        if (track.data[track.data.length - 1].chr !== fasta.data[fasta.data.length - 1][0]) {
          this.toastr.warning('There was an issue with the chromosomes indexing, please reupload the "." ' +
            track.format + ' file with the correct .fasta reference', 'Warning message', { positionClass: 'toast-bottom-right' });
        }
      }
    }
  }

  onAddFileLinkClick() {
    this.fileLinkUpload.el.nativeElement.children[0].children[2].click();
  }

  uploadFileLink(event) {
    const f = event.files[0];
    const newFile = {
      filename: f.name, data: { additionalColumns: [] }, selectedColumnForColor: { label: 'Color', value: 'color' },
      project: this.userService.selectedProject.id
    };
    const worker = new Worker('linkfileWorker.js');
    const that = this;
    worker.onmessage = function (msg) {
      if (msg.data.error) {
        that.toastr.error(msg.data.error, 'Error', { positionClass: 'toast-bottom-right' });
        worker.terminate();
        that.fileLinkUpload.clear();
      } else if (msg.data.code === 1) {
        that.dialogService.columnTypeLinkDialog.next({ projectPanel: that, columns: msg.data.columns, worker: worker });
      }
    };
    worker.postMessage({ step: 'start', file: f });
  }
  confirmLinksType(linkWorder, additionalColumns) {
    linkWorder.postMessage(additionalColumns);
  }
  saveLinks(links) {
    const url = environment.host + 'addLinkFile';
    this.http.post(url, links).subscribe(data => {
    },
      error => {
        console.log('Error: file couldn\'t be uploaded');
        this.isCharging = false;
      });
  }

  showFileLinks(file, index) {

    let error = false;
    if (file.data.mode === 'comparison' && this.displaySettingsService.mode !== 'comparison') {
      this.toastr.error('Please create and display the groups corresponding to the files', 'Error', { positionClass: 'toast-bottom-right' });
      error = true;
    }
    if (file.data.mode === 'comparison' && (this.displaySettingsService.groupsChecked.indexOf(file.data.g1) === -1 ||
      this.displaySettingsService.groupsChecked.indexOf(file.data.g2) === -1)) {
      this.toastr.error('Please use the same group names as those in the link file', 'Error', { positionClass: 'toast-bottom-right' });
      error = true;
    }
    if (error) {
      this.selectedFileLinksIndex = null;
    } else {
      this.selectedFileLinksIndex = index;
      const selectedFasta: Array<any> = [this.fastaFiles[this.selectedFastaIndex]];
      this.displayFileLinks.emit({ links: file.data.links, fasta: selectedFasta });
    }

  }

  hideLinks() {
    this.selectedFileLinksIndex = null;
    this.onHideLinks.emit();
  }

  onLinksUpdate(links) {
    this.displayFileLinks.emit({ links: links });
  }


  changeLinkFileColorColumn(columnName, f) {
    const file = JSON.parse(JSON.stringify(f.data));
    const column = file.columns.find(col => col.field === columnName);
    f.selectedColumnForColor = column;
    if (column && column.type === 'level') {
      const colors = ['#9ACD32', '#377DB8', '#F5DEB3', '#EE82EE', '#40E0D0', '#FF6347', '#D8BFD8', '#D2B48C',
        '#4682B4', '#00FF7F', '#FFFAFA', '#708090', '#708090', '#6A5ACD', '#87CEEB', '#A0522D', '#FFF5EE', '#2E8B57', '#F4A460', '#FA8072'];
      const levelsColour = {};  // TODO: generate random color if number of levels bigger than number of colors
      for (let i = 0; i < column.levels.length; i++) {
        levelsColour[column.levels[i].value] = colors[i];
      }
      f.levelsColour = levelsColour;
      for (let i = 0; i < file.links.length; i++) {
        file.links[i].color = levelsColour[file.links[i][columnName]];
      }
    } else if (column && column.type === 'numeric') {
      const scale = 120 / (column.max - column.min);
      for (let i = 0; i < file.links.length; i++) {
        file.links[i].color = this.hslToHex((file.links[i][columnName] - column.min) * scale, 80, 50);
      }
    }
    this.displayFileLinks.emit({ links: file.links });
  }


  deleteLinkFile(index) {
    const url = environment.host + 'deleteLinkFile';
    this.http.post(url, { project: this.userService.selectedProject.id }).subscribe((data: any) => {
      this.linkFiles.splice(index, 1);
    },
      error => {
        console.log(error);
      });
  }


  hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

}





