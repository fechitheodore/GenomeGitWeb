
# GenomeGitWeb

GenomeGitWeb is a repository hosting site for [GenomeGit](https://github.com/fechitheodore/GenomeGit3.1), a DVCS for genomic data. The goal of this tool is to allow users to visually explore the data stored in a GenomeGit repository, including the changes between versions of an assembly. It also enhanes the project management aspect of GenomeGit by allowing registered users to create projects, mamage the visibility of the projects, invite collaborators, and add descriptiions or subit issues to a project. 

## Installation
After downloading the project, execute the following commands:
* ```npm install -g @angular/cli```
* ```npm install```
* ```ng build```
* ```npm start```
The application should now be available at http://localhost:3000 (with the developer version at http://localhost:4200).

## Visualisation
![BioCircos plot](https://github.com/fechitheodore/GenomeGitWeb/blob/master/image/comparison_plot.png)

WebCircos is the main visualisation tool used by GenomeGitWeb. It supports the visualisation of fasta, GFF, and VCF files from GenomeGit's repository to create circos plots where each file type forms a track. GenomeGitWeb also uses information from the alignment step in GenomeGit's lift-over to create a link track which links identical sequences between assembly versions.
Data from a single commit/assembly version can be visualised by selecting a fasta file along with another file type. Data from different commits/assembly versions can also be visualised at the same time for comparison.
By clicking on a GFF track, users can carry out more in-depth data exploration using a lightweight genome browser [Genoverse].

## Project Management
![Homepage](https://github.com/fechitheodore/GenomeGitWeb/blob/master/image/Homepage.png)

GenomeGitWeb can be used in a team setting for collaboration and management purposes or as a public repository for browsing projects. Users can search for projects to visualise on the homepage by using the search box or by clicking on the popular projects listed. Projects can also be visualised by selecting them from the dropdown menu on the "Plot" page.

### Making an account
![Make account](https://github.com/fechitheodore/GenomeGitWeb/blob/master/image/SignIn.png)

Users can make an account by clicking on the 'Sign up' button on the homepage in the top right corner and filling out the form, inputting a user name, password, and email.

### Creating a New Project
![BioCircos plot](https://github.com/fechitheodore/GenomeGitWeb/blob/master/image/createProject.png)

Only registered users are able to make new projects. Clicking the plus button on the "Plot" page brings up a dialog box where the project name, visibility (public or private), and an optional description can be input. Once the project has been created on GenomeGitWeb, the user can push their GenomeGit repository to GenomeGitWeb.

### Managing Projects
![Profile page](https://github.com/fechitheodore/GenomeGitWeb/blob/master/image/profileAccess.png)

On the profile page, users can view details about all the projects they are part of. By navigating through the tabs, they can edit the project description, view files in the project, submit or resolve issues, and add new collaborators to a project.



# Acknowledgements
This project was initially developed by Pramod Errolla, Joshua Fleming, Dylan Mead, Anton Spadar, and Ya Zuo.

