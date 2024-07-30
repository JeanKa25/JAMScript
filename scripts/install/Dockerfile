FROM ubuntu

RUN apt update && apt install -y openssh-server
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


WORKDIR /home/admin/JAMScript/lib/cside 
RUN make archive

WORKDIR /home/admin
RUN mkdir .jamruns
WORKDIR /home/admin/.jamruns
RUN ln -s /home/admin/JAMScript/lib/cside clib
RUN ln -s /home/admin/JAMScript jamhome
RUN ln -s /home/admin/JAMScript/lib/jside node_modules

WORKDIR /home/admin

# ENV PATH="$PATH:/home/admin/JAMScript/tools"
ENV PATH="/home/admin/JAMScript/node_modules/.bin:$PATH"

EXPOSE 22
ENTRYPOINT sudo service ssh start && bash
