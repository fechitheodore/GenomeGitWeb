// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  host:"http://localhost:3000/",
  colorPalette: ['#44B3C2', '#F1A94E', '#E45641', '#5D4C46', '#7B8D8E', '#F2EDD8'],
  parserSleep: 2000,
  gitDirectory: ""
};
