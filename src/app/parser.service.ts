import { Injectable } from '@angular/core';


declare var Bam:any;

@Injectable()
export class ParserService {

  self =this;
  //Detect the file type and return the type
  parseFile(file, callback) {
      var reader = new FileReader();
      var _this = this;

      reader.onload = (function(theFile) {
        return function(e) {

          var extension = file.name.split('.');
          extension = extension[extension.length - 1];
          console.log(extension);
          var result = { format: "", data: {} };
          if (extension == "fasta") {

          }
          switch (extension) {

            case "fasta": {
              result.format = "fasta";
              result.data = _this.parse_fasta(e.target.result);
              break;
            }
            case "fa": {
              console.log(".fa");
              result.format = "fasta";
              result.data = _this.parse_fasta(e.target.result);
              break;
            }
            case "gff3": {
              result.format = "annotation";
              result.data = _this.parse_GFF_GTF(e.target.result);
              break;
            }
            case "gff2": {
              result.format = "annotation";
              result.data = _this.parse_GFF_GTF(e.target.result);
              break;
            }
            case "gff": {
              result.format = "annotation";
              result.data = _this.parse_GFF_GTF(e.target.result);
              break;
            }
            case "gtf": {
              result.format = "annotation";
              result.data = _this.parse_GFF_GTF(e.target.result);
              break;
            }
            case "diff": {
              result.format = "diffExp";
              result.data = _this.parse_DIFF(e.target.result);
              break;
            }
            case "bed": {
              break;
            }
            case "bedcov": {
              break;
            }
            case "vcf": {
              //Need further information from user to differenciate SNP density / Genomic Coverage
              result.format = "vcf";
              result.data = _this.parse_vcf(e.target.result);
              break;
            }
            case "bam": {
              //BINARY File
              break;
            }
            case "results": {
              break;
            }
            default: {
              console.log("Error, the file extension is not correct");
            }
          }
          callback(result);



        };
      })(file);

      reader.readAsText(file);
    }

  //Fasta parser to biocircos matrix to Genome Configuration Matrix
  parse_fasta(text: string): Array<any> {
    var fastaMatrix = [];
    var textArray=[];
    // catch empty string
    if (!text || (text.length === 0)) {
      console.log("Empty String !");
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textArray = text.split("\n");
    }

    var currentLength = 0;
    for (let i = 0; i < textArray.length; i++) {
      var line = textArray[i];

      //Check if the line is a header
      if ((line[0] === ">") || (line[0] === ";")) {

        //First line
        if (!label || (label.length === 0)) {
          var label = line.slice(1);

          //NEED TO UNIFY ALL OF THE CHROMOSOME LABELS ! HERE :
          // ...
          // NEED TO UNIFY ALL OF THE CHROMOSOME LABELS !
        }

        else {
          //Add entry to list_chromosomes_length
          var chromosome_length = [this.numberInChromosome(label), currentLength];
          console.log(chromosome_length);
          fastaMatrix.push(chromosome_length);
          label = line.slice(1);
          currentLength = 0;

        }
      }
      else {
        //Increase the length
        currentLength = currentLength + line.length;
      }

    }

    //Add last entry to list_chromosome_length
    var chromosome_length = [this.numberInChromosome(label), currentLength];
    fastaMatrix.push(chromosome_length);
    return fastaMatrix;
  }

//Parsing BAM files
parse_BAM (bamFile: any, baiFile: any): Array<any> {

    console.log(bamFile);
    console.log(baiFile);
    var _this = this;
    var minBinSize = 100000;
    var currentBin = minBinSize;
    var value = 0;
    var list_genomic_coverage=[];
    var chromosome =[];
    var chromosome_index = 0;
    const maxChromosomeSize = 100000000;
    var test='';
    var chromosomeList = ["0","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","X", "Y"];
    var bam = new Bam( bamFile , { bai: baiFile });
    var jumped = false;

  	for(let i=0;i<chromosomeList.length;i++){
      console.log("into parse_BAM de while");

      bam.fetch(chromosomeList[i], 1,maxChromosomeSize, function(records) {

  	  records.forEach( function(item) {
  			if(item.pos<currentBin){
  				value+=item.seq;
  				//console.log("Match");
  			}
  			else {
          var read = new BAMread(_this.numberInChromosome(chromosomeList[chromosome_index]),currentBin,value/minBinSize);
          //console.log(chromosomeList[chromosome_index] + JSON.stringify(read, null, 4));
          chromosome.push(read);

          while(item.pos > currentBin+minBinSize){
              currentBin+=minBinSize;
              var read = new BAMread(_this.numberInChromosome(chromosomeList[chromosome_index]),currentBin,0);
              chromosome.push(read);
              //console.log(_this.numberInChromosome(chromosomeList[chromosome_index])+ JSON.stringify(read, null, 4));
            }

          value =item.seq;
  				currentBin += minBinSize;
  				//console.log("NewBin");

  			}});

      var read = new BAMread(_this.numberInChromosome(chromosomeList[chromosome_index]),currentBin,value/minBinSize);
      console.log("New Chromosome");
      chromosome.push(read);
      //list_genomic_coverage.push(chromosome);
      //chromosome=[];
      chromosome_index++;
      value=0;
      currentBin =0;
  		});



  	}

    //return list_genomic_coverage;
    return chromosome;

  }

//Parsing VCF files
  parse_vcf(text: string): Array<any> {
    var list_VCF_File = [];
    var line;

    // catch empty string
    if (!text || (text.length === 0)) {
      return [];
    }
    var textSplit=[];
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') { textSplit = text.split("\n"); }

    for (var i = 0; i < textSplit.length - 1; i++) {
      line = textSplit[i];
      if (line.charAt(0) !== "#") {
        line = line.split('\t');

        var information = {chr:this.numberInChromosome(line[0]), pos: line[1], value:line[5],  des: line[2], color: "rgb(153,102,0)"};

        list_VCF_File.push(information);
      }

    }

    return list_VCF_File;
  }

  //GFF3 Annotation Parser to Biocircus ARC matrix

  //Parser
  parse_GFF_GTF(text: string): Array<any>{
    console.log("Parsing  a GTF file.");
  	var list_annotation= [];
    var textArray=[];
  	// catch empty string
      if (!text || (text.length === 0)) {
        console.log("File is empty");
        return [];
      }
  	//Split by line if the text is not an array already
  	if (Object.prototype.toString.call(text) !== '[object Array]') { textArray = text.split("\n");}

  	for (let i = 0; i < textArray.length; i++) {
  		var line = textArray[i];
  		//Check if the line is a header
  		if ((line[0] === "#") || (line[0] === ";")|| (line[0] === "\n") || (line[0] === undefined)) {

  			}
  		else {
  			line = line.split("\t");
  			var pattern = /;Name=[A-Za-z0-9_-]*/;
  			var desName = line[8].match(pattern);
  			if(!desName || (desName.length === 0) ) {
  				desName=["Des=NA"];
  			}

        //Choose color according to the feature type (line[2])
        var colour="";
        if(line[2]=="gene" || line[2]=="mRNA")
          colour ="green";
        else
          colour ="red";

        if(line[2]!="chromosome"){
  			var row = new AnnotationLine(this.numberInChromosome(line[0]),line[3],line[4],colour,desName[0].split("=")[1]);
  			console.log(row.chr +" "+ row.start +" "+ row.end +" "+ row.color +" "+ row.des);
  			list_annotation.push(row);
        }
  		}


  	}

  	return list_annotation;
  }

  parse_DIFF(text: string): Array<any>{
    console.log("Parsing  a diff file.");
  	var list_diff= [];
    var textArray;
  	// catch empty string
      if (!text || (text.length === 0)) {
        console.log("File is empty");
        return [];
      }
  	//Split by line if the text is not an array already
  	if (Object.prototype.toString.call(text) !== '[object Array]') { textArray = text.split("\n");}

  	for (let i = 1; i < textArray.length; i++) {
  		var line = textArray[i];
  		//Check if the line is a header
  			line = line.split("\t");
        if(line[line.length-1]!="no"){

          if(line[3]){
          var locus = line[3].split(":");
          var chromosome = locus[0];

  			  var row = new DiffLine(this.numberInChromosome(locus[0]),locus[1].split("-")[0],locus[1].split("-")[1],line[2],line[9]);
  			  console.log(row.chr +" "+ row.start +" "+ row.end +" "+ row.name +" "+ row.value);
  			  list_diff.push(row);
        }
        }
  		}

  	return list_diff;
  }

  numberInChromosome(chromosome :string):string{
    var pattern = /\d*[^.]$/;
    var chromosomeNumber :string= String(chromosome).match(pattern)[0];

    if(String(chromosomeNumber).charAt(0)==="0"){
      chromosomeNumber=String(chromosomeNumber).charAt(1)
    }
    //console.log(chromosomeNumber);
    return String(chromosomeNumber);
  }

}
//DiffLine Object
 class DiffLine{
  chr : string;
  start : number;
  end : number;
  name : string;
  value : number;
    constructor(chr: string, start: number, end: number, name: string, value: number) {
      this.chr = chr;
      this.start = start;
      this.end =end;
      this.name = name;
      this.value = value;
    }
}

//Annotation Object
 class AnnotationLine{
  chr : string;
  start : number;
  end : number;
  color : string;
  des : string;
    constructor(chr: string, start: number, end: number, color: string, des: string) {
      this.chr = chr;
      this.start = start;
      this.end =end;
      this.color = color;
      this.des = des;
    }
}
class BAMread {
  chr : string;
	pos : number;
	value : number;
  constructor(chr:string, pos:number, depth:number) {
    this.chr=chr;
    this.pos=pos;
    this.value=depth;
  }


	}
