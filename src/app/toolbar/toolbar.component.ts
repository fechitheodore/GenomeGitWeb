import { Component, OnInit, Output, EventEmitter } from "@angular/core";

import { UserService } from "../user.service";
import { CommonService } from "../common.service";

import { Router } from "@angular/router";

@Component({
  selector: "app-toolbar",
  templateUrl: "./toolbar.component.html",
  styleUrls: [
    "./toolbar.component.css",
    "../../../public/css/ionicons.min.css",
    "../../../public/css/font-awesome.min.css",
    "../../../public/css/animate.css",
    "../../../public/css/custom.css"
  ], providers: [CommonService]
})

// interface Project {
//   title: string;
//   id: string;
// }

export class ToolbarComponent implements OnInit {
  isSigned = false;
  // firstName: string;
  // lastName: string;
  username: string;
  email: string;
  isOnApp = false;
  hello: string = "hello";

  

  // event emited when the user clicks on the sign up or sign in button
  @Output()
  clicked = new EventEmitter<string>();

  // event emited when the user clicks on the sign out button
  @Output()
  signOut = new EventEmitter<string>();

  @Output()
  toogleEvent = new EventEmitter<string>();

  signInClicked() {
    this.clicked.emit("signIn");
  }
  signUpClicked() {
    this.clicked.emit("signUp");
  }
  profileClicked(){
    // console.log("profile 2 click is clicked");
    this.router.navigateByUrl("/profile");
  }

  // show the user first name and last name in the toolbar
  showUser() {
    // this.firstName = this.userService.getFirstName();
    // this.lastName = this.userService.getLastName();
    this.username = this.userService.getusername();
    this.email = this.userService.getEmail();
    this.isSigned = true;
    // Need to create getUserName() in user.service once Ya has userName integrated
    // this.userName = this.userService.getUserName();
    // Get selected project
    
  }

  constructor(private userService: UserService, private router: Router, private commonService: CommonService) {
    const that = this;
    router.events.subscribe(val => {
      const event = <any>val;
      if (event.url === "/app") {
        that.isOnApp = true;
      } else if (event.url === "/") {
        that.isOnApp = false;
      }
    });
  }

  ngOnInit() {
    // Trying to get toolbars icon to show up when url contains "app", not only when signed in
    const app: string = "app";
    if (this.router.url.includes(app)) {
      this.isOnApp = true;
    }

  }

  signOutClicked() {
    this.userService.signOut();
    this.isSigned = false;
    this.signOut.emit("signOut");
  }

  toogle() {
    this.toogleEvent.emit();
  }

  goToApp() {
    this.isOnApp = true;
  }

  loadHome(){
    // console.log("This function should show the browse component and search component.")
    this.isOnApp = false;
    this.router.navigateByUrl("");
  }

  plotClicked(){
    this.router.navigateByUrl("/app");
    // need to change url in address bar?
  }

}
