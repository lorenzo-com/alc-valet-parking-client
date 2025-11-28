<script lang="ts">
    import { supabase } from "@/lib/supabase";

    let loading = false;
    let errorMessage = "";

    // Datos del formulario
    let email = "";
    let password = "";
    let nombre = "";
    let telefono = "";
    let nosConociste = "";

    // Datos de empresa
    let esEmpresa = false; // Si el cliente es empresa tiene dos campos extra
    let cif = "";
    let direccion = "";

    const handleRegister = async () => {
        loading = true;
        errorMessage = "";

        // REGISTRO
        // Esto dispara el Trigger que crea el registro en clientes, usuarios y auth de supabase
        const { error } = await supabase.auth.signUp(
            {
                email,
                password,
                options: {
                    data: {
                        nombre: nombre,
                        telefono: telefono,
                        nos_conociste: nosConociste,
                        cif: esEmpresa ? cif : null,
                        direccion: esEmpresa ? direccion : null
                    },
                },
            },
        );

        // Si el trigger falla (ej: email duplicado), el error sale aquí
        if (error) {
            errorMessage = error.message;
            loading = false;
            return;
        }

        loading = false;
    };
</script>

<form on:submit|preventDefault={handleRegister} class="auth-form">
    <h3>Crear Cuenta</h3>

    <div class="field">
        <label>Email</label>
        <input type="email" bind:value={email} required />
    </div>

    <div class="field">
        <label>Contraseña</label>
        <input type="password" bind:value={password} required minlength="6" />
    </div>

    <div class="field">
        <label>Nombre Completo</label>
        <input type="text" bind:value={nombre} required />
    </div>

    <div class="field">
        <label>Teléfono</label>
        <input type="tel" bind:value={telefono} required />
    </div>

    <div class="field">
        <label>¿Cómo nos has conocido?</label>
        <select bind:value={nosConociste}>
            <option value="">Selecciona una opción...</option>
            <option value="Google">Búsqueda en Google</option>
            <option value="Redes">Redes Sociales</option>
            <option value="Amigo">Recomendación</option>
        </select>
    </div>

    <div class="checkbox-field">
        <label>
            <input type="checkbox" bind:checked={esEmpresa} />
            Soy una empresa / Necesito factura
        </label>
    </div>

    {#if esEmpresa}
        <div class="field">
            <label>CIF / NIF</label>
            <input type="text" bind:value={cif} />
        </div>
        <div class="field">
            <label>Dirección Fiscal</label>
            <input type="text" bind:value={direccion} />
        </div>
    {/if}

    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}

    <button type="submit" disabled={loading}>
        {loading ? "Creando cuenta..." : "Registrarse"}
    </button>

    <p class="foot">¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a></p>
</form>

<style>
    /* Tus estilos CSS aquí... */
    .auth-form {
        max-width: 400px;
        margin: 2rem auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .error {
        color: red;
        font-size: 0.9rem;
    }
</style>
