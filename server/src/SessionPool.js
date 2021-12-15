import Session from './Session';

class SessionPool {

  constructor(io) {
    console.log('Creating realtime session pool');

    this.sessions = {};

    io.on('connection', socket => {
      console.log(`Client connected: ${socket.id}`);

      // Handle 'joinSession' request from client
      socket.on('joinSession', msg => {
        const { source } = msg;

        console.log(`Client ${socket.id} joins session ${source}`);

        if (!this.sessions[source])
          this.sessions[source] = new Session(source);

        this.sessions[source].join(socket);
      });    

      socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected`);

        // Disconnect this socket from all sessions it has joined
        const sessions = this.findSessions(socket);
        sessions.forEach(s => s.leave(socket));
      });
    });
  }

  findSessions = socket =>
    Object.values(this.sessions).filter(session => session.includes(socket));

}

export default { init: io => new SessionPool(io) };
