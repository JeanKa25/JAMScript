FROM ubuntu

# Install OpenSSH server and sudo
RUN apt update && apt install -y openssh-server sudo

RUN sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config

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
        iputils-ping

RUN apt-get install -y -q mosquitto \
        mosquitto-clients \
        libmosquitto-dev

RUN apt-get install -y -q redis-server \
        redis-tools \
        libhiredis-dev

RUN apt-get install -y -q libevent-dev \
        tmux \
        inotify-tools

RUN useradd -m admin && echo "admin:admin" | chpasswd && adduser admin sudo
RUN echo "admin ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers
USER admin
WORKDIR /home/admin
RUN wget https://deb.nodesource.com/setup_20.x && chmod +x ./setup_20.x && echo admin | sudo -S ./setup_20.x && \
        sudo apt-get install -y -q nodejs

        RUN git clone --branch shahin/migration https://github.com/citelab/JAMScript

WORKDIR /home/admin/JAMScript/deps
RUN git clone https://github.com/intel/tinycbor
WORKDIR /home/admin/JAMScript/deps/tinycbor
RUN make
RUN sudo make install

WORKDIR /home/admin/JAMScript/deps/mujs2
RUN make
RUN sudo make install

WORKDIR /home/admin/JAMScript
RUN npm install
RUN sudo npm install zx -g

WORKDIR /home/admin/JAMScript/lib/cside
RUN make archive

WORKDIR /home/admin
RUN mkdir .jamruns
WORKDIR /home/admin/.jamruns
RUN ln -s /home/admin/JAMScript/lib/cside clib
RUN ln -s /home/admin/JAMScript jamhome
RUN ln -s /home/admin/JAMScript/lib/jside node_modules

WORKDIR /home/admin
RUN mkdir .npm-global
RUN mkdir .npm-global/bin

ENV PATH="$PATH:/home/admin/JAMScript/tools:/home/admin/.npm-global/bin"

# Expose the SSH port
EXPOSE 22

# Start SSH service and keep the container running
ENTRYPOINT ["bash", "-c", "sudo service ssh start && exec bash"]

