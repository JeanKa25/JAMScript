#!/usr/bin/env zx

import commandLineArgs from 'command-line-args';
import {getBatchArgsWrapper, getJamrunArgsWrapper, getLogArgsWrapper, getJamListArgsWrapper, getJamKillArgsWrapper, getJamTermArgsWrapper} from './parser.mjs'
import { spawnSync } from 'child_process';
const { exec } = require('child_process');


let endpoint = process.argv;

if (endpoint[3] == "jamrun"){
    let command = getJamrunArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamrun -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd }); 
}

if (endpoint[3] == "jambatch.mjs"){
    let command = getBatchArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jambatch -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd });

}

if (endpoint[3] == "jamlog"){
    let command = getLogArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamlog -H "Content-Type: application/json" -d ${command}`;
    
    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd });
}

if (endpoint[3] == "jamlist"){
    let command = getJamListArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamlist -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd });
}

if (endpoint[3] == "jamkill"){
    let command = getJamKillArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamkill -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd });

}

if (endpoint[3] == "jamterm"){
    let command = getJamTermArgsWrapper(endpoint.slice(4));
    let curlCommand = `curl -X POST http://url:3000/jamterm -H "Content-Type: application/json" -d ${command}`;

    let cwd = '/root/capstone/JAMScript/tools/';
    const childProcess = exec(curlCommand, { cwd });
}