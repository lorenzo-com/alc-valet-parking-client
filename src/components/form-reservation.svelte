<script>
  import { onMount } from "svelte";
  import { z } from "zod";

  // Props que recibe desde Astro
  export let locale = "es";
  export let translations = {};

  // Helper para obtener traducciones
  function t(key) {
    return translations[key] || key;
  }

  // Schema de validación con Zod
  const reservaSchema = z.object({
    nombre: z.string().min(1, "nombreRequerido"),

    email: z.string().min(1, "emailRequerido").email("emailInvalido"),

    telefono: z.string().min(1, "phoneRequired"),

    fecha: z
      .string()
      .min(1, "fechaRequerida")
      .refine((date) => {
        if (!date) return false;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }, "fechaPasada"),

    hora: z.string().min(1, "horaRequerida"),

    personas: z.number().min(1, "personasMin").max(20, "personasMax"),

    comentarios: z.string().optional(),
  });

  // Estado del formulario
  let formData = {
    nombre: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    personas: 2,
    comentarios: "",
  };

  // Errores de validación
  let errors = {
    nombre: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    personas: "",
  };

  // Estado del formulario
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = "";

  // Fecha mínima (hoy)
  let minDate = "";

  onMount(() => {
    const today = new Date();
    minDate = today.toISOString().split("T")[0];
  });

  // Validar campo individual con Zod
  function validateField(field, value) {
    try {
      // Crear un objeto con solo el campo a validar
      const fieldData = { ...formData, [field]: value };

      // Validar solo ese campo
      reservaSchema.pick({ [field]: true }).parse({ [field]: value });

      // Si no hay error, limpiar el mensaje
      errors[field] = "";
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = err.errors[0];
        // Usar el mensaje del error como clave de traducción
        errors[field] = t(`reservar.error.${fieldError.message}`);
      }
    }
  }

  // Validar todo el formulario con Zod
  function validateForm() {
    try {
      reservaSchema.parse(formData);

      // Limpiar todos los errores
      errors = {
        nombre: "",
        email: "",
        telefono: "",
        fecha: "",
        hora: "",
        personas: "",
      };

      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Resetear errores
        errors = {
          nombre: "",
          email: "",
          telefono: "",
          fecha: "",
          hora: "",
          personas: "",
        };

        // Mapear errores de Zod a nuestro objeto de errores
        err.errors.forEach((error) => {
          const field = error.path[0];
          if (field in errors) {
            errors[field] = t(`reservas.errores.${error.message}`);
          }
        });
      }

      return false;
    }
  }

  // Manejar cambios en los campos
  function handleInput(field) {
    return (e) => {
      const value = e.target.value;
      formData[field] = value;
      validateField(field, value);
    };
  }

  // Manejar cambio de número (personas)
  function handleNumberInput(e) {
    const value = parseInt(e.target.value) || 0;
    formData.personas = value;
    validateField("personas", value);
  }

  // Enviar formulario
  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    submitError = "";
    submitSuccess = false;

    try {
      // Incluir locale en el envío
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          locale,
        }),
      });

      if (response.ok) {
        submitSuccess = true;
        // Resetear formulario
        formData = {
          nombre: "",
          email: "",
          telefono: "",
          fecha: "",
          hora: "",
          personas: 2,
          comentarios: "",
        };
        errors = {
          nombre: "",
          email: "",
          telefono: "",
          fecha: "",
          hora: "",
          personas: "",
        };
      } else {
        submitError = t("reservas.errores.errorEnvio");
      }
    } catch (error) {
      submitError = t("reservas.errores.errorConexion");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  class="bg-primary d-flex justify-content-center py-4 border-top border-1 border-light"
>
  <h2 class="m-0 text-light">{t("reservar.title")}</h2>
</div>

<!-- Si no esta iniciado sesión mostramos un call to action -->
<div class="border border-2 border-primary p-4 mb-3">
  <!-- TODO: Mostrar solo si no esta iniciado sesión -->
  <h2 class="fs-4 mb-3 text-center">{t("reservar.title.calltoaction")}</h2>
  <div class="text-center">
    <a href="#" class="btn btn-outline-primary me-2">
      {t("reservar.login")}
    </a>
    <a href="#" class="btn btn-primary text-light">
      {t("reservar.register")}
    </a>
  </div>
</div>

<div class="container my-5">
  <form on:submit={handleSubmit} novalidate>
    <div class="border border-2 border-primary p-4">
      <h2 class="fs-2">{t("reservar.subtitle")}</h2>

      <div class="row">
        <div class="form-group">
          <label for="nombre">
            {t("reservas.campos.nombre")} <span class="required">*</span>
          </label>
          <input
            type="text"
            id="nombre"
            value={formData.nombre}
            on:input={handleInput("nombre")}
            on:blur={handleInput("nombre")}
            class:error={errors.nombre}
            placeholder={t("reservas.placeholders.nombre")}
            disabled={isSubmitting}
          />
          {#if errors.nombre}
            <span class="text-danger">{errors.nombre}</span>
          {/if}
        </div>

        <div class="form-group">
          <label for="email">
            {t("reservas.campos.email")} <span class="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            on:input={handleInput("email")}
            on:blur={handleInput("email")}
            class:error={errors.email}
            placeholder={t("reservas.placeholders.email")}
            disabled={isSubmitting}
          />
          {#if errors.email}
            <span class="error-message">{errors.email}</span>
          {/if}
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="fecha">
              {t("reservas.campos.fecha")} <span class="required">*</span>
            </label>
            <input
              type="date"
              id="fecha"
              value={formData.fecha}
              on:input={handleInput("fecha")}
              on:blur={handleInput("fecha")}
              class:error={errors.fecha}
              min={minDate}
              disabled={isSubmitting}
            />
            {#if errors.fecha}
              <span class="error-message">{errors.fecha}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="hora">
              {t("reservas.campos.hora")} <span class="required">*</span>
            </label>
            <input
              type="time"
              id="hora"
              value={formData.hora}
              on:input={handleInput("hora")}
              on:blur={handleInput("hora")}
              class:error={errors.hora}
              disabled={isSubmitting}
            />
            {#if errors.hora}
              <span class="error-message">{errors.hora}</span>
            {/if}
          </div>

          <div class="form-group">
            <label for="personas">
              {t("reservas.campos.personas")} <span class="required">*</span>
            </label>
            <input
              type="number"
              id="personas"
              value={formData.personas}
              on:input={handleNumberInput}
              on:blur={handleNumberInput}
              class:error={errors.personas}
              min="1"
              max="20"
              disabled={isSubmitting}
            />
            {#if errors.personas}
              <span class="error-message">{errors.personas}</span>
            {/if}
          </div>
        </div>

        <div class="form-group">
          <label for="comentarios">
            {t("reservas.campos.comentarios")}
          </label>
          <textarea
            id="comentarios"
            bind:value={formData.comentarios}
            rows="4"
            placeholder={t("reservas.placeholders.comentarios")}
            disabled={isSubmitting}
          ></textarea>
        </div>

        <button type="submit" class="submit-btn" disabled={isSubmitting}>
          {#if isSubmitting}
            {t("reservas.botones.enviando")}
          {:else}
            {t("reservas.botones.enviar")}
          {/if}
        </button>

        <p class="form-note">
          <span class="required">*</span>
          {t("reservas.mensajes.camposObligatorios")}
        </p>
      </div>
    </div>

    <!-- Precio a pagar -->
    <div class="border border-2 border-primary p-4 mt-3">
      <h2 class="fs-2">{t("reservar.fee")}</h2>
      <div>
        <div class="text-center text-light py-2" style="background: #ff7908ba;">
          <span class="fs-3">0 €</span>
        </div>
      </div>
    </div>

    <!-- Formulario para los NO autenticados -->
    <div class="border border-2 border-primary p-4 mt-3">
      <!-- TODO: Validar que no este autenticado el usuario -->
      <h2 class="fs-2">{t("reservar.title.userInfo")}</h2>
      <div class="d-flex justify-content-center gap-3 mb-3">
        <a class="btn btn-primary">{t("reservar.particular")}</a>
        <a class="btn btn-primary">{t("reservar.company")}</a>
      </div>
      <div class="row row-cols-1 row-cols-md-2">
        <div class="mb-3">
          <label for="nombre completo" class="form-label">
            {t("reservar.label.nombre")}<span class="text-danger">*</span>
          </label>
          <input
            type="text"
            class="form-control"
            value={formData.nombre}
            on:input={handleInput("nombre")}
            on:blur={handleInput("nombre")}
            class:is-invalid={errors.nombre}
            placeholder={t("reservar.placeholder.nombre")}
            disabled={isSubmitting}
          />
          {#if errors.nombre}
            <span class="text-danger">{errors.nombre}</span>
          {/if}
        </div>

        <div class="mb-3">
          <label for="telefono" class="form-label">
            {t("reservar.label.telefono")}<span class="text-danger">*</span>
          </label>
          <input
            type="number"
            class="form-control"
            value={formData.telefono}
            on:input={handleInput("telefono")}
            on:blur={handleInput("telefono")}
            class:is-invalid={errors.telefono}
            placeholder={t("reservar.placeholder.telefono")}
            disabled={isSubmitting}
          />
          {#if errors.telefono}
            <span class="text-danger">{errors.telefono}</span>
          {/if}
        </div>

        <div class="mb-3">
          <label for="email" class="form-label">
            {t("reservar.label.email")}<span class="text-danger">*</span>
          </label>
          <input
            type="email"
            class="form-control"
            value={formData.email}
            on:input={handleInput("email")}
            on:blur={handleInput("email")}
            class:is-invalid={errors.email}
            placeholder={t("reservar.placeholder.email")}
            disabled={isSubmitting}
          />
          {#if errors.email}
            <span class="text-danger">{errors.email}</span>
          {/if}
        </div>
      </div>
    </div>
  </form>
</div>
