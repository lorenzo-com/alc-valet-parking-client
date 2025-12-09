<script>
  import { useTranslatedPath, useTranslations } from "@/i18n/utils";
  import { supabase } from "@/lib/supabase";
  import { z } from "zod";

  // ==========================================
  // CONFIGURACIÓN Y PROPS
  // ==========================================
  export let lang = "es";
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  /**
   * Esquema de validación estricto solo para el email.
   */
  const RECOVERY_SCHEMA = z.object({
    email: z.string().min(1, "required").email("email_invalid"),
  });

  // ==========================================
  // ESTADO DEL COMPONENTE
  // ==========================================
  let email = "";
  let emailError = ""; // Error específico del campo

  let isSubmitting = false;
  let generalError = "";
  let successMessage = false; // Estado para mostrar feedback positivo

  // ==========================================
  // LÓGICA DE VALIDACIÓN
  // ==========================================
  /**
   * Valida el campo email en tiempo real.
   */
  function validateEmail() {
    try {
      RECOVERY_SCHEMA.parse({ email });
      emailError = "";
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const messageKey = err.errors[0].message;
        emailError = t(`login.error.${messageKey}`);
      }
      return false;
    }
  }

  // ==========================================
  // LÓGICA DE NEGOCIO (SUPABASE)
  // ==========================================
  async function handleSubmit() {
    // 1. Validación previa
    if (!validateEmail()) return;

    isSubmitting = true;
    generalError = "";
    successMessage = false;

    try {
      // 2. Construcción de la URL de redirección.
      // Cuando el usuario haga clic en el email, ¿a dónde vuelve?
      // Lo ideal es enviarlo a una página donde pueda establecer su nueva password.
      const redirectTo = `${window.location.origin}${translatePath("/actualizar-password")}`;

      // 3. Llamada a Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });

      if (error) throw error;

      // 4. Éxito: No redirigimos, mostramos mensaje para que revisen su inbox.
      successMessage = true;
      email = ""; // Limpiamos el campo por seguridad/UX
    } catch (error) {
      console.error("Recovery Error:", error.message);

      // Manejo de errores defensivo (rate limits, etc)
      if (error.message.includes("Rate limit")) {
        generalError =
          t("recovery.error.rateLimit") ||
          "Demasiados intentos. Espera un momento.";
      } else {
        generalError =
          t("recovery.error.generic") || "Error al enviar el correo.";
      }
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div
  class="container py-5 min-vh-100 d-flex flex-column justify-content-center"
>
  <div class="row justify-content-center w-100">
    <div class="col-12 col-md-7 col-lg-5">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5">
          <h2 class="text-center fw-bold mb-3 text-dark">
            {t("recovery.title") || "Recuperar Contraseña"}
          </h2>
          <p class="text-center text-muted mb-4 small">
            {t("recovery.subtitle") ||
              "Ingresa tu email y te enviaremos las instrucciones."}
          </p>

          {#if successMessage}
            <div
              class="alert alert-success rounded-3 p-4 text-center"
              role="alert"
            >
              <i
                class="bi bi-envelope-check-fill fs-1 d-block mb-2 text-success"
              ></i>
              <h5 class="alert-heading fw-bold">
                {t("recovery.success.title") || "¡Correo enviado!"}
              </h5>
              <p class="mb-0 small">
                {t("recovery.success.desc") ||
                  "Revisa tu bandeja de entrada (y spam) para restablecer tu acceso."}
              </p>
            </div>

            <div class="text-center mt-3">
              <a
                href={translatePath("/login")}
                class="btn btn-outline-primary rounded-pill px-4"
              >
                {t("recovery.backToLogin") || "Volver al inicio de sesión"}
              </a>
            </div>
          {:else}
            <form on:submit|preventDefault={handleSubmit}>
              <div class="mb-4">
                <label
                  for="email"
                  class="form-label fw-medium text-secondary small"
                >
                  {t("recovery.label.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  class="form-control form-control-lg bg-light-subtle"
                  class:is-invalid={!!emailError}
                  bind:value={email}
                  on:input={validateEmail}
                  on:blur={validateEmail}
                  placeholder={t("recovery.placeholder.email")}
                  disabled={isSubmitting}
                />
                {#if emailError}
                  <div class="invalid-feedback ps-1 fw-medium">
                    {emailError}
                  </div>
                {/if}
              </div>

              {#if generalError}
                <div
                  class="alert alert-danger d-flex align-items-center rounded-3 mb-4 py-2"
                  role="alert"
                >
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
                  {t("loading") || "Enviando..."}
                {:else}
                  {t("recovery.button") || "Enviar enlace de recuperación"}
                {/if}
              </button>
            </form>

            <div class="text-center mt-4">
              <a
                href={translatePath("/login")}
                class="text-decoration-none small fw-bold text-secondary link-primary-hover"
              >
                <i class="bi bi-arrow-left me-1"></i>
                {t("recovery.backToLogin") || "Volver atrás"}
              </a>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Reutilizamos los mismos estilos para consistencia visual */
  .transition-all {
    transition: all 0.2s ease-in-out;
  }
  .form-control:focus {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
    border-color: #86b7fe;
  }
  .bg-light-subtle {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
  }
  .bg-light-subtle:focus {
    background-color: #fff;
  }
  .link-primary-hover:hover {
    color: var(--bs-primary) !important;
    text-decoration: underline !important;
  }
  .invalid-feedback {
    font-size: 0.85em;
    font-weight: 500;
  }
</style>
