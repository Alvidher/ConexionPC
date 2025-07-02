// script.js

document.addEventListener('DOMContentLoaded', () => {
  const pathname = window.location.pathname;

  // --------------------------- INDEX ---------------------------
  if (pathname.endsWith('index.html') || pathname === '/' || pathname === '') {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroPrioridad = document.getElementById('filtroPrioridad');

    filtroEstado?.addEventListener('change', cargarTickets);
    filtroPrioridad?.addEventListener('change', cargarTickets);

    async function cargarTickets() {
      try {
        const res = await fetch('/api/tickets');
        const tickets = await res.json();

        cuerpoTabla.innerHTML = '';
        const estadoFiltro = filtroEstado.value;
        const prioridadFiltro = filtroPrioridad.value;

        tickets
          .filter(ticket => {
            const estadoCoincide = !estadoFiltro || ticket.estado === estadoFiltro;
            const prioridadCoincide = !prioridadFiltro || ticket.prioridad === prioridadFiltro;
            return estadoCoincide && prioridadCoincide;
          })
          .forEach(ticket => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
              <td>${ticket.cliente}</td>
              <td>${ticket.descripcion}</td>
              <td>${ticket.responsable || '-'}</td>
              <td>${ticket.prioridad || '-'}</td>
              <td>${ticket.estado || '-'}</td>
              <td>
                <a href="ticket.html?id=${ticket._id}" class="btn btn-sm btn-info mb-1">Ver/Editar</a>
                <button class="btn btn-sm btn-danger mb-1" onclick="eliminarTicket('${ticket._id}')">Eliminar</button>
                <button class="btn btn-sm btn-outline-dark mb-1" onclick="exportarPDF('${ticket._id}')">PDF</button>
              </td>
            `;
            cuerpoTabla.appendChild(fila);
          });

        if (tickets.length === 0) {
          cuerpoTabla.innerHTML = '<tr><td colspan="6" class="text-center">No hay tickets registrados</td></tr>';
        }
      } catch (error) {
        console.error('Error cargando tickets:', error);
      }
    }

    window.eliminarTicket = async (id) => {
      if (confirm('¿Seguro que deseas eliminar este ticket?')) {
        await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
        cargarTickets();
      }
    };

    window.exportarPDF = async (id) => {
      window.open(`/api/pdf/${id}`, '_blank');
    };

    cargarTickets();
  }

  // ---------------------- NUEVO / EDITAR ----------------------
  if (pathname.endsWith('ticket.html') || pathname.endsWith('nuevo.html')) {
    const canvasTecnico = document.getElementById('firmaTecnicoCanvas');
    const canvasSolicitante = document.getElementById('firmaSolicitanteCanvas');
    const canvasConformidad = document.getElementById('firmaConformidadCanvas');

    const firmaTecnicoPad = canvasTecnico ? new SignaturePad(canvasTecnico) : null;
    const firmaSolicitantePad = canvasSolicitante ? new SignaturePad(canvasSolicitante) : null;
    const firmaConformidadPad = canvasConformidad ? new SignaturePad(canvasConformidad) : null;

    const form = document.getElementById('ticketForm') || document.getElementById('formEditar');

    async function cargarTicketSiEsEdicion() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id || !pathname.endsWith('ticket.html')) return;

      const res = await fetch(`/api/tickets/${id}`);
      const ticket = await res.json();

      if (form.cliente) form.cliente.value = ticket.cliente || '';
      if (form.ubicacion) form.ubicacion.value = ticket.ubicacion || '';
      if (form.responsable) form.responsable.value = ticket.responsable || '';
      if (form.responsableContacto) form.responsableContacto.value = ticket.responsableContacto || '';
      if (form.asunto) form.asunto.value = ticket.asunto || '';
      if (form.descripcion) form.descripcion.value = ticket.descripcion || '';
      if (form.actividadesRealizadas) form.actividadesRealizadas.value = ticket.actividadesRealizadas || '';
      if (form.actividadesAdicionales) form.actividadesAdicionales.value = ticket.actividadesAdicionales || '';
      if (form.tecnico) form.tecnico.value = ticket.tecnico || '';
      if (form.prioridad) form.prioridad.value = ticket.prioridad || '';
      if (form.estado) form.estado.value = ticket.estado || '';
      if (form.nombreSolicitante) form.nombreSolicitante.value = ticket.nombreSolicitante || '';
      if (form.puestoSolicitante) form.puestoSolicitante.value = ticket.puestoSolicitante || '';
      if (form.nombreConformidad) form.nombreConformidad.value = ticket.nombreConformidad || '';
      if (form.puestoConformidad) form.puestoConformidad.value = ticket.puestoConformidad || '';

      if (ticket.firmaTecnico && firmaTecnicoPad) {
        firmaTecnicoPad.fromDataURL(ticket.firmaTecnico);
      }
      if (ticket.firmaSolicitante && firmaSolicitantePad) {
        firmaSolicitantePad.fromDataURL(ticket.firmaSolicitante);
      }
      if (ticket.firmaConformidad && firmaConformidadPad) {
        firmaConformidadPad.fromDataURL(ticket.firmaConformidad);
      }

      // Mostrar evidencia si existe
      if (ticket.archivoMedia) {
        const preview = document.getElementById('previewMedia');
        const extension = ticket.archivoMedia.split('.').pop().toLowerCase();
        const mediaUrl = ticket.archivoMedia.startsWith('/')
          ? `${window.location.origin}${ticket.archivoMedia}`
          : ticket.archivoMedia;

        if (extension === 'mp4' || extension === 'webm' || extension === 'ogg') {
          preview.innerHTML = `<video src="${mediaUrl}" controls width="300"></video>`;
        } else {
          preview.innerHTML = `<img src="${mediaUrl}" alt="Evidencia" width="300" class="img-thumbnail mt-2"/>`;
        }
      }
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      formData.set('firmaTecnico', firmaTecnicoPad?.toDataURL() || '');
      formData.set('firmaSolicitante', firmaSolicitantePad?.toDataURL() || '');
      formData.set('firmaConformidad', firmaConformidadPad?.toDataURL() || '');

      const method = pathname.endsWith('nuevo.html') ? 'POST' : 'PUT';
      const id = new URLSearchParams(window.location.search).get('id');
      const url = pathname.endsWith('nuevo.html')
        ? '/api/tickets'
        : `/api/tickets/${id}`;

      const res = await fetch(url, {
        method,
        body: formData
      });

      if (res.ok) {
        alert(pathname.endsWith('nuevo.html') ? 'Ticket guardado' : 'Ticket actualizado');
        window.location.href = 'index.html';
      }
    });

    window.borrarFirmaTecnico = () => firmaTecnicoPad?.clear();
    window.borrarFirmaSolicitante = () => firmaSolicitantePad?.clear();
    window.borrarFirmaConformidad = () => firmaConformidadPad?.clear();

    cargarTicketSiEsEdicion();
  }
});
