import { Component, OnInit } from "@angular/core";
import { CommonService } from "../common.service";
import { Assembly } from "../assembly-list/assembly-list.model";

// declare let WOW: any;

namespace global {
  interface JQuery {
    actual: any;
  }
}

@Component({
  selector: "app-welcome",
  templateUrl: "./welcome.component.html",
  styleUrls: [
    "./welcome.component.css",
    "../../../public/css/ionicons.min.css",
    "../../../public/css/font-awesome.min.css",
    "../../../public/css/animate.css",
    "../../../public/css/custom.css"
  ],
  providers: [CommonService]
})
export class WelcomeComponent implements OnInit {
  private assemblyList: Assembly[];

  constructor(private commonService: CommonService) {}

  ngOnInit() {
    this.getAllGenomes();

    this.commonService.add_subject.subscribe(response => {
      this.getAllGenomes();
    });
    // new WOW().init();
  }

  getAllGenomes() {
    this.commonService.getGenomes().subscribe(res => {
      this.assemblyList = [];
      res.json().data.map(e => {
        this.assemblyList.push(e);
        // this.assemblyList.shortDescription.push(e.description.slice(0,75).concat("..."));
      });
      this.assemblyList.sort((a, b) => {
        if(a.files.length < b.files.length){
          return 1;
        } else if (a.files.length > b.files.length){
          return -1;
        } else {
          return 0;
        }
      });
      for (var i = 0; i > this.assemblyList.length; i++){
        this.assemblyList[i].shortDescription = this.assemblyList[i].description.slice(0,75).concat("...");
      }
      // console.log(this.assemblyList);
    });
  }
}
