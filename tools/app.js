const express = require('express');
const { exec } = require('child_process');
const app = express();

const port = 3000;
const host = '0.0.0.0';

// Middleware to parse JSON requests
app.use(express.json());

// Define a simple route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Define the /jamrun endpoint with dynamic command construction
app.post('/jamrun', (req, res) => {
  const {
    file = 'file.jxe',
    app_name,
    fog,
    cloud,
    device,
    num,
    data,
    tags,
    bg,
    old,
    log,
    verb,
    loc,
    edge,
    valgrind,
    local,
    remote,
  } = req.body;

  // Check mandatory field `app_name`
  if (!app_name) {
    return res.status(400).json({ error: 'The "app_name" field is required.' });
  }

  // Construct the base command
  let command = `zx jamrun.mjs ${file} --app=${app_name}`;

  // Optional flags based on request fields
  if (fog) command += ' --fog';
  if (cloud) command += ' --cloud';
  if (device) command += ' --device';
  if (num) command += ` --num=${num}`;
  if (data) command += ` --data=${data}`;
  if (tags) command += ` --tags="${tags}"`;
  if (bg) command += ' --bg';
  if (old) command += ' --old';
  if (log) command += ' --log';
  if (verb) command += ' --verb';
  if (loc) command += ` --loc=${loc}`;
  if (edge) command += ` --edge=${edge}`;
  if (valgrind) command += ' --valgrind';
  if (local) command += ' --local';
  if (remote) command += ` --remote=${remote}`;

  console.log(`Executing command: ${command}`);

  // Execute the constructed command
  const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/' });

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
 
  // Stream stdout data to the client
  childProcess.stdout.on('data', (data) => {
    res.write(data); // Send chunks of data as they are produced
  });

  // Stream stderr data to the client (for debugging or error messages)
  childProcess.stderr.on('data', (data) => {
    res.write(`Error: ${data}`);
  });

  // When the process completes, close the response
  childProcess.on('close', (code) => {
    res.end(`\nProcess completed with code ${code}`);
  });

  // Handle any execution errors
  childProcess.on('error', (error) => {
    res.end(`\nFailed to start process: ${error.message}`);
  });
});

// Define the /jambatch endpoint with dynamic command construction
app.post('/jambatch', (req, res) => {
  const {
    fog,
    device,
    cloud,
    cFile,
    fFile,
    dFile,
    num,
    cLoc,
    fLoc,
    dLoc,
    cEdge,
    fEdge,
    dEdge
  } = req.body;


  // Construct the base command
  let command = `zx jambatch.mjs program.jxe`;

  // Optional flags based on request fields
  if (fog) command += ` --fog=${fog}`;
  if (device) command += ` --device=${device}`;
  if (cloud) command += ` --cloud=${cloud}`;
  if (cFile) command += `--cFile=${cFile}`;
  if (fFile) command += `--fFile=${fFile}`;
  if (dFile) command += `--dFile=${dFile}`;
  if (num) command += `--num=${num}`;
  if (cLoc) command += `--cLoc=${cLoc}`;
  if (fLoc) command += `--fLoc=${fLoc}`;
  if (dLoc) command += `--dLoc=${dLoc}`;
  if(cEdge) command += `--cEdge=${cEdge}`;
  if(fEdge) command += `--fEdge=${fEdge}`;
  if(dEdge) command += `--dEdge=${dEdge}`;

  console.log(`Executing command: ${command}`);

  // Execute the constructed command
  const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/' });

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
 
});

// Define the /jamlog endpoint with dynamic command construction
app.post('/jamlog', (req, res) => {
  const {
    program,
    app,
    port,
    remote,
    tail,
    c,
    j,
  } = req.body;

  // Check mandatory field `remote`
  if (!remote) {
    return res.status(400).json({ error: 'The "remote" field is required.' });
  }

  // Check mandatory field `tail`
  if (!tail) {
    return res.status(400).json({ error: 'The "tail" field is required.' });
  }


  // Construct the base command
  let command = `zx jamlog.mjs --program=jt2 --app-xxx2, --port=1883`;

  // Optional flags based on request fields
  if (remote) command += ` --remote=${remote}`;
  if (tail) command += ` --tail=${tail}`;

  console.log(`Executing command: ${command}`);

  // Execute the constructed command
  const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/' });

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
 
});

// Define the /jamlist endpoint with dynamic command construction
app.post('/jamlist', (req, res) => {
  const {
    monitor,
    type,
    dataStore,
    tmuxid,
    port,
    app,
    prog,
    remote
  } = req.body;

  // Check mandatory field `type`
  if (!type) {
    return res.status(400).json({ error: 'The "type" field is required.' });
  }

  // Check mandatory field `type`
  if (!dataStore) {
    return res.status(400).json({ error: 'The "dataStore" field is required.' });
  }

  // Check mandatory field `tmuxid`
  if (!tmuxid) {
    return res.status(400).json({ error: 'The "tmuxid" field is required.' });
  }

  // Check mandatory field `port`
  if (!port) {
    return res.status(400).json({ error: 'The "port" field is required.' });
  }

  // Check mandatory field `app`
  if (!port) {
    return res.status(400).json({ error: 'The "app" field is required.' });
  }

  // Check mandatory field `app`
  if (!port) {
    return res.status(400).json({ error: 'The "prog" field is required.' });
  }


  // Construct the base command
  let command = `zx jamlist.mjs`;

  // Optional flags based on request fields
  if (type) command += ` --type=${type}`;
  if (dataStore) command += ` --dataStore=${dataStore}`;
  if (tmuxid) command += ` --tmuxid=${tmuxid}`;
  if (port) command += ` --port=${port}`;
  if (app) command += ` --app=${app}`;
  if (prog) command += ` --prog=${prog}`;


  console.log(`Executing command: ${command}`);

  // Execute the constructed command
  const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/' });

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
 
});


//Define the /jamkill endpoint
app.post('/jamkill', (req, res) => {
  const {
    reset,
    all,
    remote,
    app,
    prog,
    port
  } = req.body;

//No mandatory fields, by default kills local apps only

//Construct base command
let command = 'zx jamkill.mjs';

//Optional flags
if (reset) command += ' --reset';
if (all) command += ' --all'
if (remote) command += ' --remote';
if (app) command += ' --app==${app}';
if (prog) command += ' --prog==${prog}';
if (port) command += ' --port=${port}';

console.log('Executing command: ${command}');

//Execute the command
const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/'});

//Set headers 
res.setHeader('Content-Type', 'text/plain');
res.setHeader('Transfer-Encoding', 'chunked');
});


// Define the /jamterm endpoint with dynamic command construction
app.post ("/jamterm", (req, res)=>{
  const { all, app, prog, port, pane } = req.body;

  // Construct the base command
  let command = `zx jamterm.mjs`;

  // Add optional flags
  if (all) command += ' --all';
  if (app) command += ` --app=${app}`;
  if (prog) command += ` --prog=${prog}`;
  if (port) command += ` --port=${port}`;
  if (pane) command += ` --pane=${pane}`;

  console.log(`Executing command: ${command}`);

  // Execute the constructed command
  const childProcess = exec(command, { cwd: '/root/capstone/JAMScript/tools/', shell: true});

  // Set headers to keep the connection open for streaming
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Stream stdout data to the client
  childProcess.stdout.on('data', (data) => {
    res.write(data); // Send chunks of data as they are produced
  });

  // Stream stderr data to the client (for debugging or error messages)
  childProcess.stderr.on('data', (data) => {
    res.write(`Error: ${data}`);
  });

  // When the process completes, close the response
  childProcess.on('close', (code) => {
    res.end(`\nProcess completed with code ${code}`);
  });

  // Handle any execution errors
  childProcess.on('error', (error) => {
    res.end(`\nFailed to start process: ${error.message}`);
  });
})



// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

