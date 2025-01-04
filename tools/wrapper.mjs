#!/usr/bin/env zx

import commandLineArgs from 'command-line-args';
import fetch from "node-fetch"

// Get the command-line arguments
const endpointArgs = process.argv.slice(3);

// ex: zx wrapper.mjs jamrun jt1.jxe --app="DEMO"
// Validate and process the arguments
if (endpointArgs[0] === "jamrun") {
  const fileName = endpointArgs[1];

  //Index of parameters without value
  const fogArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--fog"));
  const cloudArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--cloud"));
  const deviceArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--device"));
  const bgArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--bg"));
  const oldArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--old"));
  const logArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--log"));
  const verbArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--verb"));
  const valgrindArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--valgrind"));
  const localArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--local"));


  // Index of parameters with value
  const appArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--app="));
  const numArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--num="));
  const dataArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--data="));
  const tagsArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--tags="));
  const locArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--loc="));
  const edgeArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--edge="));
  const remoteArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--remote="));


  if (!fileName || appArgIndex === -1) {
    console.error(
      "Error: Missing required arguments. Usage: zx wrapper.mjs jamrun <file_name> --app=<app_name>"
    );
    process.exit(1);
  }

  // Extract mandatory argument
  const appName = endpointArgs[appArgIndex].split("=")[1]; // Extract app name

  let numName, dataName, tagsName, locName, edgeName, remoteName, fogName, cloudName, deviceName, bgName,oldName, logName, verbName, valgrindName, localName  ;

  // Extract arguments with value if present
  if(numArgIndex === 1) {numName = endpointArgs[numArgIndex].split("=")[1];} // Extract num name
  if(dataArgIndex === 1) {dataName = endpointArgs[dataArgIndex].split("=")[1];} // Extract data name
  if(tagsArgIndex === 1) {tagsName = endpointArgs[tagsArgIndex].split("=")[1];} // Extract tag name
  if(locArgIndex === 1) {locName = endpointArgs[locArgIndex].split("=")[1];} // Extract loc name
  if(edgeArgIndex === 1) {edgeName = endpointArgs[edgeArgIndex].split("=")[1];} // Extract edge name
  if(remoteArgIndex === 1) {remoteName = endpointArgs[remoteArgIndex].split("=")[1];} // Extract remote name


  // Use arguments without value if present
  if(fogArgIndex === 1) {fogName = "fog"}; //fog
  if(cloudArgIndex === 1) {cloudName = "cloud"}; //cloud
  if(deviceArgIndex === 1) {deviceName = "device"}; //device
  if(bgArgIndex === 1) {bgName = "bg"}; //bg
  if(oldArgIndex === 1) {oldName = "old"}; //old
  if(logArgIndex === 1) {logName = "log"}; //log
  if(verbArgIndex === 1) {verbName = "verb"}; //verb
  if(valgrindArgIndex === 1) {valgrindName = "valgrind"}; //valgrind
  if(localArgIndex === 1) {localName = "local"}; //local
  

  // Construct the JSON payload
  const payload = {
    file: fileName,
    app_name: appName,
  };

  // Add the relevent non mandatory arguments for the payload
  if (numName) payload.num = numName; 
  if (dataName) payload.data = dataName;
  if (tagsName) payload.tags = tagsName;
  if (locName) payload.loc = locName;
  if (edgeName) payload.edge = edgeName;
  if (remoteName) payload.remote = remoteName;

  if (fogName) payload.fog = fogName;
  if (cloudName) payload.cloud = cloudName;
  if (deviceName) payload.device = deviceName;
  if (bgName) payload.bg = bgName;
  if (oldName) payload.old = oldName;
  if (logName) payload.log = logName;
  if (verbName) payload.verb = verbName;
  if (valgrindName) payload.valgrind = valgrindName;
  if (localName) payload.local = locName;


  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jamrun";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
}  


// ex: zx wrapper.mjs jambatch jt1.jxe ...
// Validate and process the arguments
if (endpointArgs[0] === "jambatch") {
  const fileName = endpointArgs[1];

  // Index of parameters
  const fogArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--fog="));
  const deviceArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--device="));
  const cloudArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--cloud="));
  const cFileArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--cFile="));
  const fFileArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--fFile="));
  const dFileArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--dFile="));
  const numArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--num="));
  const cLocArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--cLoc="));
  const fLocArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--fLoc="));
  const dLocArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--dLoc="));
  const cEdgeArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--cEdge="));
  const fEdgeArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--fEdge="));
  const dEdgeArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--dEdge="));


  if (!fileName) {
    console.error(
      "Error: Missing required argument. Usage: zx wrapper.mjs jambatch <file_name>"
    );
    process.exit(1);
  }


  let fogName, deviceName, cloudName, cFileName, fFileName, dFileName, numName, cLocName, fLocName, dLocName, cEdgeName, fEdgeName, dEdgeName;

  // Extract the paramters if they are present
  if (fogArgIndex != -1) {fogName = endpointArgs[fogArgIndex].split("=")[1];} // Extract fog
  if (deviceArgIndex != -1) {deviceName = endpointArgs[deviceArgIndex].split("=")[1];} // Extract device
  if (cloudArgIndex != -1) {cloudName = endpointArgs[cloudArgIndex].split("=")[1];} // Extract cloud
  if (cFileArgIndex != -1) {cFileName = endpointArgs[cFileArgIndex].split("=")[1];} // Extract cFile
  if (fFileArgIndex != -1) {fFileName = endpointArgs[fFileArgIndex].split("=")[1];} // Extract fFile
  if (dFileArgIndex != -1) {dFileName = endpointArgs[dFileArgIndex].split("=")[1];} // Extract dFile
  if (numArgIndex != -1) {numName = endpointArgs[numArgIndex].split("=")[1];} // Extract num
  if (cLocArgIndex != -1) {cLocName = endpointArgs[cLocArgIndex].split("=")[1];} // Extract cLoc
  if (fLocArgIndex != -1) {fLocName = endpointArgs[fLocArgIndex].split("=")[1];} // Extract fLoc
  if (dLocArgIndex != -1) {dLocName = endpointArgs[dLocArgIndex].split("=")[1];} // Extract dLoc
  if (cEdgeArgIndex != -1) {cEdgeName = endpointArgs[cEdgeArgIndex].split("=")[1];} // Extract cEdge
  if (fEdgeArgIndex != -1) {fEdgeName = endpointArgs[fEdgeArgIndex].split("=")[1];} // Extract fEdge
  if (dEdgeArgIndex != -1) {dEdgeName = endpointArgs[dEdgeArgIndex].split("=")[1];} // Extract dEdge

  // Construct the JSON payload
  const payload = {
    file: fileName
  };

  // Add to payload if necessary
  if (fogName) payload.fog = fogName;
  if (deviceName) paylog.device = deviceName;
  if (cloudName) payload.cloud = cloudName;
  if (cFileName) payload.cFile = cFileName;
  if (fFileName) payload.fFile = fFileName;
  if (dFileName) payload.dFile = dFileName;
  if (numName) payload.num = numName; 
  if (cLocName) payload.cLoc = cLocName;
  if (fLocName) payload.fLoc = fLocName;
  if (dLocName) payload.dLoc = dLocName;
  if (cEdgeName) payload.cEdge = cEdgeName;
  if (fEdgeName) payload.fEdge = fEdgeName;
  if (dEdgeName) payload.dEdge = dEdgeName;


  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jambatch";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
}


// ex: zx wrapper.mjs jamlog --program=jt1.jxe --app="DEMO" --port=1883
// Validate and process the arguments
if (endpointArgs[0] === "jamlog") {
  // Get index of parameters
  const programArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--program="));
  const appArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--app="));
  const portArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--port="));

  const remoteArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--remote="));
  const tailArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--tail="));
  const cArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--c"));
  const jArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--j"));


  if (programArgIndex === -1 || appArgIndex === -1 || portArgIndex === -1) {
    console.error(
      "Error: Missing required arguments. Usage: zx wrapper.mjs jamlog --program=<program> --app=<app_name> --port=<port>"
    );
    process.exit(1);
  }

  let programName, appName, portName, remoteName, tailName, cName, jName;
  
  // If the parameter is present, extract the relevent information
  programName = endpointArgs[programArgIndex].split("=")[1]; // Extract program name
  appName = endpointArgs[appArgIndex].split("=")[1]; // Extract app name
  portName = endpointArgs[portArgIndex].split("=")[1]; // Extract port name
  if (remoteArgIndex === 1) {remoteName = endpointArgs[remoteArgIndex].split("=")[1];} // Extract remote name
  if (tailArgIndex === 1) {tailName = endpointArgs[tailArgIndex].split("=")[1];} // Extract tail name

  if(cArgIndex === 1) {cName = "c"}; //c
  if(jArgIndex === 1) {jName = "j"}; //j


  // Construct the JSON payload
  const payload = {
    program: programName,
    app: appName,
    port: portName
  };

  // Add the non-mandatory parameters needed for the endpoint
  if (remoteName) payload.remote = remoteName;
  if (tailName) payload.tail = tailName;
  if (cName) payload.c = cName;
  if (jName) payload.j = jName;

  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jamlog";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
} 

// ex: zx wrapper.mjs jamlist
// Validate and process the arguments
if (endpointArgs[0] === "jamlist") {

  //Get parameters without value associated with it
  const helpArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--help"));
  const allArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--all"));
  const monitorArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--monitor"));

  // Get index of parameters with a value associated with it
  const typeArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--type="));
  const dataStoreArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--dataStore="));
  const tmuxidIndex = endpointArgs.findIndex((arg) => arg.startsWith("--tmuxid="));
  const portArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--port="));
  const appArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--app="));
  const progArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--prog="));
  const remomteArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--remote="));


  let helpName, allName, monitorName, typeName,dataStoreName,tmuxName, portName, appName, programName, remoteName;

  // Use non-argument if present
  if(helpArgIndex === 1) {helpName = "help"}; //Help
  if(allArgIndex === 1) {allName = "all"}; //All
  if(monitorArgIndex === 1) {monitorName = "monitor"}; //Monitor

  // If the parameter with value is present, extract the value
  if (typeArgIndex != -1) {typeName = endpointArgs[typeArgIndex].split("=")[1];} // Extract type
  if (dataStoreArgIndex != -1) {dataStoreName = endpointArgs[dataStoreArgIndex].split("=")[1];} // Extract dataStore
  if (tmuxidIndex != -1) {tmuxName = endpointArgs[tmuxidIndex].split("=")[1];} // Extract tmux
  if (portArgIndex != -1) {portName = endpointArgs[portArgIndex].split("=")[1];} // Extract port
  if (appArgIndex != -1) {appName = endpointArgs[appArgIndex].split("=")[1];} // Extract app
  if (progArgIndex != -1) {programName = endpointArgs[progArgIndex].split("=")[1];} // Extract prog
  if (remomteArgIndex != -1) {remoteName = endpointArgs[remomteArgIndex].split("=")[1];} // Extract remote

  // Construct the JSON payload
  let payload = {
  };

  if (helpName) payload.help = helpName;
  if (allName) payload.all = allName;
  if (monitorName) payload.monitor = monitorName;
  if (typeName) payload.type = typeName;
  if (dataStoreName) payload.dataStore = dataStoreName;
  if (tmuxName) payload.tmuxid = tmuxName;
  if (portName) payload.port = portName;
  if (appName) payload.app = appName;
  if (programName) payload.prog = programName;


  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jamlist";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
}

// ex: zx wrapper.mjs jamkill
// Validate and process the arguments
if (endpointArgs[0] === "jamkill") {

  // Get the parameters without value.
  const helpArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--help"));
  const allArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--all"));
  const remoteArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--remote"));

  // Get index of parameter with value if present
  const appArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--app="));
  const progArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--prog="));
  const portArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--port="));


  let helpName, allName, remoteName, typeName,dataStoreName,tmuxName, portName, appName, programName;

  // If parameter without value is present
  if(helpArgIndex === 1) {helpName = "help"}; //Help
  if(allArgIndex === 1) {allName = "all"}; //All
  if(remoteArgIndex === 1) {remoteName = "remote"}; //Remote

  // Extract values of parameters with values if present
  if (appArgIndex != -1) {appName = endpointArgs[appArgIndex].split("=")[1];} // Extract app
  if (progArgIndex != -1) {programName = endpointArgs[progArgIndex].split("=")[1];} // Extract prog
  if (portArgIndex != -1) {portName = endpointArgs[portArgIndex].split("=")[1];} // Extract port

  // Construct the JSON payload
  let payload = {
  };

  if (helpName) payload.help = helpName;
  if (allName) payload.all = allName;
  if (remoteName) payload.remote = remoteName;
  if (appName) payload.app = appName;
  if (programName) payload.prog = programName;
  if (portName) payload.port = portName;


  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jamkill";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
}

// ex: zx wrapper.mjs jamterm
// Validate and process the arguments
if (endpointArgs[0] === "jamterm") {
  //Get if the index of all
  const allArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--all"));

  // Get the index of a parameter with a value
  const appArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--app="));
  const progArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--prog="));
  const portArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--port="));
  const paneArgIndex = endpointArgs.findIndex((arg) => arg.startsWith("--pane="));

  let allName, appName, progName, portName, paneName;

  // Use all if present
  if(allArgIndex === 1) {allName = "all"}; //All

  // Extract the value of argument if present
  if (appArgIndex != -1) {appName = endpointArgs[appArgIndex].split("=")[1];} // Extract app
  if (progArgIndex != -1) {progName = endpointArgs[progArgIndex].split("=")[1];} // Extract prog
  if (portArgIndex != -1) {portName = endpointArgs[portArgIndex].split("=")[1];} // Extract port
  if (paneArgIndex != -1) {paneName = endpointArgs[paneArgIndex].split("=")[1];} // Extract pane


  // Construct the JSON payload
  let payload = {
  };

  if (allName) payload.all = allName;
  if (appName) payload.app = appName;
  if (progName) payload.prog = progName;
  if (paneName) payload.pane = paneName;



  // Send the POST request to the server
  const endpoint = "http://localhost:3000/jamterm";
  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      // Ensure response status is OK
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Handle streaming response with Node.js readable stream
      console.log("Streaming response:");
      response.body.on("data", (chunk) => {
        process.stdout.write(chunk.toString());
      });
      response.body.on("end", () => {
        console.log("\nStream finished.");
      });
    })
    .catch((error) => {
      console.error("Error sending request:", error.message);
    });
}