# RethinkDB Annotation Server

An annotation server for RecogitoJS/Annotorious, built with RethinkDB and NodeJS.

__Work in progress!__

## Database Installation

The included `docker-compose.yml` will install and start a RethinkDB instance locally via Docker.

`$ docker-compose up`

The RethinkDB admin interface will be available at <http://localhost:8081> 

## Annotation Server

The Annotation Server is a simple [ExpressJS](http://expressjs.com/) API on top of RethinkDB. 
To start the server in development mode:

```sh
$ cd server
$ npm install
$ npm run dev
```

The server will be available at <http://localhost:8080>

### Server API

Todo...