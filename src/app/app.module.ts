import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HttpClientModule } from "@angular/common/http";
import { HttpModule } from "@angular/http";

import { UserService } from "./user.service";
import { LoadingService } from "./loading.service";
import { ParserService } from "./parser.service";
import { CookieService } from "ngx-cookie-service";

import { AppComponent } from "./app.component";
import { WebcircosComponent } from "./webcircos/webcircos.component";
import { WelcomeComponent } from "./welcome/welcome.component";
import { ToolbarComponent } from "./toolbar/toolbar.component";
import { ProjectPanelComponent } from "./webcircos/project-panel/project-panel.component";
import { BiocircosComponent } from "./webcircos/biocircos/biocircos.component";
import { CircosControlsComponent } from "./webcircos/circos-controls/circos-controls.component";
import { ShareDialogComponent } from "./dialog-container/share-dialog/share-dialog.component";
import { CustomisationPanelComponent } from "./webcircos/customisation-panel/customisation-panel.component";

import { ButtonModule } from "primeng/button";
import { SidebarModule } from "primeng/sidebar";
import { SignPanelComponent } from "./sign-panel/sign-panel.component";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { MessagesModule } from "primeng/messages";
import { MessageModule } from "primeng/message";
import { PanelModule } from "primeng/panel";
import { DropdownModule } from "primeng/dropdown";
import { DialogModule } from "primeng/dialog";
import { InputTextareaModule } from "primeng/inputtextarea";
import { DataTableModule } from "primeng/datatable";
import { TableModule } from "primeng/table";
import { FileUploadModule } from "primeng/fileupload";
import { MenuModule } from "primeng/menu";
import { MenuItem } from "primeng/api";
import { CardModule } from "primeng/card";
import { ProgressBarModule } from "primeng/progressbar";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { DragulaModule } from "ng2-dragula/ng2-dragula";
import { CheckboxModule } from "primeng/checkbox";
import { AngularFontAwesomeModule } from "angular-font-awesome";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { NouisliderModule } from "ng2-nouislider";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MultiSelectModule } from "primeng/multiselect";
import { AccordionModule } from "primeng/accordion";
import { ToastrModule } from "ngx-toastr";
import { PickListModule } from "primeng/picklist";
import { GrowlModule } from "primeng/growl";
import { RadioButtonModule } from "primeng/radiobutton";
import { SliderModule } from "primeng/slider";
import { ToggleButtonModule } from "primeng/togglebutton";
import { TooltipModule } from "primeng/tooltip";
import { RouterModule, Routes } from "@angular/router";
import { GenoverseComponent } from "./genoverse/genoverse.component";
import { LinkTableComponent } from "./webcircos/project-panel/link-table/link-table.component";
import { DialogContainerComponent } from "./dialog-container/dialog-container.component";
import { ImportDialogComponent } from "./dialog-container/import-dialog/import-dialog.component";
import { CdkTreeNestedExample } from "./webcircos/file-management/cdk-tree-nested-example";
import {
  MatTree,
  MatTreeNode,
  MatNestedTreeNode
} from "@angular/material/tree";
import { DemoMaterialModule } from "./material-module";
import { MatNativeDateModule } from "@angular/material";
import { AssemblyListComponent } from "./assembly-list/assembly-list.component";
import { from } from "rxjs";
import { AutocompleteFilterExampleComponent } from "./autocomplete-filter-example/autocomplete-filter-example.component";
import { ProfileComponent } from './profile/profile.component';
import { CommonService } from "./common.service";

const appRoutes: Routes = [
  { path: "app", component: WebcircosComponent },
  { path: "app/:id", component: WebcircosComponent },
  { path: "", component: WelcomeComponent},
  {path: "profile", component: ProfileComponent}
];

@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ToolbarComponent,
    SignPanelComponent,
    ProjectPanelComponent,
    BiocircosComponent,
    ShareDialogComponent,
    CircosControlsComponent,
    CustomisationPanelComponent,
    WebcircosComponent,
    GenoverseComponent,
    LinkTableComponent,
    DialogContainerComponent,
    ImportDialogComponent,
    MatTree,
    MatTreeNode,
    MatNestedTreeNode,
    CdkTreeNestedExample,
    AssemblyListComponent,
    AutocompleteFilterExampleComponent,
    ProfileComponent
  ],
  imports: [
    DemoMaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    BrowserModule,
    DragulaModule,
    HttpClientModule,
    HttpModule,
    ButtonModule,
    SidebarModule,
    BrowserAnimationsModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    MessagesModule,
    MessageModule,
    PanelModule,
    DropdownModule,
    DialogModule,
    InputTextareaModule,
    TableModule,
    FileUploadModule,
    MenuModule,
    CardModule,
    NouisliderModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    CheckboxModule,
    AngularFontAwesomeModule,
    PickListModule,
    GrowlModule,
    RadioButtonModule,
    SliderModule,
    ToggleButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSidenavModule,
    MultiSelectModule,
    AccordionModule,
    ToastrModule.forRoot(),
    RouterModule.forRoot(appRoutes, {onSameUrlNavigation: 'reload'})
  ],
  entryComponents: [CdkTreeNestedExample],
  providers: [
    UserService,
    ParserService,
    CookieService,
    LoadingService,
    ConfirmationService,
    CommonService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
