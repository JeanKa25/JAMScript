#!/usr/bin/env zx

import commandLineArgs from 'command-line-args';
import {getBatchArgsWrapper, getJamrunArgsWrapper, getLogArgsWrapper, getJamListArgsWrapper, getJamKillArgsWrapper, getJamTermArgsWrapper} from './parser.mjs'
import { spawnSync } from 'child_process';
const { exec } = require('child_process');


import {
    body_1,
    header_1,
    header_2,
    body_sec,
    body_2,
    body_sec_warning,
    body_2_bold,
} from "./chalk.mjs";
let args;

function show_usage() {
    const usageMessage = `
    ${header_1(`JAMTools 2.0`)}

    ${header_2(`wrapper`)}${body_1(
        ` --  a tool to run curl commands in a friendly way`
    )}

    ${header_1(`SYNOPSIS`)}

    Usage: wrapper 


    --- wrapper.mjs endpoint [arguments to pass]

    `;
    
    console.log(usageMessage);
}

//capture the endpoints arguments
let endpoint_args = process.argv;

// for jamrun, no need to provide the file name, jt1.jxe is used.
// ex: zx wrapper.mjs jamrun --app="DEMO"
if (endpoint_args[3] == "jamrun"){
    // here we will work with the arguments
    let command = getJamrunArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://localhost:3000/jamrun -H "Content-Type: application/json" -d '${command}'`;
    //console.log(curlCommand);

    let cwd = '/Users/andreisandor/Desktop/McGill/Capstone/code/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      }); 

    
}

if (endpoint_args[3] == "jambatch.mjs"){
    let command = getBatchArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jambatch -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });

}

if (endpoint_args[3] == "jamlog"){
    let command = getLogArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamlog -H "Content-Type: application/json" -d ${command}`;
    
    let cwd = '/root/capstone/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
}

if (endpoint_args[3] == "jamlist"){
    let command = getJamListArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamlist -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
}

if (endpoint_args[3] == "jamkill"){
    let command = getJamKillArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamkill -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });

}

if (endpoint_args[3] == "jamterm"){
    let command = getJamTermArgsWrapper(endpoint_args.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamterm -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/'; //To change
    const childProcess = exec(curlCommand, { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
      });
}