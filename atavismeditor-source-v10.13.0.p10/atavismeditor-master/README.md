# AtavismEditor

This project was build using [Electron](https://www.electronjs.org/docs/tutorial/development-environment) and [Angular](https://angular.io/guide/setup-local) latest versions.

NodeJs@12 and npm@6.4 is necessary to be installed.


## Development server

To install all dependencies just run `yarn`.

To run application locally `yarn start`.

Locally application start as browser app, so there is no native access electron solutions.

To start application in native windows run `yarn electron:local`. Minus of that is that app is running without live reloading. 

# Important thing about branches
Current master contain latest version of application. For now that is version `10.2.0`

Previous version is on branch: `production/v10.1.0`.

Important is never update production branch with master.

## Update changes

We work based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Based on it we can have well prepared CHANGELOG.md with latest changes made for app.

Branch names should be base on conventional commits name too.

To update version of app needs to run manually one of the command:
 - Patch: `yarn version`

## Build application release

To build application release for each OS:
 - Mac OS: `yarn mac:build`
 - Linux OS: `yarn linux:build`
 - Windows OS: `yarn win:build`
 
Application build is located in folder `release`. 

Important for build application is run commands above, because it prepare, copy and update versions of application package.
