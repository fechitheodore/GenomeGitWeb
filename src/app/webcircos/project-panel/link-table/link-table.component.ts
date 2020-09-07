import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';

@Component({
  selector: 'app-link-table',
  templateUrl: './link-table.component.html',
  styleUrls: ['./link-table.component.css']
})
export class LinkTableComponent implements OnInit {


  displayLinksDialog = false;

  columns: any;
  links: any;
  selectedLinks: any;
  filteredLinks: any;
  numberTimeout: any;
  headerCheckBoxChecked = true;

  @Output()
  updateLinksDisplayed = new EventEmitter<any>();

  @ViewChild('dt') dt;

  constructor() { }

  ngOnInit() {
  }

  open(file) {
    this.links = file.links;
    this.filteredLinks = this.links;
    this.columns = file.columns;
    this.displayLinksDialog = true;
    this.selectedLinks = JSON.parse(JSON.stringify(this.links));
  }

  onTableNumberChange(event, dt, field) {
    if (this.numberTimeout) {
      clearTimeout(this.numberTimeout);
    }

    this.numberTimeout = setTimeout(() => {
      dt.filter(event.value, field, 'gte');
    }, 250);
  }


  onRowToogle(checked) {
    if (!checked) {
      this.headerCheckBoxChecked = false;
    } else {
      this.checkHeaderCheckBox();
    }
    this.updateLinksDisplayed.emit(this.links.filter(link => link.show));
  }

  onHeaderCheckboxClick(checked) {

    for (const link of this.filteredLinks) {
      link.show = checked;
    }
    this.updateLinksDisplayed.emit(this.links.filter(link => link.show));
  }

  onFilter(event) {
    this.filteredLinks = event.filteredValue;
    this.checkHeaderCheckBox();
  }

  checkHeaderCheckBox() {
    let allChecked = true;
    for (const link of this.filteredLinks) {
      if (!link.show) {
        allChecked = false;
        break;
      }
    }
    this.headerCheckBoxChecked = allChecked;
  }

}
