import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { UserService } from '../user.service';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';





export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}


@Component({
  selector: 'sign-panel',
  templateUrl: './sign-panel.component.html',
  styleUrls: ['./sign-panel.component.css']
})
export class SignPanelComponent implements OnInit {

  emailFormControlSignIn = new FormControl('', [
    Validators.required,
    Validators.email
  ]);
  passwordFormControlSignIn = new FormControl('', [
    Validators.required,
  ]);
  usernameFormControlSignIn = new FormControl('', [
    Validators.required,

  ]);
  
//sign up
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);
  passwordFormControlSignUp = new FormControl('', [
    Validators.required,
  ]);
  usernameFormControlSignUp = new FormControl('', [
    Validators.required,
  ]);
  // verifyFormControl = new FormControl('', [
  //   Validators.required,
  // ]);


//Reset password
usernameFormControlReset = new FormControl('', [
  Validators.required,
]);
passwordFormControlReset = new FormControl('', [
  Validators.required,
]);
newpasswordFormControlReset = new FormControl('', [
  Validators.required,
]);

//forget password 
emailFormControlForget = new FormControl('', [
  Validators.required,
  //Validators.email
]);

  // firstnameFormControl = new FormControl('', [
  //   Validators.required,
  // ]);
  // lastnameFormControl = new FormControl('', [
  //   Validators.required,
  // ]);

  matcher = new MyErrorStateMatcher();


  public signInShown: boolean = false;
  public signUpShown: boolean = false;
  public resetShown: boolean = false;
  public forgetShown: boolean = false;


  visibilityMessageSignIn: string = "hidden";
  visibilityMessageSignUp: string = "hidden";
  // visibilityMessageverifyemailMessage: string = "hidden";
  visibilityMessagereset : string = "hidden";
  visibilityMessageforget : string = "hidden";

  errorMessageSignup: string = "hidden";
  errorMessageSignupText: string = "";
  successMessageSignup: string = "hidden";

  errorMessageReset: string = "hidden";

  @Output()
  signedIn = new EventEmitter<string>();

  @Output()
  clicked = new EventEmitter<string>();

  @ViewChild('signInMessage') signInMessage;
  @ViewChild('signUpMessage') signUpMessage;
  @ViewChild('resetMessage') resetMessage;
  @ViewChild ('forgetMessage') forgetMessage;
  // @ViewChild('verifyemailMessage') verifyemailMessage;

  constructor(private userService: UserService) { }

  signInClicked() {
    this.clicked.emit('signIn');
  }
  resetClicked() {
    this.clicked.emit('resetpassword');
  }
  forgetClicked() {
    this.clicked.emit('forgetpassword');
  }


  openSignInPanel() {
    this.signInShown = true;
    this.signUpShown = false;
    this.resetShown = false;
    this.forgetShown = false;
  }

  openSignUpPanel() {
    this.signUpShown = true;
    this.signInShown = false;
    this.resetShown = false;
    this.forgetShown = false;
  }

  openResetPanel(){
    this.resetShown = true;
    this.signInShown = false;
    this.signUpShown = false;
    this.forgetShown = false;
  }
  openForgetPanel(){
    this.forgetShown = true;
    this.signInShown = false;
    this.signUpShown = false;
    this.resetShown = false;
  }




  //when the user clicks on the button to sign in in the right panel
  submitSignIn() {

    var res = this.userService.signIn(this.usernameFormControlSignIn.value, this.passwordFormControlSignIn.value); //call the sign in function in the user service
    var that = this;

    res.subscribe(data => { //wait for the response

      if (data.message == "Success") { //if the email and password are correct
        that.signInMessage.text = "Connection successful";
        that.signInMessage.severity = "success";
        that.visibilityMessageSignIn = "visible";

        this.userService.setUser(data.data); //store the user data
        this.signedIn.emit('signedIn'); //emit a signal to notify that the user has signed in


        setTimeout(function() {
          // console.log("aaaa")
          that.visibilityMessageSignIn = "hidden";
          that.signInShown = false;
        }, 600);
      } else {

        that.signInMessage.text = data.message;
        that.signInMessage.severity = "error";
        that.visibilityMessageSignIn = "visible";
        setTimeout(function() {
          // console.log("bbbb")
          console.log("error message:" + data.message);
          that.visibilityMessageSignIn = "hidden";
        }, 3000);
      }

    },

      error => {
        that.signInMessage.text = "Connection error";
        that.signInMessage.severity = "error";
        that.visibilityMessageSignIn = "visible";
        setTimeout(function() {
          that.visibilityMessageSignIn = "hidden";
        }, 3000);

      });

  }

  submitSignUp(event) {

    var res = this.userService.signUp(this.usernameFormControlSignUp.value, this.emailFormControl.value, this.passwordFormControlSignUp.value);
    const that = this;

    res.subscribe(data => {

      if (data.message == "Success") {
        that.signUpMessage.text = "Success";
        that.signUpMessage.severity = "success";
        that.visibilityMessageSignUp = "visible";
        // setTimeout(function() {
        //   that.visibilityMessageSignUp = "hidden";
        //   this.usernameFormControlSignIn.setValue(this.usernameFormControlSignUp);
        //   this.passwordFormControlSignIn.setValue(this.passwordFormControlSignUp);
        //   that.submitSignIn();
        //   that.signUpShown = false;
        // }, 1000);
 
      } else {
        this.showSignUpError(data.message, 3000);
      }
    },
      error => {
        this.showSignUpError("Connection error", 3000);
      }
    );
}


submitreset(){

  var res = this.userService.resetpassword(this.usernameFormControlReset.value, this.passwordFormControlReset.value, this.newpasswordFormControlReset.value);
  const that = this;

  res.subscribe(data => {

    if (data.message == "Success") {
      that.resetMessage.text = "Success";
      that.resetMessage.severity = "success";
      that.visibilityMessagereset = "visible";

      // setTimeout(function() {
      //   that.visibilityMessagereset = "hidden";
      //   this.usernameFormControlSignIn.setValue(this.usernameFormControlReset);
      //   this.passwordFormControlSignIn.setValue(this.newpasswordFormControlReset);
      //   that.submitSignIn();
      //   that.resetShown = false;
      // }, 1000);

    } else {

      this.showresetError(data.message, 3000);
        }
  },
    error => {
      this.showresetError("Connection error", 3000);

    }
  );

}


submitforget(event) {

  var res = this.userService.forgetpassword(this.emailFormControlForget.value);
  const that = this;

  res.subscribe(data => {

    if (data.message == "Success") {
      that.forgetMessage.text = "Success";
      that.forgetMessage.severity = "success";
      that.visibilityMessageforget = "visible";
      // setTimeout(function() {
      //   that.visibilityMessageSignUp = "hidden";
      //   this.usernameFormControlSignIn.setValue(this.usernameFormControlSignUp);
      //   this.passwordFormControlSignIn.setValue(this.passwordFormControlSignUp);
      //   that.submitSignIn();
      //   that.signUpShown = false;
      // }, 1000);

    } else {
      this.showforgetError(data.message, 3000);
    }
  },
    error => {
      this.showforgetError("Connection error", 3000);
    }
  );
}

showforgetError(message, timeout) {
  this.forgetMessage.text = message;
  this.forgetMessage.severity = "error";
  this.visibilityMessageforget = "visible";
  const that = this;
  setTimeout(function() {
    that.visibilityMessageforget = "hidden";
  }, timeout)
}

showresetError(message, timeout) {
  this.resetMessage.text = message;
  this.resetMessage.severity = "error";
  this.visibilityMessagereset = "visible";
  const that = this;
  setTimeout(function() {
    that.visibilityMessagereset = "hidden";
  }, timeout)
}


  showSignUpError(message, timeout) {
    this.signUpMessage.text = message;
    this.signUpMessage.severity = "error";
    this.visibilityMessageSignUp = "visible";
    const that = this;
    setTimeout(function() {
      that.visibilityMessageSignUp = "hidden";
    }, timeout)
  }
  // showverifyemailError(message, timeout) {
  //   this.verifyemailMessage.text = message;
  //   this.verifyemailMessage.severity = "error";
  //   this.visibilityMessageverifyemailMessage = "visible";
  //   const that = this;
  //   setTimeout(function() {
  //     that.visibilityMessageSignUp = "hidden";
  //   }, timeout)
  // }

  ngOnInit() {
  }

}


// import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
// import { UserService } from '../user.service';
// import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
// import { ErrorStateMatcher } from '@angular/material/core';





// export class MyErrorStateMatcher implements ErrorStateMatcher {
//   isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
//     const isSubmitted = form && form.submitted;
//     return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
//   }
// }


// @Component({
//   selector: 'sign-panel',
//   templateUrl: './sign-panel.component.html',
//   styleUrls: ['./sign-panel.component.css']
// })
// export class SignPanelComponent implements OnInit {

//   emailFormControlSignIn = new FormControl('', [
//     Validators.required,
//     //Validators.email
//   ]);
//   passwordFormControlSignIn = new FormControl('', [
//     Validators.required,
//   ]);

//   emailFormControlSignUp = new FormControl('', [
//     Validators.required,
//     Validators.email
//   ]);
//   passwordFormControlSignUp = new FormControl('', [
//     Validators.required,
//   ]);

//   firstnameFormControl = new FormControl('', [
//     Validators.required,
//   ]);
//   lastnameFormControl = new FormControl('', [
//     Validators.required,
//   ]);

//   matcher = new MyErrorStateMatcher();


//   public signInShown: boolean = false;
//   public signUpShown: boolean = false;


//   visibilityMessageSignIn: string = "hidden";
//   visibilityMessageSignUp: string = "hidden";


//   errorMessageSignup: string = "hidden";
//   errorMessageSignupText: string = "";
//   successMessageSignup: string = "hidden";


//   @Output()
//   signedIn = new EventEmitter<string>();

//   @ViewChild('signInMessage') signInMessage;
//   @ViewChild('signUpMessage') signUpMessage;

//   constructor(private userService: UserService) { }

//   openSignInPanel() {
//     this.signInShown = true;
//   }

//   openSignUpPanel() {
//     this.signUpShown = true;
//   }

//   //when the user clicks on the button to sign in in the right panel
//   submitSignIn() {
//     console.log("submitSignIn triggered")

//     var res = this.userService.signIn(this.emailFormControlSignIn.value, this.passwordFormControlSignIn.value); //call the sign in function in the user service
//     var that = this;
//     console.log("console loggin res (this.userService.signIn(this.emailFormControlSignIn.value, this.passwordFormControlSignIn.value)): ", res);

//     res.subscribe(data => { //wait for the response
//       console.log(data.message);

//       if (data.message == "Success") { //if the email and password are correct
//         that.signInMessage.text = "Connexion successful";
//         that.signInMessage.severity = "success";
//         that.visibilityMessageSignIn = "visible";

//         this.userService.setUser(data.data); //store the user data
//         this.signedIn.emit('signedIn'); //emit a signal to notify that the user has signed in


//         setTimeout(function() {
//           console.log("aaaa")
//           that.visibilityMessageSignIn = "hidden";
//           that.signInShown = false;
//         }, 600);
//       } else {

//         that.signInMessage.text = data.message;
//         that.signInMessage.severity = "error";
//         that.visibilityMessageSignIn = "visible";
//         setTimeout(function() {
//           console.log("bbbb")
//           console.log("error message:" + data.message);
//           that.visibilityMessageSignIn = "hidden";
//         }, 3000);
//       }

//     },

//       error => {
//         that.signInMessage.text = "Connection error";
//         that.signInMessage.severity = "error";
//         that.visibilityMessageSignIn = "visible";
//         setTimeout(function() {
//           that.visibilityMessageSignIn = "hidden";
//         }, 3000);

//       });

//   }

//   submitSignUp(event) {

//       var res = this.userService.signUp(this.firstnameFormControl.value, this.lastnameFormControl.value, this.emailFormControlSignUp.value, this.passwordFormControlSignUp.value);
//       const that = this;

//       res.subscribe(data => {

//         if (data.message == "Success") {
//           that.signUpMessage.text = "Success";
//           that.signUpMessage.severity = "success";
//           that.visibilityMessageSignUp = "visible";
//           setTimeout(function() {
//             that.visibilityMessageSignUp = "hidden";
//             this.emailFormControlSignIn.setValue(this.emailFormControlSignUp);
//             this.passwordFormControlSignIn.setValue(this.passwordFormControlSignUp);
//             that.submitSignIn();
//             that.signUpShown = false;
//           }, 1000);

//         } else {
//           this.showSignUpError(data.message, 3000);
//         }
//       },
//         error => {
//           this.showSignUpError("Connection error", 3000);
//         }
//       );
//   }

//   showSignUpError(message, timeout) {
//     this.signUpMessage.text = message;
//     this.signUpMessage.severity = "error";
//     this.visibilityMessageSignUp = "visible";
//     const that = this;
//     setTimeout(function() {
//       that.visibilityMessageSignUp = "hidden";
//     }, timeout)
//   }

//   ngOnInit() {
//   }

// }
