export class CommitInfo {
	id: string;
	user: string;
	project: string;
	commitHash: string;
	processed: boolean;
	message: string;
	created: Date;
}

export class FileInfo {
	fileName: string;
	projectID: string;
	userToken: string;
	userName: string;
	commitHash: string;
	fileHash: string; //this is the hash of the file provided by ggFastaHash - an hashing implemented in genomeGit
	//that implmenetation is different from sha1sum in linux
	selectedFasta: string;
	dataset: string;
	nextLoad: null;
}

export class LinksDataPoint {
	linkFileID: string; //this is very annoying. It's required because due to 16mb limit on mongo object the LinkDataPoints cannot be stored within object
	//FastaLink.data in database. Thus links data and links file have to be separate collections
	group1Name: string = "";
	group2Name: string = "";
	_g1chr: string;
	get g1chr(): string {
	  return (this.group1Name === "" ? this._g1chr : this.group1Name.concat("_").concat(this._g1chr))
	}
	set g1chr(value: string) {
	  this._g1chr = value;
	}
	g1start: number;
	g1end: number;
	g1value: string = "";
	_g2chr: string;
	get g2chr(): string {
	  return (this.group2Name === "" ? this._g2chr : this.group2Name.concat("_").concat(this._g2chr))
	}
	set g2chr(value: string) {
	  this._g2chr = value;
	}
	g2start: number;
	g2end: number;
	g2value: string = "";
	isSNP: boolean = false;
	isInDel: boolean = false;
	isDelta: boolean = false;
	g1inverted: boolean;
	g2inverted: boolean;
 	color: string;

  
	fusion: string;
  }

  export class FastaLink {
	fileID: string;
	OldFasta: string;
	NewFasta: string;
	data: LinksDataPoint[];
	format: string;
	isDataReversed: boolean = false;
  }