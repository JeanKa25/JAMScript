# Redesigning JAMScript Tools for High-Performance and Scalability

This repository is part of an ongoing effort to redesign the JAMScript tools with a focus on high-performance execution and scalable infrastructure. 
To achieve this, we've restructured the architecture around a client-server model that separates the responsibilities of coordination and computation. 

## 🔧 Getting Started

### 1. Clone the Repository

Start by cloning the repository and switching to the appropriate branch:

```bash
git clone https://github.com/JeanKa25/JAMScript.git
cd JAMScript
git checkout new-jamtools-main
```

Then run the install.sh to install all the dependencies:


### 2. Set Environment Variables
Export the following global variables:

```bash
export JAM_HOME=~/JAMScript
export JAMHOME=~/JAMScript
export PATH=$JAM_HOME/tools:$PATH
export JAMDATA=~/JAMScript/data
```

To make these changes permanent, add them to your .bashrc:

```bash
echo 'export JAM_HOME=~/JAMScript' >> ~/.bashrc
echo 'export JAMHOME=~/JAMScript' >> ~/.bashrc
echo 'export PATH=$JAM_HOME/tools:$PATH' >> ~/.bashrc
echo 'export JAMDATA=~/JAMScript/data' >> ~/.bashrc
source ~/.bashrc
```


## ⚙️ Installing Dependenceis with Ansible

You can set up your environment using Ansible with the provided playbook:

### 1. Install Ansible (if not already installed)

```bash
sudo apt update
sudo apt install ansible -y
```

### 2. Run the setup playbook

```bash
ansible-playbook setup_jamscript.yml -i localhost,
```

> This playbook installs required dependencies, clones the repo, and configures environment variables as needed for JAMScript tools.

---

## 🌐 Running the Server

To start the JAMScript server, navigate to the tools directory and run the server file:

```bash
cd ~/JAMScript/tools
node app-docker.js
```

### 🔧 Path and IP Configuration

Before running the server, make sure to update the following files:

#### `app-docker.js`
- Set the `serverip` parameter to the IP address of the server.

#### `Wrapper.mjs`
- Update the following:
  - `serverip`: match the IP set in `app-docker.js`.
  - Path to JAMScript tools directory.
  - Path to your SSH `authorized_keys` file (used for key-based SSH access).

> These updates ensure that the tools can communicate correctly and execute remote tasks securely.

---

### 🚀 Available Ansible Playbooks

#### Server Run Playbook

```bash
ansible-playbook serverrun-playbook.yml --extra-vars "server=server2"
```

#### JamRun Playbook

```bash
ansible-playbook jamrun-playbook.yml --extra-vars "server=server2 file=jt1.jxe app='--app=DEMO'"
```

#### JamList Playbook

```bash
ansible-playbook jamlist-playbook.yml --extra-vars "server=server2"
```

#### JamTerm Playbook (Without tmux session)

```bash
ansible-playbook jamterm-playbook.yml --extra-vars "server=server2"
```

#### JamTerm Playbook (With tmux session)

```bash
ansible-playbook jamterm-playbook.yml --extra-vars "server=server2 tmux=u-1001-dev-112-c"
```

#### JamKill Playbook

```bash
ansible-playbook jamkill-playbook.yml --extra-vars "server=server2"
```

#### Server Kill Playbook

```bash
ansible-playbook serverkill-playbook.yml --extra-vars "server=server2"

