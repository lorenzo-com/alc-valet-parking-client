<script>
    import { useTranslatedPath, useTranslations } from "@/i18n/utils";
    import { supabase } from "@/lib/supabase";
    import { z } from "zod";

    // ==========================================
    // CONFIGURACIÓN Y CONSTANTES
    // ==========================================
    // Props que recibe desde Astro
    export let lang = "es";
    const t = useTranslations(lang);
    const translatePath = useTranslatedPath(lang);

    /**
     * Modos de interfaz de usuario.
     * IMPORTANTE: Esto solo controla el estado visual (tabs), no se envía al backend.
     * El backend inferirá el tipo de usuario basándose en si 'cif' y 'direccion' son null o no.
     */
    const UI_MODES = {
        PARTICULAR: "PARTICULAR",
        COMPANY: "COMPANY",
    };

    /**
     * Esquema de Validación Zod.
     * Utilizamos `superRefine` para validaciones que dependen de otros campos.
     */
    const REGISTER_SCHEMA = z.object({
        email: z.string().min(1, "required").email("email_invalid"),
        password: z.string().min(6, "password_min"),
        fullName: z.string().min(1, "name_required"),
        phone: z.string().min(1, "phone_required"),
        howFound: z.string().min(1, "howFound_required"),

        // Control de UI (necesario para la lógica condicional de abajo)
        userType: z.enum([UI_MODES.PARTICULAR, UI_MODES.COMPANY]),

        // Campos opcionales por defecto (se hacen obligatorios en superRefine)
        cif: z.string().optional(),
        address: z.string().optional(),
    });

    // ==========================================
    // ESTADO DEL COMPONENTE
    // ==========================================
    let formData = {
        userType: UI_MODES.PARTICULAR, // Estado inicial: Particular
        email: "",
        password: "",
        fullName: "",
        cif: "",
        address: "",
        phone: "",
        howFound: "",
    };
    let formErrors = {};

    let isSubmitting = false;
    let generalError = ""; // Error general del formulario

    // ==========================================
    // LÓGICA DE VALIDACIÓN
    // ==========================================
    /**
     * Valida un campo específico usando .pick() del esquema.
     * Nota: .pick() ignora el superRefine, por lo que aquí validamos formato básico (email, longitud).
     * Las validaciones complejas (password match, condicionales) ocurren en el submit.
     */
    function validateField(field) {
        try {
            // Pick selecciona solo la regla del campo que estamos editando
            REGISTER_SCHEMA.pick({ [field]: true }).parse({
                [field]: formData[field],
            });

            // Si pasa, limpiamos el error de ese campo específicamente
            formErrors[field] = "";
        } catch (err) {
            if (err instanceof z.ZodError) {
                // Tomamos el primer error relevante para ese campo
                const messageKey = err.errors[0].message;
                formErrors[field] = t(`register.error.${messageKey}`);
            }
        }
    }

    /**
     * Valida todo el formulario antes de enviar (incluyendo superRefine).
     * @returns {boolean} true si es válido, false si hay errores.
     */
    function isFormValid() {
        try {
            REGISTER_SCHEMA.parse(formData);
            formErrors = {}; // Limpieza completa
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                // Mapeamos todos los errores encontrados al objeto de estado
                const newErrors = {};
                err.errors.forEach((e) => {
                    // path[0] es el nombre del campo (ej: 'email')
                    if (typeof e.path[0] === "string") {
                        newErrors[e.path[0]] = t(`register.error.${e.message}`);
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

    function setUiMode(mode) {
        formData.userType = mode;
        // Limpiamos errores al cambiar de pestaña para evitar bloqueos visuales
        formErrors = {};
    }

    async function handleSubmit() {
        // Validación temprana (Fail Fast)
        if (!isFormValid()) return;

        // Preparar UI
        isSubmitting = true;
        generalError = "";

        try {
            // Preparamos payload (lógica de negocio: limpiar datos de empresa si es particular)
            const isCompany = formData.userType === UI_MODES.COMPANY;
            const payload = {
                nombre: formData.fullName,
                telefono: formData.phone,
                nos_conociste: formData.howFound,
                cif: isCompany ? formData.cif : null,
                direccion: isCompany ? formData.address : null,
            };

            // Llamada al servicio (Supabase)
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: { data: payload },
            });

            console.error(error);
            console.log(data);
            if (error) throw error; // Lanzamos error para manejarlo en el catch unificado

            // Si identities es un array vacío, el usuario ya existe.
            if (
                data.user &&
                data.user.identities &&
                data.user.identities.length === 0
            ) {
                throw new Error("User already registered");
            }

            // Éxito y Redirección
            // Nota: Tenemos un store de Svelte escuchando onAuthStateChange,
            // se actualizará solo, pero la redirección la forzamos aquí.
            window.location.href = translatePath("/login");
        } catch (error) {
            console.error("Error en el registro:", error); // Log para desarrolladores

            if (error.message === "User already registered") {
                generalError =
                    t("register.error.email_exists") ||
                    "Este correo ya está registrado.";
            } else {
                handleRegisterError(error);
            }
        } finally {
            // Limpieza final (siempre se ejecuta)
            isSubmitting = false;
        }
    }

    /**
     * Traduce el error técnico a un mensaje amigable para el usuario.
     * @param {Error} error - Objeto de error de Supabase o genérico.
     */
    function handleRegisterError(error) {
        // Buscamos en el mapa, si no existe, usamos error genérico
        const translationKey =
            SUPABASE_ERROR_MAP[error.message] || "login.error.generic";

        // Fallback de texto si la traducción falla
        generalError = t(translationKey) || "Ocurrió un error inesperado.";
    }
</script>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4 p-md-5">
                    <h2 class="text-center fw-bold mb-4 text-dark">
                        {t("title.register")}
                    </h2>

                    <div class="d-flex justify-content-center mb-4">
                        <div
                            class="bg-light p-1 rounded-3 d-inline-flex w-100 w-md-auto"
                        >
                            <button
                                type="button"
                                class="btn flex-fill px-4 fw-medium rounded-3 transition-all {formData.userType ===
                                UI_MODES.PARTICULAR
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-muted border-0'}"
                                on:click={() => setUiMode(UI_MODES.PARTICULAR)}
                            >
                                {t("register.particular")}
                            </button>
                            <button
                                type="button"
                                class="btn flex-fill px-4 fw-medium rounded-3 transition-all {formData.userType ===
                                UI_MODES.COMPANY
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-muted border-0'}"
                                on:click={() => setUiMode(UI_MODES.COMPANY)}
                            >
                                {t("register.empresa")}
                            </button>
                        </div>
                    </div>

                    <form on:submit|preventDefault={handleSubmit} novalidate>
                        <div class="row g-3">
                            <div class="col-12">
                                <label
                                    for="email"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("register.label.email")}</label
                                >
                                <input
                                    type="email"
                                    id="email"
                                    class="form-control form-control-lg bg-light-subtle"
                                    class:is-invalid={formErrors.email}
                                    bind:value={formData.email}
                                    on:input={handleInput}
                                    on:blur={handleInput}
                                    placeholder={t(
                                        "register.placeholder.email",
                                    )}
                                />
                                {#if formErrors.email}
                                    <div
                                        class="invalid-feedback ps-1 fw-medium"
                                    >
                                        {formErrors.email}
                                    </div>
                                {/if}
                            </div>

                            <div class="col-12">
                                <label
                                    for="password"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("register.label.password")}</label
                                >
                                <input
                                    type="password"
                                    id="password"
                                    class="form-control form-control-lg bg-light-subtle"
                                    class:is-invalid={formErrors.password}
                                    bind:value={formData.password}
                                    on:input={handleInput}
                                    on:blur={handleInput}
                                    placeholder="••••••••"
                                />
                                {#if formErrors.password}
                                    <div
                                        class="invalid-feedback ps-1 fw-medium"
                                    >
                                        {formErrors.password}
                                    </div>
                                {/if}
                            </div>

                            <div class="col-12">
                                <label
                                    for="fullName"
                                    class="form-label fw-medium text-secondary small"
                                >
                                    {formData.userType === UI_MODES.COMPANY
                                        ? t("register.label.socialReason")
                                        : t("register.label.name")}
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    class="form-control form-control-lg bg-light-subtle"
                                    class:is-invalid={formErrors.fullName}
                                    bind:value={formData.fullName}
                                    on:input={handleInput}
                                    on:blur={handleInput}
                                    placeholder={formData.userType ===
                                    UI_MODES.COMPANY
                                        ? t("register.placeholder.socialReason")
                                        : t("register.placeholder.name")}
                                />
                                {#if formErrors.fullName}
                                    <div
                                        class="invalid-feedback ps-1 fw-medium"
                                    >
                                        {formErrors.fullName}
                                    </div>
                                {/if}
                            </div>

                            <!-- EMPRESA FIELDS (Conditional) -->
                            {#if formData.userType === UI_MODES.COMPANY}
                                <div class="col-12 col-md-6">
                                    <label
                                        for="cif"
                                        class="form-label fw-medium text-secondary small"
                                        >{t("register.label.cif")}</label
                                    >
                                    <input
                                        type="text"
                                        id="cif"
                                        class="form-control form-control-lg bg-light-subtle"
                                        class:is-invalid={formErrors.cif}
                                        bind:value={formData.cif}
                                        on:input={handleInput}
                                        on:blur={handleInput}
                                        placeholder={t(
                                            "register.placeholder.cif",
                                        )}
                                    />
                                    {#if formErrors.cif}
                                        <div
                                            class="invalid-feedback ps-1 fw-medium"
                                        >
                                            {formErrors.cif}
                                        </div>
                                    {/if}
                                </div>
                                <div class="col-12 col-md-6">
                                    <label
                                        for="address"
                                        class="form-label fw-medium text-secondary small"
                                        >{t("register.label.address")}</label
                                    >
                                    <input
                                        type="text"
                                        id="address"
                                        class="form-control form-control-lg bg-light-subtle"
                                        class:is-invalid={formErrors.address}
                                        bind:value={formData.address}
                                        on:input={handleInput}
                                        on:blur={handleInput}
                                        placeholder={t(
                                            "register.placeholder.address",
                                        )}
                                    />
                                    {#if formErrors.address}
                                        <div
                                            class="invalid-feedback ps-1 fw-medium"
                                        >
                                            {formErrors.address}
                                        </div>
                                    {/if}
                                </div>
                            {/if}

                            <div class="col-12 col-md-6">
                                <label
                                    for="phone"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("register.label.phone")}</label
                                >
                                <input
                                    type="tel"
                                    id="phone"
                                    class="form-control form-control-lg bg-light-subtle"
                                    class:is-invalid={formErrors.phone}
                                    bind:value={formData.phone}
                                    on:input={handleInput}
                                    on:blur={handleInput}
                                    placeholder={t(
                                        "register.placeholder.phone",
                                    )}
                                />
                                {#if formErrors.phone}
                                    <div
                                        class="invalid-feedback ps-1 fw-medium"
                                    >
                                        {formErrors.phone}
                                    </div>
                                {/if}
                            </div>

                            <div class="col-12 col-md-6">
                                <label
                                    for="howFound"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("register.label.howFound")}</label
                                >
                                <select
                                    id="howFound"
                                    class="form-select form-select-lg bg-light-subtle"
                                    class:is-invalid={formErrors.howFound}
                                    bind:value={formData.howFound}
                                    on:change={handleInput}
                                    on:blur={handleInput}
                                >
                                    <option value="" disabled selected
                                        >{t(
                                            "register.placeholder.howFound",
                                        )}</option
                                    >
                                    <option value="Ya soy cliente"
                                        >{t(
                                            "nosConociste.yaSoyCliente",
                                        )}</option
                                    >
                                    <option value="Google">Google</option>
                                    <option value="Un amigo"
                                        >{t("nosConociste.unAmigo")}</option
                                    >
                                    <option value="Internet">Internet</option>
                                </select>
                                {#if formErrors.howFound}
                                    <div
                                        class="invalid-feedback ps-1 fw-medium"
                                    >
                                        {formErrors.howFound}
                                    </div>
                                {/if}
                            </div>
                        </div>

                        {#if generalError}
                            <div
                                class="alert alert-danger d-flex align-items-center mt-4 rounded-3 py-2"
                                role="alert"
                            >
                                <i class="bi bi-exclamation-triangle-fill me-2"
                                ></i>
                                <div class="small fw-medium">
                                    {generalError}
                                </div>
                            </div>
                        {/if}

                        <div class="mt-4">
                            <button
                                type="submit"
                                class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm transition-all"
                                disabled={isSubmitting}
                            >
                                {#if isSubmitting}
                                    <span
                                        class="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    {t("loading")}
                                {:else}
                                    {t("title.register")}
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="text-center mt-3 text-muted">
                <small>
                    {t("register.link.login")}
                    <a
                        href={translatePath("/login")}
                        class="text-decoration-none fw-bold link-primary-hover"
                    >
                        {t("login.link")}
                    </a>
                </small>
            </div>
        </div>
    </div>
</div>

<style>
    /* Pequeños ajustes que Bootstrap estándar no tiene */
    .transition-all {
        transition: all 0.2s ease-in-out;
    }

    /* Inputs más modernos: Focus ring más suave */
    .form-control:focus,
    .form-select:focus {
        box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
        border-color: #86b7fe;
    }

    /* Color de fondo sutil para inputs */
    .bg-light-subtle {
        background-color: #f8f9fa; /* Gray-50 */
    }

    .bg-light-subtle:focus {
        background-color: #fff;
    }
</style>
