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

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

