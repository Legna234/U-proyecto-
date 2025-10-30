import express from 'express'
import logger from 'morgan'

import {Server} from 'socket.io'
import {createServer} from 'node:http'
import { Socket } from 'node:dgram'
import { on } from 'node:events'

const port = process.env.PORT ?? 3003

const app = express()
const server = createServer(app)
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('an user has disconnected!')
  })

  socket.on('chat message', (msg) => {
    console.log('message: ' + msg)
    io.emit('chat message', msg)
  })
})

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/login.html')
})

app.get('/chat', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

app.use(express.static(process.cwd() + '/client'));


server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})