<script>
  import { supabase } from "@/lib/supabase";
  import { z } from "zod";

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES
  // ==========================================
  // Props que recibe desde Astro
  export let lang = "es";
  export let translations = {};

  /**
   * Helper simple para traducción.
   * @param {string} key - Clave de traducción.
   */
  const t = (key) => translations[key] || key;

  /**
   * Esquema de validación centralizado.
   * Fácil de extender si en el futuro necesitas validar más campos.
   */
  const LOGIN_SCHEMA = z.object({
    email: z.string().min(1, "emailRequerido").email("emailInvalido"),
    password: z
      .string()
      .min(1, "contrasenyaRequerida")
      .min(6, "contrasenyaCorta"),
  });

  /**
   * Mapeo de errores específicos de Supabase a claves de traducción.
   */
  const SUPABASE_ERROR_MAP = {
    "Invalid login credentials": "login.supabase.incorrectInfo",
    "Email not confirmed": "login.supabase.verify",
  };

  // ==========================================
  // ESTADO DEL COMPONENTE
  // ==========================================
  let formData = { email: "", password: "" };
  let formErrors = { email: "", password: "" }; // Renombrado para mayor claridad

  let isSubmitting = false;
  let generalError = ""; // Error general del formulario

  // ==========================================
  // LÓGICA DE VALIDACIÓN
  // ==========================================
  /**
   * Valida un campo específico y actualiza el estado de errores.
   * @param {keyof formData} field - El nombre del campo (email, password).
   */
  function validateField(field) {
    try {
      // Pick selecciona solo la regla del campo que estamos editando
      LOGIN_SCHEMA.pick({ [field]: true }).parse({ [field]: formData[field] });

      // Si pasa, limpiamos el error de ese campo específicamente
      formErrors[field] = "";
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Tomamos el primer error relevante para ese campo
        const messageKey = err.errors[0].message;
        formErrors[field] = t(`login.error.${messageKey}`);
      }
    }
  }

  /**
   * Valida todo el formulario antes de enviar.
   * @returns {boolean} true si es válido, false si hay errores.
   */
  function isFormValid() {
    try {
      LOGIN_SCHEMA.parse(formData);
      formErrors = { email: "", password: "" }; // Limpieza completa
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Mapeamos todos los errores encontrados al objeto de estado
        const newErrors = { email: "", password: "" };
        err.errors.forEach((e) => {
          // path[0] es el nombre del campo (ej: 'email')
          if (typeof e.path[0] === "string") {
            newErrors[e.path[0]] = t(`login.error.${e.message}`);
          }
        });
        formErrors = newErrors;
      }
      return false;
    }
  }

  // ==========================================
  // MANEJO DE EVENTOS (HANDLERS)
  // ==========================================
  /**
   * Maneja el input del usuario en tiempo real.
   * Se ejecuta en on:input y on:blur.
   */
  function handleInput(e) {
    const field = e.target.id; // Usamos el ID del input para saber qué campo es
    validateField(field);
  }

  /**
   * Proceso principal de Login.
   * Orquesta la validación, llamada a API y redirección.
   */
  async function handleSubmit() {
    // Validación temprana (Fail Fast)
    if (!isFormValid()) return;

    // Preparar UI
    isSubmitting = true;
    generalError = "";

    try {
      // 3. Llamada al servicio (Supabase)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error; // Lanzamos error para manejarlo en el catch unificado

      
        // Éxito y Redirección
        // Nota: Tenemos un store de Svelte escuchando onAuthStateChange,
        // se actualizará solo, pero la redirección la forzamos aquí.
        const targetUrl = lang === "es" ? "/" : `/${lang}/`;
        window.location.href = targetUrl;

    } catch (error) {
      // Manejo centralizado de errores
      handleLoginError(error);
    } finally {
      // Limpieza final (siempre se ejecuta)
      isSubmitting = false;
    }
  }

  /**
   * Traduce el error técnico a un mensaje amigable para el usuario.
   * @param {Error} error - Objeto de error de Supabase o genérico.
   */
  function handleLoginError(error) {
    console.error("Login Error:", error.message); // Log para desarrolladores
    
    // Buscamos en el mapa, si no existe, usamos error genérico
    const translationKey = SUPABASE_ERROR_MAP[error.message] || "login.error.generico";
    
    // Fallback de texto si la traducción falla
    generalError = t(translationKey) || "Ocurrió un error inesperado.";
  }
</script>
<div class="container py-5 min-vh-100 d-flex flex-column justify-content-center">
  <div class="row justify-content-center w-100">
    <div class="col-12 col-md-7 col-lg-5">
      
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5">
          <h2 class="text-center fw-bold mb-4 text-dark">{t("login.title")}</h2>

          <form on:submit|preventDefault={handleSubmit}>
            
            <div class="mb-4">
              <label for="email" class="form-label fw-medium text-secondary small">
                {t("login.label.email")}
              </label>
              <input
                id="email"
                type="email"
                class="form-control form-control-lg bg-light-subtle"
                class:is-invalid={formErrors.email}
                bind:value={formData.email}
                on:input={handleInput}
                on:blur={handleInput}
                placeholder={t("login.placeholder.email")}
                disabled={isSubmitting}
              />
              {#if formErrors.email}
                <div class="invalid-feedback ps-1 fw-medium">
                  {formErrors.email}
                </div>
              {/if}
            </div>

            <div class="mb-2">
              <label for="password" class="form-label fw-medium text-secondary small">
                {t("login.label.password")}
              </label>
              <input
                id="password"
                type="password"
                class="form-control form-control-lg bg-light-subtle"
                class:is-invalid={formErrors.password}
                bind:value={formData.password}
                on:input={handleInput}
                on:blur={handleInput}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
              {#if formErrors.password}
                <div class="invalid-feedback ps-1 fw-medium">
                  {formErrors.password}
                </div>
              {/if}
            </div>

            <div class="text-end mb-4">
              <a href="/recuperar" class="text-decoration-none small fw-medium text-primary">
                {t("login.link.forgotPass")}
              </a>
            </div>

            {#if generalError}
              <div class="alert alert-danger d-flex align-items-center rounded-3 mb-4 py-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <div class="small fw-medium">{generalError}</div>
              </div>
            {/if}

            <button
              type="submit"
              class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm transition-all"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <span class="spinner-border spinner-border-sm me-2"></span>
                Loading...
              {:else}
                {t("login.boton")}
              {/if}
            </button>

          </form>
        </div>
      </div>

      <div class="text-center mt-4 text-muted">
        <small>
          {t("login.legend")}
          <a
            href={lang === "es" ? "/registro" : `/${lang}/registro`}
            class="text-decoration-none fw-bold text-dark link-primary-hover"
          >
            {t("login.link.register")}
          </a>
        </small>
      </div>

    </div>
  </div>
</div>

<style>
  /* UTILIDADES VISUALES */
  .transition-all { transition: all 0.2s ease-in-out; }

  /* ESTILO DE INPUTS (Modern SaaS Look) */
  .form-control:focus {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
    border-color: #86b7fe;
  }
  .bg-light-subtle {
    background-color: #f8f9fa; /* Gray-50 */
    border: 1px solid #dee2e6;
  }
  .bg-light-subtle:focus {
    background-color: #fff;
  }

  /* ESTILO DE ENLACES */
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
