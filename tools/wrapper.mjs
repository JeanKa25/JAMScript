#!/usr/bin/env zx

import {getBatchArgsWrapper, getJamrunArgsWrapper, getLogArgsWrapper, getJamListArgsWrapper, getJamKillArgsWrapper, getJamTermArgsWrapper} from './parser.mjs'
import { spawnSync } from 'child_process';


endpoint = process.argv;

if (endpoint[0] == "jamrun"){
    command = getJamrunArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jamrun -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    }); 
}

if (endpoint[0] == "jambatch.mjs"){
    command = getBatchArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jambatch -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    });
}

if (endpoint[0] == "jamlog.mjs"){
    command = getLogArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jambatch -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    });
}

if (endpoint[0] == "jamlist.mjs"){
    command = getJamListArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jamlist -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    });
}

if (endpoint[0] == "jamkill.mjs"){
    command = getJamKillArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jamkill -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    });
}

if (endpoint[0] == "jamterm.mjs"){
    command = getJamTermArgsWrapper(process.argv);
    curlCommand = `curl -X POST http://url:3000/jamterm -H "Content-Type: application/json" -d ${command}`;

    spawnSync([curlCommand], {
        stdio: spawnPipe, 
        shell: true       
    });
}