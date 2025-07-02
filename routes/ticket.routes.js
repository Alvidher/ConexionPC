const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { generarPDF } = require('../controllers/pdfController');
const ExcelJS = require('exceljs');
const multer = require('multer');
const path = require('path');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Asegúrate que esta carpeta exista
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Crear ticket con archivo
router.post('/tickets', upload.single('archivoMedia'), async (req, res) => {
  const data = req.body;
  if (req.file) {
    data.archivoMedia = `/uploads/${req.file.filename}`;
  }

  const ticket = new Ticket(data);
  await ticket.save();
  res.status(201).json(ticket);
});

// Obtener un ticket
router.get('/tickets/:id', async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  res.json(ticket);
});

// Editar ticket con posible nuevo archivo
router.put('/tickets/:id', upload.single('archivoMedia'), async (req, res) => {
  const data = req.body;
  if (req.file) {
    data.archivoMedia = `/uploads/${req.file.filename}`;
  }

  const updated = await Ticket.findByIdAndUpdate(req.params.id, data, { new: true });
  res.json(updated);
});

// Eliminar ticket
router.delete('/tickets/:id', async (req, res) => {
  await Ticket.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

// Obtener todos los tickets
router.get('/tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ creadoEn: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los tickets' });
  }
});

// Generar PDF
router.get('/pdf/:id', generarPDF);

// Exportar a Excel
router.get('/export/excel', async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ creadoEn: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tickets');

    worksheet.columns = [
      { header: 'ID', key: '_id', width: 25 },
      { header: 'Fecha', key: 'creadoEn', width: 15 },
      { header: 'Cliente', key: 'cliente', width: 20 },
      { header: 'Ubicación', key: 'ubicacion', width: 20 },
      { header: 'Responsable', key: 'responsable', width: 20 },
      { header: 'Contacto Responsable', key: 'responsableContacto', width: 20 },
      { header: 'Asunto', key: 'asunto', width: 20 },
      { header: 'Descripción', key: 'descripcion', width: 30 },
      { header: 'Actividades Realizadas', key: 'actividadesRealizadas', width: 30 },
      { header: 'Actividades Adicionales', key: 'actividadesAdicionales', width: 30 },
      { header: 'Prioridad', key: 'prioridad', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Evidencia', key: 'archivoMedia', width: 60 }
    ];

    tickets.forEach(ticket => {
      const evidenciaURL = ticket.archivoMedia
      ? `$(req.protocol)://${req.get('host')}${ticket.archivoMedia}`
      : '';
      
      worksheet.addRow({
        ...ticket.toObject(),
        creadoEn: new Date(ticket.creadoEn).toLocaleDateString(),
        archivoMedia: evidenciaURL
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    res.status(500).send('Error al generar el archivo Excel');
  }
});

module.exports = router;
