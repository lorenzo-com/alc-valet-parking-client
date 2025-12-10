<script>
  import { user } from "@/stores/auth"; // Importamos el estado global
  import { useTranslatedPath, useTranslations } from "@/i18n/utils";
  import { z } from "zod";

  // Props que recibe desde Astro
  export let lang = "es";
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  // Schema de validación con Zod
  const reservaSchema = z.object({
    nombre: z.string().min(1, "nombreRequerido"),

    email: z.string().min(1, "emailRequerido").email("emailInvalido"),

    telefono: z.string().min(1, "telefonoRequerido"),

    comoNosConoce: z.string().min(1, "comoNosConoceRequerido"),

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

    comentarios: z.string().optional(),
  });

  // Estado del formulario
  let formData = {
    nombre: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    comoNosConoce: "",
    comentarios: "",
  };

  // Errores de validación
  let errors = {
    nombre: "",
    email: "",
    telefono: "",
    fecha: "",
    hora: "",
    comoNosConoce: "",
  };

  // Estado del formulario
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = "";

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
        comoNosConoce: "",
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
          comoNosConoce: "",
        };

        // Mapear errores de Zod a nuestro objeto de errores
        err.errors.forEach((error) => {
          const field = error.path[0];
          if (field in errors) {
            errors[field] = t(`reservar.error.${error.message}`);
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
          locale: lang,
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
          comentarios: "",
          comoNosConoce: "",
        };
        errors = {
          nombre: "",
          email: "",
          telefono: "",
          fecha: "",
          hora: "",
          comoNosConoce: "",
        };
      } else {
        submitError = t("reservar.error.errorEnvio");
      }
    } catch (error) {
      submitError = t("reservar.error.errorConexion");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  class="bg-primary d-flex justify-content-center py-4 border-top border border-light"
>
  <h2 class="m-0 text-light">{t("reservar.title")}</h2>
</div>

<div class="container my-5">
  <form on:submit={handleSubmit} novalidate>
    <!-- Si el usuario no ha iniciado sesión, le mostramos un "call to action" -->
    {#if !$user}
    <div class="border-2 border-primary p-4 mb-3">
      <h2 class="fs-4 mb-3 text-center">{t("reservar.title.calltoaction")}</h2>
      <div class="text-center">
        <a href={translatePath("/login")} class="btn btn-outline-primary me-2">
          {t("reservar.login")}
        </a>
        <a href={translatePath("/registro")} class="btn btn-primary text-light">
          {t("reservar.register")}
        </a>
      </div>
    </div>
    {/if}

    <!-- Datos de la reserva -->
    <div class="border-2 border-primary p-4">
      <h2 class="fs-2">{t("reservar.subtitle")}</h2>
      <div class="row row-cols-1 row-cols-md-2"></div>
    </div>

    <!-- Precio a pagar -->
    <div class="border-2 border-primary p-4 mt-3">
      <h2 class="fs-2">{t("reservar.fee")}</h2>
      <div>
        <div class="text-center text-light py-2" style="background: #ff7908ba;">
          <span class="fs-3">0 €</span>
        </div>
      </div>
    </div>

    <!-- Formulario para los NO autenticados -->
    <div class="border-2 border-primary p-4 mt-3">
      <!-- TODO: Validar que no este autenticado el usuario -->
      <h2 class="fs-2">{t("reservar.title.userInfo")}</h2>
      <div class="d-flex justify-content-center gap-3 mb-3">
        <button class="btn btn-primary">{t("reservar.particular")}</button>
        <button class="btn btn-primary">{t("reservar.company")}</button>
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

        <div class="mb-3">
          <label for="como nos has conocido" class="form-label"
            >¿Cómo nos ha conocido?<span class="text-danger">*</span></label
          >
          <select
            class="form-select"
            bind:value={formData.comoNosConoce}
            on:blur={handleInput("comoNosConoce")}
            on:change={handleInput("comoNosConoce")}
            class:is-invalid={errors.comoNosConoce}
            disabled={isSubmitting}
          >
            <option value="" disabled
              >{t("reservar.comoNosConoce.seleccionar")}</option
            >
            <option value="Ya soy cliente"
              >{t("comoNosConoce.yaSoyCliente")}</option
            >
            <option value="Google">Google</option>
            <option value="Un amigo">{t("comoNosConoce.unAmigo")}</option>
            <option value="Internet">Internet</option>
          </select>
          {#if errors.comoNosConoce}
            <span class="text-danger">{errors.comoNosConoce}</span>
          {/if}
        </div>
      </div>
    </div>
    <button type="submit" class="btn btn-primary mt-3" disabled={isSubmitting}>
      {#if isSubmitting}
        {t("reservas.botones.enviando")}
      {:else}
        {t("reservar.boton.confirmarReserva")}
      {/if}
    </button>
  </form>
</div>
