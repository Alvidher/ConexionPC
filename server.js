const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://admin:CE9DRE3Cb6Xsl4fR@cluster0.l4ory0c.mongodb.net/conexionpc_tickets?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB', err));

app.use('/api', require('./routes/ticket.routes'));

app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});

app.use('/api/tickets', require('./routes/ticket.routes'));

app.use('/uploads', express.static('uploads'));