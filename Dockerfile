FROM node:alpine
MAINTAINER William Hearn <sylus1984@gmail.com>

# Install Bower & Grunt
RUN npm install -g bower grunt-cli && \
    echo '{ "allow_root": true }' > /root/.bowerrc

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8095
CMD [ "grunt", "harvest" ]
