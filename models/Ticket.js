const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  cliente: String,
  ubicacion: String,
  responsable: String,
  responsableContacto: String,
  asunto: String,
  descripcion: String,
  actividadesRealizadas: String,
  actividadesAdicionales: String,
  tecnico: String,
  estado: String,
  prioridad: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Media'
  },
  firmaTecnico: String,
  firmaSolicitante: String,
  nombreSolicitante: String,
  puestoSolicitante: String,
  firmaConformidad: String,
  nombreConformidad: String,
  puestoConformidad: String,
  archivoMedia: String,
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);
