import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";

import { CookieService } from "ngx-cookie-service";
import { environment } from "./../environments/environment";

// Service used to sign in, sign up and store the user's data

interface Project {
  title: string;
  id?: string;
  _id?: string;
  description?: string;
  files?: string[];
  users?: string[];
  public?: boolean;
  issues?: [any];
}

@Injectable()
export class UserService {
  username: string;
  email: string;
  password: string;
  newpassword: string;
  isSignedIn = false;
  token: string;
  id: string;
  selectedProject: Project = null;
  projects: Array<Project>;

  constructor(private http: HttpClient, private cookieService: CookieService) {}

  signIn(username: string, password: string): Observable<any> {
    const url =
      environment.host +
      "signin?username=" +
      username +
      "&password=" +
      password;
    return this.http.get(url); // sends a request to sign in to the server
  }

  signInWithCookies(): Observable<any> {
    const url =
      environment.host +
      "signin?username=" +
      this.cookieService.get("username") +
      "&token=" +
      this.cookieService.get("token");
    return this.http.get(url);
  }

  signUp(username: string, email: string, password: string): Observable<any> {
    const url =
      environment.host +
      "signup?username=" +
      username +
      "&email=" +
      email +
      "&password=" +
      password;
    return this.http.get(url);
  }

  resetpassword(
    username: string,
    password: string,
    newpassword: string
  ): Observable<any> {
    const url =
      environment.host +
      "resetpassword?username=" +
      username +
      "&password=" +
      password +
      "&newpassword=" +
      newpassword;
    return this.http.get(url);
  }

  forgetpassword(email: string): Observable<any> {
    const url = environment.host + "forgetpassword?email=" + email;
    return this.http.get(url);
  }

  addUsersToProject(emails, projectId: string): Observable<any> {
    emails = JSON.stringify(emails);
    const url =
      environment.host +
      "addUsersToProject?emails=" +
      emails +
      "&project=" +
      projectId;
    return this.http.get(url);
  }

  // once the server has returned the sign up data, store them in the service and create cookies so that the user can auto sign in later
  setUser(data) {
    this.username = data.username;
    this.email = data.email;
    this.token = data.token;
    this.id = data._id;
    this.isSignedIn = true;

    this.cookieService.set("username", this.username);
    this.cookieService.set("email", this.email);
    this.cookieService.set("token", this.token);
    this.cookieService.set("id", this.id);
  }
  getUser(email) {
    // var url = environment.host+'signin?email='+this.cookieService.get('email')+'&token='+this.cookieService.get('token');
  }
  getusername() {
    return this.username;
  }
  getEmail() {
    return this.email;
  }
  getIsSignedIn() {
    return this.isSignedIn;
  }
  getToken() {
    return this.token;
  }
  getID() {
    return this.id;
  }
  getProject() {
    return this.selectedProject;
  }

  hasCookies() {
    // check if there are cookies saved for the application
    if (this.cookieService.get("token")) {
      return true;
    } else {
      return false;
    }
  }

  signOut() {
    // remove the cookies and change the signedIn state to false
    // this.cookieService.delete( 'firstName');
    // this.cookieService.delete( 'lastName');
    this.cookieService.delete("username");
    this.cookieService.delete("email");
    this.cookieService.delete("token");
    this.cookieService.delete("id");
    this.isSignedIn = false;
  }
}
