<script>
    import { onMount } from "svelte";
    import flatpickr from "flatpickr";
    import { Spanish } from "flatpickr/dist/l10n/es.js";
    import "flatpickr/dist/themes/airbnb.css";
    import { useTranslations } from "@/i18n/utils";

    // Props para recibir datos y devolverlos al padre (Two-way binding)
    export let lang = "es";
    export let fechaEntrada = "";
    export let horaEntrada = "";
    export let fechaSalida = "";
    export let horaSalida = "";
    export let fechasBloqueadas = [
        function (date) {
            if (date.getMonth() === 0 && date.getDate() === 1) {
                return true; // true = bloqueado
            }

            if (date.getMonth() === 11 && date.getDate() === 25) {
                return true; // true = bloqueado
            }

            return false; // false = permitido
        },
    ];

    const t = useTranslations(lang);

    // REFERENCIAS AL HTML (Para que Flatpickr sepa dónde pintarse)
    let refInputFechaEntrada;
    let refInputHoraEntrada;
    let refInputFechaSalida;
    let refInputHoraSalida;

    onMount(() => {
        // CALCULAR LA FECHA MÍNIMA DE ENTRADA
        const hoy = new Date();
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1); // Sumamos 1 día a hoy

        const configBase = {
            locale: Spanish,
            altInput: true,
            altFormat: "d-m-Y", // Lo que ve el usuario
            dateFormat: "Y-m-d", // Lo que le llega al servidor
            disableMobile: "true",
            disable: fechasBloqueadas,
        };

        // === CONFIGURACIÓN FECHAS ===
        // Usamos 'refInputFechaEntrada' para vincularlo al HTML
        const fpEntrada = flatpickr(refInputFechaEntrada, {
            ...configBase,
            minDate: manana,
            onChange: (selectedDates, dateStr) => {
                fechaEntrada = dateStr; // Actualizamos la variable para Svelte

                // Actualizamos el mínimo de la salida
                fpSalida.set("minDate", dateStr);
                // Si la salida es menor a la nueva entrada, limpiamos salida
                if (
                    fechaSalida &&
                    fpSalida.selectedDates[0] < selectedDates[0]
                ) {
                    fpSalida.clear();
                    fechaSalida = "";
                }
            },
        });

        const fpSalida = flatpickr(refInputFechaSalida, {
            ...configBase,
            minDate: manana,
            onChange: (_, dateStr) => {
                fechaSalida = dateStr; // Actualizamos variable
            },
        });

        // === CONFIGURACIÓN HORAS ===
        const configHora = {
            disableMobile: "true",
            enableTime: true,
            noCalendar: true, // Solo reloj
            dateFormat: "H:i",
            time_24hr: true, // Formato 24 horas
            locale: Spanish,
            minTime: "06:00",
            maxTime: "23:55",
            minuteIncrement: 5,
        };

        flatpickr(refInputHoraEntrada, {
            ...configHora,
            onChange: (_, timeStr) => (horaEntrada = timeStr),
        });

        flatpickr(refInputHoraSalida, {
            ...configHora,
            onChange: (_, timeStr) => (horaSalida = timeStr),
        });
    });
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
        <label
            for="fecha entrada"
            class="block text-gray-700 text-sm font-bold mb-2"
            >{t("reservar.label.fechaEntrada")}</label
        >
        <input
            bind:this={refInputFechaEntrada}
            class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
            placeholder="dd-mm-aaaa"
        />

        <label
            for="hora entrada"
            class="block text-gray-700 text-sm font-bold mt-3 mb-2"
            >{t("reservar.label.horaEntrada")}</label
        >
        <input
            bind:this={refInputHoraEntrada}
            class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
            placeholder="--:--"
        />
        <p class="text-xs text-gray-500 mt-1 flex items-center">
            {t("reservar.textHelp.horaEntrada")}: 06:00 - 23:55
        </p>
    </div>

    <div>
        <label
            for="fecha salida"
            class="block text-gray-700 text-sm font-bold mb-2"
            >{t("reservar.label.fechaSalida")}</label
        >
        <input
            bind:this={refInputFechaSalida}
            class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
            placeholder="dd-mm-aaaa"
        />

        <label
            for="hora salida"
            class="block text-gray-700 text-sm font-bold mt-3 mb-2"
            >{t("reservar.label.horaSalida")}</label
        >
        <input
            bind:this={refInputHoraSalida}
            class="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none bg-white"
            placeholder="--:--"
        />
        <p class="text-xs text-gray-500 mt-1 flex items-center">
            {t("reservar.textHelp.horaEntrada")}: 06:00 - 23:55
        </p>
    </div>
</div>
