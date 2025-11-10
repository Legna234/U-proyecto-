import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import logger from 'morgan'
import {createClient} from "@libsql/client";

import {Server} from 'socket.io'
import {createServer} from 'node:http'
import { Socket } from 'node:dgram'
import { on } from 'node:events'


const port = process.env.PORT ?? 3002

const app = express()
const server = createServer(app)
const io = new Server(server);

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

app.use(express.json())

io.on('connection', async (socket) => {

  const userId = socket.handshake.auth?.userId
  const rol = socket.handshake.auth?.rol
console.log("Auth del usuario:", socket.handshake.auth)
  console.log('a user has connected!')

  socket.on('disconnect', () => {
    console.log('an user has disconnected!')
  })

      socket.on('chat message', async (data) => {
      const { userId, text } = data;
      let result;

      try {
        result = await db.execute({
          sql: `INSERT INTO mensaje (texto, id_usuario, fecha_envio) VALUES (:text, :userId, datetime('now'))`,
          args: { text, userId }
        });

    // Obtener el usuario que envió el mensaje
    const userResult = await db.execute({
      sql: `SELECT nombre, rol FROM usuario WHERE id = ?`,
      args: [userId]
    });

    const user = userResult.rows[0];
    const rolNombre = user.rol === 1 ? "Estudiante" : user.rol === 2 ? "Profesor" : "Invitado";

    // Reenviar mensaje con toda la información
    io.emit('chat message', {
      id: result.lastInsertRowid.toString(),
      text,
      userId,
      nombre: user.nombre,
      rol: rolNombre
    });

      } catch (e) {
        console.error(e);
        return;
      }

      console.log(`Mensaje de ${userId}: ${text}`);
      //io.emit('chat message', { text, userId, id: result.lastInsertRowid.toString() });
      //BigInt.prototype.toJSON = function() { return this.toString(); };
    })
    
  if (!socket.recovered){ // recuperar los mensajes de la base de datos
    try {
    const results = await db.execute({
      sql: `
        SELECT 
          m.id, 
          m.id_usuario, 
          m.texto, 
          m.fecha_envio, 
          u.nombre, 
          u.rol 
        FROM mensaje m
        LEFT JOIN usuario u ON m.id_usuario = u.id
        WHERE m.id > ?
        ORDER BY m.fecha_envio ASC
      `,
      args: [socket.recovered.auth?.serverOffset ?? 0]
    });

    results.rows.forEach(row => {
      const rolNombre = row.rol === 1 ? "Estudiante" : row.rol === 2 ? "Profesor" : "Invitado";
      socket.emit('chat message', {
        id: row.id.toString(),
        text: row.texto,
        userId: row.id_usuario,
        nombre: row.nombre || 'Desconocido',
        rol: rolNombre,
        fecha_envio: row.fecha_envio
      });
    });
  
    }catch (e){
      console.error(e)
      return
    }
  }
})

app.use(logger('dev'))

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/client/login.html')
})

app.get('/chat', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(process.cwd() + '/client/registro.html');
});

app.use(express.static(process.cwd() + '/client'));


server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})

// RUTA PARA REGISTRO EN TURSO
app.post('/api/register', async (req, res) => {
  try {
    const { cedula, nombre, rol, clave } = req.body

    if (!cedula || !rol || !clave) {
      return res.status(400).json({ message: "Datos incompletos" })
    }

    await db.execute({
      sql: `INSERT INTO usuario (cedula, nombre, rol, clave) VALUES (?, ?, ?, ?)`,
      args: [cedula, nombre, rol, clave]
    })

    res.json({ success: true })

  } catch (err) {
    console.error(err)
    if (err.message.includes("UNIQUE"))
      return res.status(400).json({ message: "Este usuario ya está registrado" })
    
    res.status(500).json({ message: "Error en servidor" })
  }
})

// RUTA DE INICIO DE SESION

app.post("/api/login", async (req, res) => {
  try {
    const { cedula, clave } = req.body;

    const result = await db.execute({
      sql: "SELECT * FROM usuario WHERE cedula = ? AND clave = ?",
      args: [cedula, clave]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const user = result.rows[0];
    

    // 🔹 Imprimir en consola el ID del usuario que inicia sesión
    console.log(`Usuario logueado: ID=${user.id}, Nombre=${user.nombre}, Rol=${user.rol}`);

    return res.json({
      success: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        cedula: user.cedula
      }
    });


    

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error interno" });
  }
});




