import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MessageService } from "primeng/components/common/messageservice";
import { UserService } from "./../user.service";
import { CommonService } from "../common.service";
import { Assembly } from "../assembly-list/assembly-list.model";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "webcircos",
  templateUrl: "./webcircos.component.html",
  styleUrls: ["./webcircos.component.css"],
  providers: [MessageService, CommonService]
})
export class WebcircosComponent implements OnInit, OnDestroy {
  triedCookies = false;
  message = null;
  projectPanelOpened = true;
  id: string;
  private sub: any;

  private assemblyList: Assembly[];
  private assembly: Assembly[];

  // getters for the html components

  @ViewChild("projectPanel") projectPanel;
  @ViewChild("biocircos") biocircos;
  @ViewChild("genoverse") genoverse;
  @ViewChild("customisation") customisation;
  @ViewChild("sharedialog") sharedialog;

  constructor(
    private userService: UserService,
    messageService: MessageService,
    private commonService: CommonService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const that = this;
    let timeout;

    window.onresize = function() {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        that.biocircos.redraw();
      }, 50);
    };

    this.getAllGenomes();
    this.commonService.add_subject.subscribe(response => {
      this.getAllGenomes();
    });

    this.sub = this.route.params.subscribe(params => {
      this.id = params["id"];
    });

    this.getGenome(this.id);
    // console.log(this.id);
    this.commonService.add_subject.subscribe(response => {
      this.getGenome(this.id);
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
  
  getAllGenomes() {
    this.commonService.getGenomes().subscribe(res => {
      this.assemblyList = [];
      res.json().data.map(e => {
        this.assemblyList.push(e);
      });
      // console.log(this.assemblyList);
    });
  }

  getGenome(id: string) {
    // console.log("ID at getGenome(id) webcircos line 81",id);
    this.commonService.getGenome(id).subscribe(res => {
      this.id = null;
      this.assembly = [];
      // console.log(res.json()._id);
      if (res.json()){
        this.assembly = res.json();
        this.userService.projects = [];
        this.userService.projects.push({title: res.json().title, id: res.json()._id})
        // console.log(this.userService.projects);
      }
      // console.log(this.assembly);
    });
  }

  updateGroups(data) {
    this.projectPanel.updateGroups(data);
  }

  clear_message() {
    this.biocircos.clear_messages();
  }

  create_message(Xi) {
    for (var i = 0; i < Xi.length; i++) {
      this.biocircos.create_msgs([Xi]);
    }
  }

  clear() {
    this.biocircos.clearProject();
  }

  sendFileList(data) {
    this.biocircos.submitFileList(data);
  }

  displayCircos(event) {
    this.biocircos.submitDisplayCircos(event.data, event.mode);
  }

  catchPickListEmittedApp(e) {
    this.biocircos.catchPickListEmittedBiocircos(e);
  }

  addGroup(name) {
    this.biocircos.addGroup(name);
  }

  deleteGroup(name) {
    this.biocircos.deleteGroup(name);
  }
  editGroup(name) {
    this.biocircos.editGroup(name);
  }

  onUpdateGroup1(data) {
    this.biocircos.updateGroup1(data);
  }

  hasLinks(data){
    this.biocircos.showLinksLegend(data);
  }

  onProjectSelected() {
    this.biocircos.showInstructionMessage(
      "Upload some files or select files from the list to display the circos"
    );
  }

  passClickToLinear(event) {
    this.genoverse.reset(event);
  }

  toogleProjectPanel() {
    this.projectPanelOpened = !this.projectPanelOpened;
    const that = this;
    setTimeout(function() {
      that.biocircos.redraw();
    }, 350);
  }

  catchHighlightGenes(event) {
    this.biocircos.catchHighlightGenes(event);
  }

  onChangeDisplayMessage(event) {
    this.biocircos.onChangeDisplayMessage(event);
  }
  catchGraphTypeSelection(event) {
    this.biocircos.catchGraphTypeSelection(event);
  }
  changeOnlyHomoSNP(event) {
    this.biocircos.changeOnlyHomoSNP(event);
  }
}
