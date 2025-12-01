<script>
  import { supabase } from "../../lib/supabase";
  import { z } from "zod";

  // Props que recibe desde Astro
  export let lang = "es";
  export let translations = {};

  // Helper para obtener traducciones
  function t(key) {
    return translations[key] || key;
  }

  // Schema de validación con Zod
  const loginSchema = z.object({
    email: z.string().min(1, "emailRequerido").email("emailInvalido"),
    password: z
      .string()
      .min(1, "contrasenyaRequerida")
      .min(6, "contrasenyaCorta"),
  });

  // Estado del formulario
  let formData = {
    email: "",
    password: "",
  };

  // Errores de validación
  let errors = {
    email: "",
    password: "",
  };

  // Estado del formulario
  let isSubmitting = false;
  let submitError = "";

  // Validar campo individual con Zod
  function validateField(field, value) {
    try {
      // Validar solo ese campo
      loginSchema.pick({ [field]: true }).parse({ [field]: value });

      // Si no hay error, limpiar el mensaje
      errors[field] = "";
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = err.errors[0];
        // Usar el mensaje del error como clave de traducción
        errors[field] = t(`login.error.${fieldError.message}`);
      }
    }
  }

  // Validar todo el formulario con Zod
  function validateForm() {
    try {
      loginSchema.parse(formData);

      // Limpiar todos los errores
      errors = {
        email: "",
        password: "",
      };

      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Resetear errores
        errors = {
          email: "",
          password: "",
        };

        // Mapear errores de Zod a nuestro objeto de errores
        err.errors.forEach((error) => {
          const field = error.path[0];
          if (field in errors) {
            errors[field] = t(`login.error.${error.message}`);
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    isSubmitting = true;
    submitError = ""; // Limpiamos errores anteriores

    try {
      // Llamada a Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        switch (error.message) {
          case "Invalid login credentials":
            // Esto pasa si el email no existe O la contraseña está mal (por seguridad no especifica)
            submitError = t("login.supabase.incorrectInfo");
            break;

          case "Email not confirmed":
            submitError = t("login.supabase.verify");
            break;

          default:
            // Error genérico
            submitError =
              t("login.error.generico") ||
              "Ocurrió un error al iniciar sesión. Inténtalo de nuevo.";
        }
      } else {
        // Éxito: Redirigimos
        // Nota: Tenemos un store de Svelte escuchando onAuthStateChange,
        // se actualizará solo, pero la redirección la forzamos aquí.
        const targetUrl = lang === "es" ? "/" : `/${lang}/`;
        window.location.href = targetUrl;
      }
    } catch (error) {
      console.error("Error al enviar el formulario: " + error);
      submitError = t("reservar.error.errorConexion");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container">
  <div class="form-container">
    <h2>{t("login.title")}</h2>
    <form on:submit={handleSubmit} class="row g-3">
      <div class="col-12 mb-3">
        <label for="email" class="form-label"
          >{t("login.label.email")}<span class="text-danger">*</span></label
        >
        <input
          id="email"
          type="email"
          class="form-control"
          class:is-invalid={errors.email}
          bind:value={formData.email}
          on:input={handleInput("email")}
          on:blur={handleInput("email")}
          placeholder={t("login.placeholder.email")}
          disabled={isSubmitting}
        />
        {#if errors.email}
          <span class="text-danger">{errors.email}</span>
        {/if}
      </div>

      <div class="col-12 mb-3">
        <label for="password"
          >{t("login.label.password")}<span class="text-danger">*</span></label
        >
        <input
          id="password"
          type="password"
          class="form-control"
          class:is-invalid={errors.password}
          bind:value={formData.password}
          on:input={handleInput("password")}
          on:blur={handleInput("password")}
          placeholder="****"
          disabled={isSubmitting}
        />
        {#if errors.password}
          <span class="text-danger">{errors.password}</span>
        {/if}
      </div>

      <div>
        <a href="/recuperar">{t("login.link.forgotPass")}</a>
      </div>

      {#if submitError}
        <div class="col-12 mt-3">
          <div
            class="alert alert-danger d-flex align-items-center"
            role="alert"
          >
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <div>{submitError}</div>
          </div>
        </div>
      {/if}
      <button
        type="submit"
        class="btn btn-primary mt-3"
        disabled={isSubmitting}
      >
        {t("login.boton")}
      </button>

      <p class="foot">
        {t("login.legend")} <a href="/registro">{t("login.link.register")}</a>
      </p>
    </form>
  </div>
</div>

<style>
  /* Contenedor principal */
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    width: 100%;
    padding: 20px;
  }
  .form-container {
    width: 100%;
    max-width: 700px; /* Mayor anchura en pantallas grandes */
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* Más prominente */
    background-color: #fff;
  }

  .error-message {
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  /* Estilo para dispositivos pequeños */
  @media (max-width: 768px) {
    .container {
      width: 100%;
      padding: 15px;
      box-shadow: none;
    }
  }
</style>
