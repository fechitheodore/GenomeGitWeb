import { Component, OnInit, ViewChild } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UserService } from '../../user.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.css']
})




export class ShareDialogComponent implements OnInit {


  @ViewChild('shareDialogRoot') shareDialogRoot;

  users: Array<any> = [];
  matchingUsers: Array<any> = [];
  display: boolean = false;
  searchEntry: string;
  selectedMatchingUsers;
  selectedProjectUsers;
  project:string;

  constructor(private userService: UserService, private http: HttpClient) { }

  ngOnInit() {

  }

  open(project: string) {
    this.project=project;
    this.display = true;
    this.getUsers(project);
  }


  getUsers(project: string) {
    const url = environment.host+"getProjectUsers?project=" + project;
    this.http.get(url).subscribe((data: Array<any>) => {
      this.users = data;
    },
      error => {
        console.log(error);
      });
  }

  getMatchingUsers(input: string) {
    if (input.length > 0) {
      const url = environment.host+"getMatchingUsers?input=" + input;
      this.http.get(url).subscribe((data: Array<any>) => {
        this.matchingUsers = data;
      },
        error => {
          console.log(error);
        });
    }else{
      this.matchingUsers=[];
    }

  }

  onSearchChange(input) {
    this.getMatchingUsers(input);
  }

  inviteUsers(){
    const url = environment.host+"inviteUsers";
    this.http.post(url, { project: this.project, user: this.selectedMatchingUsers.id}).subscribe((data: Array<any>) => {
      this.users = this.users.concat(this.selectedMatchingUsers);
      this.searchEntry="";
      this.selectedMatchingUsers=[];
      this.matchingUsers=[];
    },
      error => {
        console.log(error);
      });

  }

  removeUsers(){
    const url = environment.host+"removeUsersFromProject";

    var users=[];
    for(var i=0; i<this.selectedProjectUsers.length; i++){
      if(this.selectedProjectUsers[i].id!=this.userService.getID()){
        users.push(this.selectedProjectUsers[i].id);
      }
    }

    this.http.post(url, { project: this.project, users: JSON.stringify(users)}).subscribe((data: Array<any>) => {

      for(var i=0; i<this.selectedProjectUsers.length; i++){
          this.users.splice(this.users.indexOf(this.selectedProjectUsers[i]), 1);

      }
      this.selectedProjectUsers=[];

    },
      error => {
        console.log(error);
      });
  }
}
