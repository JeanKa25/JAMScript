#!/usr/bin/env zx

// let HOME = os.homedir();
// console.log(HOME)
// let jargs = "--app=test1 --port=1883 --group=1 --data=127.0.0.1:21883  --edge=1 --long=123.7404 --lat=15.1625 --localregistryhost=0 --device"


// let floc = `${HOME}/.jamruns/apps/jt2_test1`
// const p = $`(cd ${floc} && node jstart.js ${jargs})`
// // console.log(p.stdout)

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

let HOME = os.homedir();
console.log(`Home directory: ${HOME}`);

let jargs = ["--app=test1", "--port=1883", "--group=1", "--data=127.0.0.1:21883", "--edge=1", "--long=123.7404", "--lat=15.1625", "--localregistryhost=0", "--device"];

let floc = path.join(HOME, '.jamruns', 'apps', 'jt2_test1');
console.log(`App directory: ${floc}`);

const command = 'node';
const args = ['jstart.js', ...jargs];
const options = {
  cwd: floc,
  stdio: 'inherit'
};

const child = spawn(command, args, options);

// child.on('error', (error) => {
//   console.error(`Error: ${error.message}`);
// });

// child.on('close', (code) => {
//   console.log(`Child process exited with code ${code}`);
// });