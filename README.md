# Annotorious Real-Time Annotation Server

An experimental annotation server that enables GoogleDocs-style live 
collaboration in Annotorious. Built with [RethinkDB](https://rethinkdb.com/) and 
[NodeJS](https://nodejs.org/). Try the online demo here:

__<https://realtime-demo.annotorious.com/>__

![Social preview image](social.jpg)

__This project is work in progress! Want to learn more? Deploy your own server? 
Contribute to development? Get in touch via the 
[Annotorious Gitter chat](https://gitter.im/recogito/annotorious) or send me
[a DM on twitter](https://twitter.com/aboutgeo)!__

## Usage

You need [Docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) installed on your system. 
Run `docker-compose up` in the root directory. This will create and launch 3 containers:

- Storage backend (RethinkDB)
- Annotation server (NodeJS application)
- NGINX proxy server

The annotation server will be available at <http://localhost:9000>, the RethinkDB admin interface will be available
at <http://localhost:9000/db/> (the trailing slash is important!)

You can check if the annotation server has started correctly by going to 

<http://localhost:9000/version>

## Client

To interact with the server and handle live syncing, Annotorious needs a client plugin. For the time being, you can run the plugin in dev mode:

```sh
$ cd client
$ npm install
$ npm start
```
