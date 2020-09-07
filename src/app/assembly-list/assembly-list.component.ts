import { Component, OnInit } from "@angular/core";
import { CommonService } from "../common.service";
import { Assembly } from "../assembly-list/assembly-list.model";

@Component({
  selector: "app-assembly-list",
  templateUrl: "./assembly-list.component.html",
  styleUrls: ["./assembly-list.component.css"]
})
export class AssemblyListComponent implements OnInit {
  private assemblyList: Assembly[];

  constructor(private commonService: CommonService) {}

  ngOnInit() {
    this.getAllGenomes();

    this.commonService.add_subject.subscribe(response => {
      this.getAllGenomes();
    });
  }

  getAllGenomes() {
    this.commonService.getGenomes().subscribe(res => {
      this.assemblyList = [];
      res.json().data.map(e => {
        this.assemblyList.push(e);
      });
    });
  }
}
