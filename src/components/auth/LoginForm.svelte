<script>
  import { supabase } from "@/lib/supabase";
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
<div class="container py-5 min-vh-100 d-flex flex-column justify-content-center">
  <div class="row justify-content-center w-100">
    <!-- Hacemos la columna un poco más estrecha (col-lg-5) para Login, se ve más elegante -->
    <div class="col-12 col-md-7 col-lg-5">
      
      <!-- Card Container: Sombra suave, bordes redondeados -->
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5">
          
          <h2 class="text-center fw-bold mb-4 text-dark">{t("login.title")}</h2>
          
          <form on:submit={handleSubmit}>
            
            <!-- Email -->
            <div class="mb-4">
              <label for="email" class="form-label fw-medium text-secondary small">
                {t("login.label.email")}
              </label>
              <input
                id="email"
                type="email"
                class="form-control form-control-lg bg-light-subtle"
                class:is-invalid={errors.email}
                bind:value={formData.email}
                on:input={handleInput("email")}
                on:blur={handleInput("email")}
                placeholder={t("login.placeholder.email")}
                disabled={isSubmitting}
              />
              {#if errors.email}
                <div class="invalid-feedback ps-1">
                  {errors.email}
                </div>
              {/if}
            </div>

            <!-- Password -->
            <div class="mb-2">
              <label for="password" class="form-label fw-medium text-secondary small">
                {t("login.label.password")}
              </label>
              <input
                id="password"
                type="password"
                class="form-control form-control-lg bg-light-subtle"
                class:is-invalid={errors.password}
                bind:value={formData.password}
                on:input={handleInput("password")}
                on:blur={handleInput("password")}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {#if errors.password}
                <div class="invalid-feedback ps-1">
                  {errors.password}
                </div>
              {/if}
            </div>

            <!-- Forgot Password Link (Aligned Right) -->
            <div class="text-end mb-4">
              <a href="/recuperar" class="text-decoration-none small fw-medium text-primary">
                {t("login.link.forgotPass")}
              </a>
            </div>

            <!-- Global Error Alert -->
            {#if submitError}
              <div class="alert alert-danger d-flex align-items-center rounded-3 mb-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                <div class="small fw-medium">{submitError}</div>
              </div>
            {/if}

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              {:else}
                {t("login.boton")}
              {/if}
            </button>

          </form>
        </div>
      </div>

      <!-- Footer / Register Link -->
      <div class="text-center mt-4 text-muted">
        <small>
          {t("login.legend")} 
          <a href="/registro" class="text-decoration-none fw-bold text-dark link-primary-hover">
            {t("login.link.register")}
          </a>
        </small>
      </div>

    </div>
  </div>
</div>

<style>
  /* Transition utility */
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
  
  /* Inputs Styles: Matching the registration form */
  .form-control:focus {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
    border-color: #86b7fe;
  }

  /* Background subtle for inputs */
  .bg-light-subtle {
    background-color: #f8f9fa; /* Gray-50 */
    border: 1px solid #dee2e6;
  }
  
  .bg-light-subtle:focus {
    background-color: #fff;
  }

  /* Link Hover Effect */
  .link-primary-hover:hover {
    color: var(--bs-primary) !important;
    text-decoration: underline !important;
  }

  /* Override invalid feedback to be simpler */
  .invalid-feedback {
    font-size: 0.85em;
    font-weight: 500;
  }
</style>