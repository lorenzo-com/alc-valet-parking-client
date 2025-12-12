<script>
  import { onMount } from 'svelte';
  import flatpickr from 'flatpickr';
  import { Spanish } from 'flatpickr/dist/l10n/es.js';
  import 'flatpickr/dist/themes/material_blue.css';

  // Props para recibir datos y devolverlos al padre (Two-way binding)
  export let fechaEntrada = "";
  export let horaEntrada = "";
  export let fechaSalida = "";
  export let horaSalida = "";
  
  // Prop para recibir fechas ocupadas desde el padre
  export let fechasBloqueadas = [];

  let elFechaEntrada, elFechaSalida, elHoraEntrada, elHoraSalida;

  onMount(() => {
    // === CONFIGURACIÓN FECHAS ===
    const fpEntrada = flatpickr(elFechaEntrada, {
      locale: Spanish,
      dateFormat: "d-m-Y",
      minDate: "today",
      disable: fechasBloqueadas,
      onChange: (selectedDates, dateStr) => {
        fechaEntrada = dateStr; // Actualizamos la variable para Svelte
        
        // Magia: Actualizamos el mínimo de la salida
        fpSalida.set("minDate", dateStr);
        
        // Si la salida es menor a la nueva entrada, limpiamos salida
        if (fechaSalida && fpSalida.selectedDates[0] < selectedDates[0]) {
            fpSalida.clear();
            fechaSalida = "";
        }
      }
    });

    const fpSalida = flatpickr(elFechaSalida, {
      locale: Spanish,
      dateFormat: "d-m-Y",
      minDate: "today",
      disable: fechasBloqueadas,
      onChange: (selectedDates, dateStr) => {
        fechaSalida = dateStr; // Actualizamos variable
      }
    });

    // === CONFIGURACIÓN HORAS ===
    const configHora = {
      enableTime: true,
      noCalendar: true,
      dateFormat: "H:i",
      time_24hr: true,
      locale: Spanish
    };

    flatpickr(elHoraEntrada, {
      ...configHora,
      onChange: (_, timeStr) => horaEntrada = timeStr
    });

    flatpickr(elHoraSalida, {
      ...configHora,
      onChange: (_, timeStr) => horaSalida = timeStr
    });
  });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2">Fecha de entrada</label>
    <input bind:this={elFechaEntrada} class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white" placeholder="dd-mm-aaaa" />
    
    <label class="block text-gray-700 text-sm font-bold mt-3 mb-2">Hora de entrada</label>
    <input bind:this={elHoraEntrada} class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white" placeholder="--:--" />
  </div>

  <div>
    <label class="block text-gray-700 text-sm font-bold mb-2">Fecha de salida</label>
    <input bind:this={elFechaSalida} class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white" placeholder="dd-mm-aaaa" />

    <label class="block text-gray-700 text-sm font-bold mt-3 mb-2">Hora de salida</label>
    <input bind:this={elHoraSalida} class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white" placeholder="--:--" />
  </div>
</div>