const puppeteer = require('puppeteer');
const Ticket = require('../models/Ticket');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');

exports.generarPDF = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Ticket no encontrado');

    // Renderiza la plantilla EJS con los datos
    const html = await ejs.renderFile(
      path.join(__dirname, '../templates/pdfTemplate.html'),
      { ticket }
    );

    // Inicia navegador Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ticket_${ticket._id}.pdf"`
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error.message);
    console.error(error.stack);
    res.status(500).send('Error al generar PDF');
  }
};
