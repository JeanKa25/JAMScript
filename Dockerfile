FROM ubuntu

# Install SSH and other dependencies
RUN apt update && apt install -y openssh-server
RUN sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

# Install necessary tools and libraries
RUN apt-get update && apt-get install -y --no-install-recommends apt-utils && \
        apt-get install -y -q wget \
        build-essential \
        python3 \
        unzip \
        libbsd-dev \
        git \
        sudo \
        vim \
        curl \
        make \
        clang \
        iproute2 \
        net-tools \
        unzip \
        iputils-ping \
        mosquitto \
        mosquitto-clients \
        libmosquitto-dev \
        redis-server \
        redis-tools \
        libhiredis-dev \
        libevent-dev \
        tmux \
        inotify-tools

# Create an admin user with sudo privileges
RUN useradd -m admin && echo "admin:admin" | chpasswd && adduser admin sudo
RUN echo "admin ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers
USER admin

# Set up Node.js
WORKDIR /home/admin
RUN wget https://deb.nodesource.com/setup_20.x && chmod +x ./setup_20.x && echo admin | sudo -S ./setup_20.x && \
        sudo apt-get install -y -q nodejs

# Clone JAMScript repository and build dependencies
RUN git clone --branch shahin/migration https://github.com/citelab/JAMScript

WORKDIR /home/admin/JAMScript/deps
RUN git clone https://github.com/intel/tinycbor && \
    cd tinycbor && \
    make && sudo make install

WORKDIR /home/admin/JAMScript/deps/mujs2
RUN make && sudo make install

# Install JAMScript dependencies and global npm package
WORKDIR /home/admin/JAMScript
RUN npm install
RUN sudo npm install zx -g

# Additional setup for JAMScript
WORKDIR /home/admin/JAMScript/lib/cside
RUN make archive

WORKDIR /home/admin
RUN mkdir -p .jamruns && \
    ln -s /home/admin/JAMScript/lib/cside .jamruns/clib && \
    ln -s /home/admin/JAMScript .jamruns/jamhome && \
    ln -s /home/admin/JAMScript/lib/jside .jamruns/node_modules

# Configure npm global installation path
RUN mkdir .npm-global && mkdir .npm-global/bin
ENV PATH="$PATH:/home/admin/JAMScript/tools:/home/admin/.npm-global/bin"

# Expose SSH port
EXPOSE 22

# Copy the code from the current directory to /home/admin/code in the container
WORKDIR /home/admin/code
COPY . /home/admin/code

# Run npm install and install.sh as admin
RUN npm install
RUN sudo chmod +x /home/admin/code/install.sh && /home/admin/code/install.sh

# Start SSH and keep the container running
ENTRYPOINT sudo service ssh start && tail -f /dev/null

