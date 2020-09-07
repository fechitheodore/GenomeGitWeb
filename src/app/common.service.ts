import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { Assembly } from "./assembly-list/assembly-list.model";
import { Subject } from "rxjs/Subject";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class CommonService {
  public assemblyList: Assembly[];
  public add_subject = new Subject<String>();
  private assembliesUrl = "/api/searchAssemblies";

  constructor(private http: Http) {
    this.assemblyList = [];
  }

  functionName(userName: string, projectName: string){
    var config = {params: {uName: userName, pName: projectName}};
    return this.http.get("/api/functionName", config);
  }

  getGenomes() {
    return this.http.get("/api/getGenomes", {});
  }

  getUsers() {
    return this.http.get("/api/getUsers", {})
  }

  getGenome(id: string) {
    var config = { params: { s: id } };
    return this.http.get("/api/getGenome", config);
  }

  getIssues(projectId: string){
    var config = {params: {projectID: projectId}};
    return this.http.get("/api/getIssues", config);
  }

  updateProject(title: string, user: string, publicPrivate: boolean){
    var config = {params: {a: title, b: user, c: publicPrivate}};
    // console.log("updateProject function called in commonService: ", config);
    return this.http.get("/api/updateProject", config);
  }

  updateIssue(solved: boolean, projectID: string, issueID: string){
    var config = {params: {a: solved, b: projectID, c: issueID}};
    return this.http.get("/api/updateIssue", config);
  }

  issueSolved(projectId: string, issueId: string, solved: boolean, issue: number){
    console.log(projectId, issueId, solved, issue);
    var config = {params: {projectID: projectId, issueID: issueId, solved: solved, issue: issue}};
    return this.http.get("/api/issueSolved", config);
  }

  submitIssue(title: string, comment: string, id: string, userName: string){
    // console.log("working at commonservice");
    var config = {params: {a: title, b: comment, c: id, d: userName}};
    return this.http.get("/api/submitIssue", config);
  }

  editDescription(Description: string, projectid: string){
    var config = {params: {a: Description, b: projectid}};
    return this.http.get("/api/updateDescription", config);
  }

  getProjects() {
    // console.log("getProjects function called, heres the response: ", this.http.get("/api/getProjects", {}));
    return this.http.get("/api/getProjects", {});
  }

  getProject(projectid: string){
    var config = {params: {projectID: projectid}};
    return this.http.get("/api/getProject", config);
  }

  getCollaborators(projectId, userIds){
    var config = {params: {projectID: projectId, userIDs: userIds}};
    return this.http.get("/api/getProjectCollaborators", config);
  }

  getUserId(username){
    var config = {params: {userName: username}};
    return this.http.get("/api/getUserID", config);
  }

  addCollaborator(projectId, userId, userName){
    var config = {params: {projectID: projectId, userID: userId, username: userName}};
    return this.http.get("/api/addCollaborator", config);
  }
}
