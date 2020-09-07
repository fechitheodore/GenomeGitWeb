import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CommonService } from "../common.service";
import { Assembly } from "../assembly-list/assembly-list.model";
import { AngularFontAwesomeComponent } from 'angular-font-awesome';

/**
 * @title Filter autocomplete
 */
@Component({
  selector: 'autocomplete-filter-example',
  templateUrl: 'autocomplete-filter-example.component.html',
  styleUrls: ['autocomplete-filter-example.component.css'],
  providers: [CommonService]
})
export class AutocompleteFilterExampleComponent implements OnInit {
  constructor(private commonService: CommonService) { }

  myControl = new FormControl();
  genomeOptions = [];
  genomeIds: string[] = [];
  filteredOptions: Observable<any[]>;
  input: string;
  output= [];
  ranks = [];
  complete = [];
  results = [];

  ngOnInit() {
      this.getAllGenomes();
      this.commonService.add_subject.subscribe(response => {
        this.getAllGenomes();
      });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    this.output = [];
    this.ranks = [];
    this.complete = [];
    this.results = [];
    for (let x = 0; x < this.genomeOptions.length; x++) {
      if (this.genomeOptions[x].title.toLowerCase().includes(filterValue)) {
        this.output.push(this.genomeOptions[x])
      }
    };
    for (let y = 0; y < this.output.length; y++) {
      this.ranks.push(
        this.sift4(this.output[y].title.toLowerCase(), filterValue, this.output[y].length, this.config)
      );
      this.complete.push({ key: this.ranks[y], value: this.output[y].title, id: this.output[y].id })
    }
    this.complete.sort(this.rank);
    for (let z = 0; z < this.complete.length; z++) {
      this.results.push(this.complete[z].value);
    }
    //return filtered options
    //return this.options.filter(option => option.toLowerCase().includes(filterValue));
    return this.complete.filter(result => result.value.toLowerCase().includes(filterValue));
  }

  getAllGenomes() {
    this.commonService.getGenomes().subscribe(res => {
      this.genomeOptions = [];
      res.json().data.map(e => {
        this.genomeOptions.push({title: e.title, id: e._id});
        //this.genomeIds.push(e._id);
      });
    });
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
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

  // Sift4 - extended version
  // online algorithm to compute the distance between two strings in O(n)
  // maxOffset is the number of positions to search for matching tokens
  // options: the options for the function, allowing for customization of the scope and algorithm:
  //         maxDistance: the distance at which the algorithm should stop computing the value and just exit (the strings are too different anyway)
  //         tokenizer: a function to transform strings into vectors of tokens
  //        tokenMatcher: a function to determine if two tokens are matching (equal)
  //        matchingEvaluator: a function to determine the way a token match should be added to the local_cs. For example a fuzzy match could be implemented.
  //        localLengthEvaluator: a function to determine the way the local_cs value is added to the lcss. For example longer continuous substrings could be awarded.
  //        transpositionCostEvaluator: a function to determine the value of an individual transposition. For example longer transpositions should have a higher cost.
  //        transpositionsEvaluator: a function to determine the way the total cost of transpositions affects the final result

  config = this.extend(this.config, {
    maxDistance: null,
    tokenizer: function (s) {
      var result = [];
      if (!s) return result;
      for (var i = 0; i <= s.length - 2; i++) {
        result.push(s.substr(i, 2));
      }
      return result;
    },
    //tokenizer: function(s) { return s?s.split(''):[]; },
    tokenMatcher: function (t1, t2) { return t1 == t2; },
    matchingEvaluator: function (t1, t2) { return 1; },
    localLengthEvaluator: function (local_cs) { return local_cs; },
    transpositionCostEvaluator: function (c1, c2) { return 1; },
    transpositionsEvaluator: function (lcss, trans) { return lcss - trans; }
  });

  sift4(s1, s2, maxOffset, options) {

    var t1 = options.tokenizer(s1);
    var t2 = options.tokenizer(s2);

    var l1 = t1.length;
    var l2 = t2.length;

    if (l1 == 0) return l2;
    if (l2 == 0) return l1;

    var c1 = 0;  //cursor for string 1
    var c2 = 0;  //cursor for string 2
    var lcss = 0;  //largest common subsequence
    var local_cs = 0; //local common substring
    var trans = 0;  //number of transpositions ('ab' vs 'ba')
    var offset_arr = [];  //offset pair array, for computing the transpositions

    while ((c1 < l1) && (c2 < l2)) {
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
          c1 = c2 = Math.min(c1, c2);  //using min allows the computation of transpositions
        }
        //if matching tokens are found, remove 1 from both cursors (they get incremented at the end of the loop)
        //so that we can have only one code block handling matches 
        for (var i = 0; i < maxOffset && (c1 + i < l1 || c2 + i < l2); i++) {
          if ((c1 + i < l1) && options.tokenMatcher(t1[c1 + i], t2[c2])) {
            c1 += i - 1;
            c2--;
            break;
          }
          if ((c2 + i < l2) && options.tokenMatcher(t1[c1], t2[c2 + i])) {
            c1--;
            c2 += i - 1;
            break;
          }
        }
      }
      c1++;
      c2++;
      if (options.maxDistance) {
        var temporaryDistance = options.localLengthEvaluator(Math.max(c1, c2)) - options.transpositionsEvaluator(lcss, trans);
        if (temporaryDistance >= options.maxDistance) return Math.round(temporaryDistance);
      }
      // this covers the case where the last match is on the last token in list, so that it can compute transpositions correctly
      if ((c1 >= l1) || (c2 >= l2)) {
        lcss += options.localLengthEvaluator(local_cs);
        local_cs = 0;
        c1 = c2 = Math.min(c1, c2);
      }
    }
    lcss += options.localLengthEvaluator(local_cs);
    return Math.round(options.localLengthEvaluator(Math.max(l1, l2)) - options.transpositionsEvaluator(lcss, trans)); //add the cost of found transpositions
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
  nGramTokenizer(s, n) { //tokenizer:function(s) { return nGramTokenizer(s,2); }
    var result = [];
    if (!s) return result;
    for (var i = 0; i <= s.length - n; i++) {
      result.push(s.substr(i, n));
    }
    return result;
  }

  wordSplitTokenizer(s) { //tokenizer:wordSplitTokenizer
    if (!s) return [];
    return s.split(/\s+/);
  }

  characterFrequencyTokenizer(s) { //tokenizer:characterFrequencyTokenizer (letters only)
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
  sift4TokenMatcher(t1, t2) { //tokenMatcher:sift4TokenMatcher
    var similarity = 1 - this.sift4(t1, t2, 5, this.config) / Math.max(t1.length, t2.length);
    return similarity > 0.7;
  }

  //matchingEvaluators:
  sift4MatchingEvaluator(t1, t2) { //matchingEvaluator:sift4MatchingEvaluator
    var similarity = 1 - this.sift4(t1, t2, 5, this.config) / Math.max(t1.length, t2.length);
    return similarity;
  }

  //localLengthEvaluators:
  rewardLengthEvaluator(l) {
    if (l < 1) return l; //0 -> 0
    return l - 1 / (l + 1);  //1 -> 0.5, 2-> 0.66, 9 -> 0.9
  }

  rewardLengthEvaluator2(l) {
    return Math.pow(l, 1.5); // 0 -> 0, 1 -> 1, 2 -> 2.83, 10 -> 31.62
  }

  //transpositionCostEvaluators:
  longerTranspositionsAreMoreCostly(c1, c2) {
    return Math.abs(c2 - c1) / 9 + 1;
  }
}