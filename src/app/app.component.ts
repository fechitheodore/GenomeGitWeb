import { Component, ViewChild, OnInit, AfterViewInit } from "@angular/core";
import { Router } from "@angular/router";

import { UserService } from "./user.service";
import { AssemblyListComponent } from "./assembly-list/assembly-list.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  title = "app";

  triedCookies = false;
  message = null;
  componentDisplayed: any;

  @ViewChild("signPanel") signPanel;
  @ViewChild("toolbar") toolbar;
  @ViewChild("router") routerComponent;
  @ViewChild("assemblyList") AssemblyListComponent;

  constructor(private userService: UserService, private router: Router) {}

  onToolarClick(event) {
    // when the users clicks on the sign up or sign in button in the toolbar
    if (event === "signIn") {
      this.signPanel.openSignInPanel();
    } else if (event === "signUp") {
      this.signPanel.openSignUpPanel();
    }
  }

  onPanelClick(event) {
    if (event === "signIn") {
      this.signPanel.openSignInPanel();
    } else if (event === "resetpassword") {
      this.signPanel.openResetPanel();
    } else if (event === "forgetpassword") {
      this.signPanel.openForgetPanel();
    }
  }

  ngOnInit() {
    if (this.userService.hasCookies()) {
      // if there are cookies...
      const res = this.userService.signInWithCookies(); // try to sign in using them
      const that = this;

      res.subscribe(
        data => {
          // wait for the server response

          this.triedCookies = true;
          if (data.message === "Success") {
            // if the sign in was successfull
            that.userService.setUser(data.data); // store the user information
            // that.userService.selectedProject;
            // console.log(that.userService.selectedProject);
            that.onSignIn(); // render the interface for connected users
            // this.biocircos.create_msgs(['Create or Select a Project']);
          }
        },
        error => {
          // if there was an error (ex: invalid credentials), just display the normal view for non sign in users
          this.triedCookies = true;
        }
      );
    } else {
      // same shit here
      this.triedCookies = true;
    }
  }

  onSignIn() {
    this.toolbar.showUser();

    if (window.location.href.includes("/app") && window.location.href.length > 25) {
      this.router.navigateByUrl("/app");
      this.componentDisplayed.projectPanel.getProjects();
    } else if (window.location.href.includes("/app") && window.location.href.length < 25){
      this.router.navigateByUrl("/app");
      this.componentDisplayed.projectPanel.getProjects();
    } else {
      this.router.navigateByUrl("/app");
    }
  }

  guest() {
    if (window.location.href.includes("/app")) {
      this.componentDisplayed.projectPanel.getProjects();
    }
  }

  onSignOut() {
    this.router.navigateByUrl("/");
  }

  onActivate(componentRef) {
    this.componentDisplayed = componentRef;
  }

  toogle() {
    this.componentDisplayed.toogleProjectPanel();
  }
}