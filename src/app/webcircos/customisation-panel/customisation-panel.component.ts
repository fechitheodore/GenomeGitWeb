import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-customisation-panel',
  templateUrl: './customisation-panel.component.html',
  styleUrls: ['./customisation-panel.component.css']
})
export class CustomisationPanelComponent implements OnInit {

  isCustomisationClicked = false;
  highlightedRegion = 'genes';
  graphTypeSelected = 'histogram';


  @Output()
  onChangeOnlyHomoSNP = new EventEmitter<boolean>();

  @Output()
  onHighlightAnnotation = new EventEmitter<any>();

  @Output()
  onGraphTypeChange = new EventEmitter<string>();

  singleDisplay = true;

  checkboxesDisplayArcs: Array<string> = [];

  SNPs = [];


  constructor() { }


  openCustomisationPanel() {
    this.isCustomisationClicked = true;
  }


  whatToHighlight(type) {
    this.highlightedRegion = type;
    this.onHighlightAnnotation.emit(this.highlightedRegion);

  }



  changeOnlyHomoSNP(checked) {
    this.onChangeOnlyHomoSNP.emit(checked);
  }


  setMode(mode) {
    this.checkboxesDisplayArcs = [];
    if (mode === 'single') {
      this.singleDisplay = true;
    } else {
      this.singleDisplay = false;
    }

  }

  vcfGraphType(type) {
    this.graphTypeSelected = type;
    this.onGraphTypeChange.emit(this.graphTypeSelected);
  }

  handleSliderChange(e) {
  }


  ngOnInit() {
  }

}
