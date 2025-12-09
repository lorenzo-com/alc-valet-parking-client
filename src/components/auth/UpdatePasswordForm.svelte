<script>
  import { supabase } from "@/lib/supabase";
  import { z } from "zod";

  // ==========================================
  // CONFIGURACIÓN Y PROPS
  // ==========================================
  export let lang = "es";
  export let translations = {};

  const t = (key) => translations[key] || key;

  /**
   * Esquema de validación para cambio de contraseña.
   * Incluye confirmación para evitar errores de tipeo.
   */
  const PASSWORD_SCHEMA = z
    .object({
      password: z.string().min(6, "password_min"),
      confirmPassword: z.string().min(6, "password_min"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "passwords_mismatch",
      path: ["confirmPassword"], // El error aparecerá en este campo
    });

  // ==========================================
  // ESTADO DEL COMPONENTE
  // ==========================================
  let formData = { password: "", confirmPassword: "" };
  let formErrors = {};
  
  let isSubmitting = false;
  let generalError = "";
  let success = false;

  // ==========================================
  // VALIDACIÓN
  // ==========================================
  /**
   * Valida un campo individualmente (solo longitud, no coincidencia aún).
   */
  function validateField(field) {
    // Validamos longitud básica
    if (formData[field].length < 6) {
       formErrors[field] = t("login.error.password_min");
    } else {
       formErrors[field] = "";
    }
    
    // Si estamos editando la confirmación, validamos si coinciden en tiempo real
    if (field === 'confirmPassword' && formData.password !== formData.confirmPassword) {
        formErrors.confirmPassword = t("login.error.passwords_mismatch");
    }
  }

  // ==========================================
  // LÓGICA DE NEGOCIO (SUPABASE)
  // ==========================================
  async function handleSubmit() {
    // 1. Validación completa con Zod (incluye el .refine de coincidencia)
    try {
      PASSWORD_SCHEMA.parse(formData);
      formErrors = {};
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((e) => {
          if (typeof e.path[0] === "string") {
            newErrors[e.path[0]] = t(`login.error.${e.message}`);
          }
        });
        formErrors = newErrors;
      }
      return;
    }

    isSubmitting = true;
    generalError = "";

    try {
      // 2. Actualizar usuario en Supabase
      // Nota: Como el usuario llegó por el Magic Link, ya tiene una sesión activa temporal.
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) throw error;

      // 3. Éxito
      success = true;
      
      // 4. Redirección automática tras breve pausa para UX
      setTimeout(() => {
        const targetUrl = lang === "es" ? "/" : `/${lang}/`;
        window.location.href = targetUrl; 
      }, 2000);

    } catch (error) {
      console.error("Update Password Error:", error.message);
      generalError = t("recovery.error.updateFailed") || "No se pudo actualizar la contraseña. El enlace puede haber expirado.";
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="container py-5 min-vh-100 d-flex flex-column justify-content-center">
  <div class="row justify-content-center w-100">
    <div class="col-12 col-md-7 col-lg-5">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5">

          <h2 class="text-center fw-bold mb-4 text-dark">
            {t("recovery.updateTitle") || "Nueva contraseña"}
          </h2>

          {#if success}
            <div class="alert alert-success text-center rounded-3 py-4">
              <i class="bi bi-check-circle-fill fs-1 d-block mb-2 text-success"></i>
              <h5 class="fw-bold">{t("recovery.successUpdate") || "¡Contraseña actualizada!"}</h5>
              <p class="mb-0 small">{t("recovery.redirecting") || "Redirigiendo al inicio..."}</p>
            </div>
          {:else}
            <form on:submit|preventDefault={handleSubmit}>
              
              <div class="mb-3">
                <label for="password" class="form-label fw-medium text-secondary small">
                   {t("recovery.label.newPassword") || "Nueva contraseña"}
                </label>
                <input
                  id="password"
                  type="password"
                  class="form-control form-control-lg bg-light-subtle"
                  class:is-invalid={!!formErrors.password}
                  bind:value={formData.password}
                  on:input={() => validateField('password')}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                {#if formErrors.password}
                  <div class="invalid-feedback ps-1 fw-medium">{formErrors.password}</div>
                {/if}
              </div>

              <div class="mb-4">
                <label for="confirmPassword" class="form-label fw-medium text-secondary small">
                  {t("recovery.label.confirmPassword") || "Confirmar contraseña"}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  class="form-control form-control-lg bg-light-subtle"
                  class:is-invalid={!!formErrors.confirmPassword}
                  bind:value={formData.confirmPassword}
                  on:input={() => validateField('confirmPassword')}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
                {#if formErrors.confirmPassword}
                  <div class="invalid-feedback ps-1 fw-medium">{formErrors.confirmPassword}</div>
                {/if}
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
                  {t("loading")}
                {:else}
                  {t("recovery.button.update") || "Actualizar contraseña"}
                {/if}
              </button>
            </form>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Mismos estilos que LoginForm y RecoveryForm para coherencia */
  .transition-all { transition: all 0.2s ease-in-out; }
  .form-control:focus {
    box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
    border-color: #86b7fe;
  }
  .bg-light-subtle {
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
  }
  .bg-light-subtle:focus { background-color: #fff; }
  .invalid-feedback { font-size: 0.85em; font-weight: 500; }
</style>