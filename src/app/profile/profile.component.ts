import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  Input
} from "@angular/core";
import { Observable } from "rxjs";
import { map, startWith } from "rxjs/operators";
import { UserService } from "../user.service";
import { ToolbarComponent } from "../toolbar/toolbar.component";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { MatSlideToggleChange } from "@angular/material";
import { CommonService } from "../common.service";
import { ProjectPanelComponent } from "../webcircos/project-panel/project-panel.component";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { FileDatabase } from "../webcircos/file-management/cdk-tree-nested-example";
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  Validators
} from "@angular/forms";
import { ErrorStateMatcher } from "@angular/material/core";
import { AutocompleteFilterExampleComponent } from "../autocomplete-filter-example/autocomplete-filter-example.component";


// model structure for project
interface Project {
  title: string;
  _id?: string;
  id?: string;
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

interface User {
  username: string;
  email: string;
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.css"],
  providers: [
    FileDatabase,
    ToolbarComponent,
    ProjectPanelComponent,
    AutocompleteFilterExampleComponent
  ]
})
export class ProfileComponent implements OnInit {
  issueFormControl = new FormControl("", [Validators.required]);
  collabFormControl = new FormControl("", [Validators.required]);
  descriptionFormControl = new FormControl("", [Validators.required]);
  editDescription: boolean = false;
  matcher = new MyErrorStateMatcher();

  checked: boolean;
  fastaFiles: File[] = [];
  vcfFiles: File[] = [];
  annotationFiles: File[] = [];
  DEFiles: File[] = [];
  genomicCovFiles: File[] = [];
  transcriptomicCovFiles: File[] = [];
  expressionFiles: File[] = [];
  selectedFastaIndex: number = null;
  populatePickList: any[] = [];
  isCharging = true;

  projects: Project[];
  issues: [any];
  projectClicked: boolean = false;
  projectSelected: Project;
  projectID: string;
  projectCollabs: User[];
  userID: string;

  collabID: string;

  solved: boolean;
  viewSolvedBoolean: boolean = false;

  myControl = new FormControl();
  genomeOptions: string[] = [];
  userOptions: string[] = [];
  filteredOptions: Observable<string[]>;
  input: string;
  output: string[];
  ranks: string[];
  complete = [];
  results: string[];

  @Output()
  change: EventEmitter<MatSlideToggleChange>;

  @Output()
  change1: EventEmitter<MatCheckboxModule>;

  @Output()
  onProjectSelected = new EventEmitter<any>();

  @Output()
  onEmittingPopulatedPickList = new EventEmitter<Object>();

  @Input() toolbar: ToolbarComponent;
  email: string;
  files: string[];
  showUser() {
    this.email = this.userService.getEmail();
    // this.files=this.userService.g
  }

  constructor(
    private userService: UserService,
    private http: HttpClient,
    private commonService: CommonService //private projectPanelComponenet: ProjectPanelComponent
  ) {}

  ngOnInit() {
    this.email = this.userService.getEmail();
    if (this.userService.getIsSignedIn()) {
      this.getProjects();
      this.userID = this.userService.getusername();
    }
    this.getAllUsers();
    this.commonService.add_subject.subscribe(response => {
      this.getAllUsers();
    });
    this.projectClicked = false;
    this.filteredOptions = this.collabFormControl.valueChanges.pipe(startWith(''), map(value => this._filter(value)));
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    this.output = [];
    this.ranks = [];
    this.complete = [];
    this.results = [];
    for (let x = 0; x < this.userOptions.length; x++) {
      if (this.userOptions[x].toLowerCase().includes(filterValue)) {
        this.output.push(this.userOptions[x]);
      }
    }
    for (let y = 0; y < this.output.length; y++) {
      this.ranks.push(
        this.sift4(
          this.output[y].toLowerCase(),
          filterValue,
          this.output[y].length,
          this.config
        )
      );
      this.complete.push({ key: this.ranks[y], value: this.output[y] });
    }
    this.complete.sort(this.rank);
    for (let z = 0; z < this.complete.length; z++) {
      this.results.push(this.complete[z].value);
    }
    //return filtered options
    //return this.options.filter(option => option.toLowerCase().includes(filterValue));
    return this.results.filter(result =>
      result.toLowerCase().includes(filterValue)
    );
  }

  descriptionEdited(){
    this.editDescription = false;
  }

  viewSolved(){
    this.viewSolvedBoolean = true;
  }

  timeDifference(previous) {
    var current = Date.now();
    var previous1 = Date.parse(previous);

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous1;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

  updateDescription(){
    this.editDescription = true;
    console.log("updateDescription() triggered");
  }

  submitDescription(description: string, projectid: string){
    console.log("submitDescription triggered: ", description, projectid);
    this.commonService.editDescription(description, projectid).subscribe();
  }

  submitIssue(
    issueTitle: string,
    issueComment: string,
    id: string,
    userID: string
  ) {
    this.commonService
      .submitIssue(issueTitle, issueComment, id, userID)
      .subscribe();
    this.commonService.getIssues(id).subscribe(res => {
      this.issues = res.json().issues;
    });
  }

  getAllUsers() {
    this.commonService.getUsers().subscribe(res => {
      this.userOptions = [];
      res.json().data.map(e => {
        this.userOptions.push(e.username);
      });
    });
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(""),
      map(value => this._filter(value))
    );
  }

  rank(a, b) {
    var x = a.key;
    var y = b.key;
    if (x > y) {
      return 1;
    } else if (x < y) {
      return -1;
    } else {
      return 0;
    }
  }

  getProjects() {
    // this.isCharging = false;
    const url =
      environment.host +
      "getProjects?email=" +
      this.userService.getEmail() +
      "&token=" +
      this.userService.getToken();
    this.http.get(url).subscribe(
      (data: Project[]) => {
        this.userService.projects = [];
        for (let i = 0; i < data.length; i++) {
          this.userService.projects.push({
            title: data[i].title,
            id: data[i].id,
            public: data[i].public,
            files: data[i].files,
            issues: data[i].issues
          });
        }
      },
      error => {
        console.log(error);
      }
    );
    // this.isCharging = false;
  }

  updateProject(publicPrivate, title) {
    const that = this;
    this.commonService
      .updateProject(title, this.userService.getID(), publicPrivate)
      .subscribe();
  }

  updateIssue(solved, projectID, issueID) {
    this.commonService.updateIssue(solved, projectID, issueID).subscribe();
  }

  issueSolved(projectID, issueID, solved, issue){
    var unsolvedIssues: number = this.projectSelected.issues.length-1;
    // for (var i = 0; i < this.projectSelected.issues.length; i++){
    //   if (this.projectSelected.issues[i].solved === false){
    //     unsolvedIssues++;
    //   }
    // }
    var solvedIssue = unsolvedIssues - issue;
    console.log(this.projectSelected.issues.length, unsolvedIssues, solvedIssue);
    this.commonService.issueSolved(projectID, issueID, solved, solvedIssue).subscribe();
  }

  projectChosen(id) {
    // console.log(id);
    this.viewSolvedBoolean = false;
    this.projectID = id;
    this.fastaFiles = [];
    this.vcfFiles = [];
    this.annotationFiles = [];
    this.DEFiles = [];
    this.genomicCovFiles = [];
    this.transcriptomicCovFiles = [];
    this.expressionFiles = [];
    this.populatePickList = [];

    // get project
    this.commonService.getGenome(id).subscribe(res => {
      this.projectSelected = res.json();
      var date = /\..*$/g;
      this.projectClicked = true;
      if (this.projectSelected.issues) {
        for (var i = 0; i < this.projectSelected.issues.length; i++) {
          this.projectSelected.issues[i].date = this.timeDifference(this.projectSelected.issues[i].date);
          // this.projectSelected.issues[i].date = this.projectSelected.issues[i].date.replace("T", " ").replace(date, "").replace(/:\d\d$/, "");
          this.projectSelected.issues[i].longComment = this.projectSelected.issues[i].comment;
          if(this.projectSelected.issues[i].comment.length > 20){
            this.projectSelected.issues[i].comment = this.projectSelected.issues[i].comment.slice(0,20).concat("...");
          }
          this.projectSelected.issues[i].longTitle = this.projectSelected.issues[i].title;
          if(this.projectSelected.issues[i].title.length > 20){
            this.projectSelected.issues[i].title = this.projectSelected.issues[i].title.slice(0,20).concat("...");
          }
        }
      }

      // get collaborators
      if(this.projectSelected.users){
        this.commonService
        .getCollaborators(id, this.projectSelected.users)
        .subscribe(res => {
          this.projectCollabs = [];
          for (var i = 0; i < res.json().data.length; i++) {
            this.projectCollabs.push({
              username: res.json().data[i].username,
              email: res.json().data[i].email
            });
          }
        });
      }

      // get issues
      this.commonService.getIssues(this.projectSelected._id).subscribe(res => {
        this.issues = res.json().issues;
      });
    });

    // // get collaborators
    // this.commonService
    //   .getCollaborators(id, this.projectSelected.users)
    //   .subscribe(res => {
    //     this.projectCollabs = [];
    //     for (var i = 0; i < res.json().data.length; i++) {
    //       this.projectCollabs.push({
    //         username: res.json().data[i].username,
    //         email: res.json().data[i].email
    //       });
    //     }
    //   });

    const url =
      environment.host +
      "getFilesNames?id=" +
      id +
      "&token=" +
      this.userService.getToken();
    this.http.get(url).subscribe(
      (data: any) => {
        this.onProjectSelected.emit();
        if (data) {
          for (let i = 0; i < data.length; i++) {
            if (data[i].format === "fasta") {
              this.fastaFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (data[i].format === "vcf") {
              this.vcfFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (data[i].format === "annotation") {
              this.annotationFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (
              data[i].format === "diffExp" ||
              data[i].format === "de"
            ) {
              this.DEFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (data[i].format === "bam" || data[i].format === "bai") {
              this.genomicCovFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (data[i].format === "bedcov") {
              this.transcriptomicCovFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            } else if (data[i].format === "results") {
              this.expressionFiles.push({
                name: data[i].name,
                format: data[i].format,
                id: data[i]._id
              });
            }
          }

          if (this.fastaFiles.length > 0) {
            this.selectedFastaIndex = 0;
          }

          this.populatePickList = this.fastaFiles.concat(
            this.vcfFiles.concat(
              this.annotationFiles.concat(
                this.DEFiles.concat(
                  this.genomicCovFiles.concat(
                    this.transcriptomicCovFiles.concat(this.expressionFiles)
                  )
                )
              )
            )
          );

          this.onEmittingPopulatedPickList.emit(this.populatePickList);
        }
        this.isCharging = false;
      },
      error => {
        console.log(error);
        return false;
      }
    );
  }

  addCollaborator(projectID, username) {
    this.commonService.getUserId(username).subscribe(res => {
      this.collabID = res.json().data;
      this.commonService.addCollaborator(projectID, this.collabID, this.userService.username).subscribe();
    });
  }

  config = this.extend(this.config, {
    maxDistance: null,
    tokenizer: function(s) {
      var result = [];
      if (!s) return result;
      for (var i = 0; i <= s.length - 2; i++) {
        result.push(s.substr(i, 2));
      }
      return result;
    },
    //tokenizer: function(s) { return s?s.split(''):[]; },
    tokenMatcher: function(t1, t2) {
      return t1 == t2;
    },
    matchingEvaluator: function(t1, t2) {
      return 1;
    },
    localLengthEvaluator: function(local_cs) {
      return local_cs;
    },
    transpositionCostEvaluator: function(c1, c2) {
      return 1;
    },
    transpositionsEvaluator: function(lcss, trans) {
      return lcss - trans;
    }
  });

  sift4(s1, s2, maxOffset, options) {
    var t1 = options.tokenizer(s1);
    var t2 = options.tokenizer(s2);

    var l1 = t1.length;
    var l2 = t2.length;

    if (l1 == 0) return l2;
    if (l2 == 0) return l1;

    var c1 = 0; //cursor for string 1
    var c2 = 0; //cursor for string 2
    var lcss = 0; //largest common subsequence
    var local_cs = 0; //local common substring
    var trans = 0; //number of transpositions ('ab' vs 'ba')
    var offset_arr = []; //offset pair array, for computing the transpositions

    while (c1 < l1 && c2 < l2) {
      if (options.tokenMatcher(t1[c1], t2[c2])) {
        local_cs += options.matchingEvaluator(t1[c1], t2[c2]);
        var isTrans = false;
        //see if current match is a transposition
        var i = 0;
        while (i < offset_arr.length) {
          var ofs = offset_arr[i];
          if (c1 <= ofs.c1 || c2 <= ofs.c2) {
            // when two matches cross, the one considered a transposition is the one with the largest difference in offsets
            isTrans = Math.abs(c2 - c1) >= Math.abs(ofs.c2 - ofs.c1);
            if (isTrans) {
              trans += options.transpositionCostEvaluator(c1, c2);
            } else {
              if (!ofs.trans) {
                ofs.trans = true;
                trans += options.transpositionCostEvaluator(ofs.c1, ofs.c2);
              }
            }
            break;
          } else {
            if (c1 > ofs.c2 && c2 > ofs.c1) {
              offset_arr.splice(i, 1);
            } else {
              i++;
            }
          }
        }
        offset_arr.push({
          c1: c1,
          c2: c2,
          trans: isTrans
        });
      } else {
        lcss += options.localLengthEvaluator(local_cs);
        local_cs = 0;
        if (c1 != c2) {
          c1 = c2 = Math.min(c1, c2); //using min allows the computation of transpositions
        }
        //if matching tokens are found, remove 1 from both cursors (they get incremented at the end of the loop)
        //so that we can have only one code block handling matches
        for (var i = 0; i < maxOffset && (c1 + i < l1 || c2 + i < l2); i++) {
          if (c1 + i < l1 && options.tokenMatcher(t1[c1 + i], t2[c2])) {
            c1 += i - 1;
            c2--;
            break;
          }
          if (c2 + i < l2 && options.tokenMatcher(t1[c1], t2[c2 + i])) {
            c1--;
            c2 += i - 1;
            break;
          }
        }
      }
      c1++;
      c2++;
      if (options.maxDistance) {
        var temporaryDistance =
          options.localLengthEvaluator(Math.max(c1, c2)) -
          options.transpositionsEvaluator(lcss, trans);
        if (temporaryDistance >= options.maxDistance)
          return Math.round(temporaryDistance);
      }
      // this covers the case where the last match is on the last token in list, so that it can compute transpositions correctly
      if (c1 >= l1 || c2 >= l2) {
        lcss += options.localLengthEvaluator(local_cs);
        local_cs = 0;
        c1 = c2 = Math.min(c1, c2);
      }
    }
    lcss += options.localLengthEvaluator(local_cs);
    return Math.round(
      options.localLengthEvaluator(Math.max(l1, l2)) -
        options.transpositionsEvaluator(lcss, trans)
    ); //add the cost of found transpositions
  }

  extend(obj, def) {
    var result = {};
    for (var prop in def) {
      if (!obj || !obj.hasOwnProperty(prop)) {
        result[prop] = def[prop];
      } else {
        result[prop] = obj[prop];
      }
    }
    return result;
  }

  // possible values for the options
  // tokenizers:
  nGramTokenizer(s, n) {
    //tokenizer:function(s) { return nGramTokenizer(s,2); }
    var result = [];
    if (!s) return result;
    for (var i = 0; i <= s.length - n; i++) {
      result.push(s.substr(i, n));
    }
    return result;
  }

  wordSplitTokenizer(s) {
    //tokenizer:wordSplitTokenizer
    if (!s) return [];
    return s.split(/\s+/);
  }

  characterFrequencyTokenizer(s) {
    //tokenizer:characterFrequencyTokenizer (letters only)
    var result = [];
    for (var i = 0; i <= 25; i++) {
      var val = 0;
      if (s) {
        for (let j = 0; j < s.length; j++) {
          var code = s.charCodeAt(j);
          if (code == i + 65 || code == i + 97) val++;
        }
      }
      result.push(val);
    }
    return result;
  }

  //tokenMatchers:
  sift4TokenMatcher(t1, t2) {
    //tokenMatcher:sift4TokenMatcher
    var similarity =
      1 - this.sift4(t1, t2, 5, this.config) / Math.max(t1.length, t2.length);
    return similarity > 0.7;
  }

  //matchingEvaluators:
  sift4MatchingEvaluator(t1, t2) {
    //matchingEvaluator:sift4MatchingEvaluator
    var similarity =
      1 - this.sift4(t1, t2, 5, this.config) / Math.max(t1.length, t2.length);
    return similarity;
  }

  //localLengthEvaluators:
  rewardLengthEvaluator(l) {
    if (l < 1) return l; //0 -> 0
    return l - 1 / (l + 1); //1 -> 0.5, 2-> 0.66, 9 -> 0.9
  }

  rewardLengthEvaluator2(l) {
    return Math.pow(l, 1.5); // 0 -> 0, 1 -> 1, 2 -> 2.83, 10 -> 31.62
  }

  //transpositionCostEvaluators:
  longerTranspositionsAreMoreCostly(c1, c2) {
    return Math.abs(c2 - c1) / 9 + 1;
  }
}
