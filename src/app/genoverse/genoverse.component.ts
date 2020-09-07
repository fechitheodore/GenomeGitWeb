import { Component, OnInit, ViewChild } from '@angular/core';


declare var Genoverse: any;



@Component({
  selector: 'genoverse',
  templateUrl: './genoverse.component.html',
  styleUrls: ['./genoverse.component.css']
})
export class GenoverseComponent implements OnInit {

  genoverse: any = undefined;
  @ViewChild('genoverse') container;
  @ViewChild('sidebar') sidebar;

  display = false;
  currentConfig: any = null;


  constructor() { }

  ngOnInit() {
    // console.log("genoverse is initted");
  }


  update(config) {
    this.genoverse.reset(config);
    window.scrollTo(0, document.body.scrollHeight);
  }


  reset(config) {

    this.display = true;

    if (this.currentConfig && JSON.stringify(config.files) === JSON.stringify(this.currentConfig.files)) {
      this.update(config);

    } else {
      this.currentConfig = config;
      this.container.nativeElement.innerHTML = '';

      const genome = {};
      genome[config.chr.id] = { size: config.chr.size, bands: [] };


      var tracks = [Genoverse.Track.Scalebar];
      for (let annotationFile of config.files.annotation){
        tracks.push(
          Genoverse.Track.Gene.extend({
            name: annotationFile.name,
            urlParams: { fileID: annotationFile.id }
          })
        );
      }
      for (let vcfFile of config.files.vcf) {
        tracks.push(
          Genoverse.Track.dbSNP.extend({
            name: vcfFile.name,
            urlParams: { fileID: vcfFile.id }
          })
        );
      }


      this.genoverse = new Genoverse({
        container: '#genoverse', // Where to inject Genoverse (css/jQuery selector/DOM element)
        // If no genome supplied, it must have at least chromosomeSize, e.g.:
        // chromosomeSize : 249250621, // chromosome 1, human
        // genome: 'grch38', // see js/genomes/
        width: this.sidebar.containerViewChild.nativeElement.clientWidth,
        genome: genome,
        chr: config.chr.id,
        start: config.start,
        end: config.end,
        plugins: ['controlPanel', 'karyotype', 'trackControls', 'resizer', 'focusRegion', 'fullscreen', 'tooltips', 'fileDrop'],
        tracks: tracks
      });

    }
  }
}
