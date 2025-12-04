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

    let userType = "PARTICULAR"; // 'PARTICULAR' | 'COMPANY'
    let isLoading = false;

    // Estado del formulario
    let formData = {
        email: "",
        password: "",
        passwordConfirm: "",
        fullName: "",
        cif: "",
        address: "",
        phone: "",
        howFound: "",
        vehicle: {
            brand: "",
            model: "",
            color: "",
            license: "",
        },
    };

    function setUserType(type) {
        userType = type;
    }

    const onSubmit = async () => {
        loading = true;
        errorMessage = "";

        // REGISTRO
        // Esto dispara el Trigger que crea el registro en clientes, usuarios y auth de supabase
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre: nombre,
                    telefono: telefono,
                    nos_conociste: nosConociste,
                    cif: esEmpresa ? cif : null,
                    direccion: esEmpresa ? direccion : null,
                },
            },
        });

        // Si el trigger falla (ej: email duplicado), el error sale aquí
        if (error) {
            errorMessage = error.message;
            loading = false;
            return;
        }

        loading = false;
    };
</script>

<div class="container py-5">
    <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
            <div class="card border-0 shadow-sm rounded-4">
                <div class="card-body p-4 p-md-5">
                    <h2 class="text-center fw-bold mb-4 text-dark"></h2>
                    <div class="d-flex justify-content-center mb-4">
                        <div
                            class="bg-light p-1 rounded-3 d-inline-flex w-100 w-md-auto"
                        >
                            <button
                                class="btn flex-fill px-4 fw-medium rounded-3 transition-all {userType ===
                                'PARTICULAR'
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-muted border-0'}"
                                on:click={() => setUserType("PARTICULAR")}
                                >{t("Particular")}
                            </button>
                            <button
                                class="btn flex-fill px-4 fw-medium rounded-3 transition-all {userType ===
                                'COMPANY'
                                    ? 'bg-white shadow-sm text-primary'
                                    : 'text-muted border-0'}"
                                on:click={() => setUserType("COMPANY")}
                            >
                                {t("Company")}
                            </button>
                        </div>
                    </div>

                    <form on:submit|preventDefault={onSubmit}>
                        <div class="row g-3">
                            <div class="col-12">
                                <label
                                    for="email"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("E-MAIL ADDRESS")}</label
                                >
                                <input
                                    type="email"
                                    id="email"
                                    class="form-control form-control-lg bg-light-subtle"
                                    bind:value={formData.email}
                                    placeholder="tu@email.com"
                                    required
                                />
                            </div>
                            <div class="col-12 col-md-6">
                                <label
                                    for="password"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("PASSWORD")}</label
                                >
                                <input
                                    type="password"
                                    id="password"
                                    class="form-control form-control-lg bg-light-subtle"
                                    bind:value={formData.password}
                                    placeholder="****"
                                    required
                                    minlength="8"
                                />
                            </div>
                            <div class="col-12 col-md-6">
                                <label
                                    for="passwordConfirm"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("CONFIRM PASSWORD")}</label
                                >
                                <input
                                    type="password"
                                    id="passwordConfirm"
                                    class="form-control form-control-lg bg-light-subtle"
                                    bind:value={formData.passwordConfirm}
                                    placeholder="****"
                                    required
                                />
                            </div>
                            <div class="col-12">
                                <label
                                    for="fullName"
                                    class="form-label fw-medium text-secondary small"
                                >
                                    {userType === "COMPANY"
                                        ? t("Social Reason")
                                        : t("Full Name")}
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    class="form-control form-control-lg bg-light-subtle"
                                    bind:value={formData.fullName}
                                    required
                                />
                            </div>

                            {#if userType === "COMPANY"}
                                <div class="col-12 col-md-6">
                                    <label
                                        for="cif"
                                        class="form-label fw-medium text-secondary small"
                                        >{t("CIF")}</label
                                    >
                                    <input
                                        type="text"
                                        id="cif"
                                        class="form-control form-control-lg bg-light-subtle"
                                        bind:value={formData.cif}
                                        required
                                    />
                                </div>
                                <div class="col-12 col-md-6">
                                    <label
                                        for="address"
                                        class="form-label fw-medium text-secondary small"
                                        >{t("Full Address")}</label
                                    >
                                    <input
                                        type="text"
                                        id="address"
                                        class="form-control form-control-lg bg-light-subtle"
                                        bind:value={formData.address}
                                        required
                                    />
                                </div>
                            {/if}

                            <div class="col-12 col-md-6">
                                <label
                                    for="phone"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("Telephone")}</label
                                >
                                <input
                                    type="tel"
                                    id="phone"
                                    class="form-control form-control-lg bg-light-subtle"
                                    bind:value={formData.phone}
                                    required
                                />
                            </div>
                            <div class="col-12 col-md-6">
                                <label
                                    for="howFound"
                                    class="form-label fw-medium text-secondary small"
                                    >{t("How did you find us?")}</label
                                >
                                <select
                                    id="howFound"
                                    class="form-select form-select-lg bg-light-subtle"
                                    bind:value={formData.howFound}
                                    required
                                >
                                    <option value="" disabled selected
                                        >{t("Select option")}</option
                                    >
                                    <option value="Google">Google</option>
                                    <option value="Friend"
                                        >{t("A friend")}</option
                                    >
                                </select>
                            </div>
                        </div>

                        <div class="mt-5">
                            <button
                                type="submit"
                                class="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm"
                                disabled={isLoading}
                            >
                                {#if isLoading}
                                    <span
                                        class="spinner-border spinner-border-sm me-2"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    {t("LOADING...")}
                                {:else}
                                    {t("Register")}
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <div class="text-center mt-3 text-muted">
                <small
                    >{t("Already have an account?")}
                    <a
                        href={lang === "es" ? "/login" : `/${lang}/login`}
                        class="text-decoration-none fw-bold">{t("Log in")}</a
                    ></small
                >
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
