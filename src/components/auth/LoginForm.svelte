<script lang="ts">
  import { supabase } from '../../lib/supabase';

  let loading = false;
  let errorMessage = '';
  
  let email = '';
  let password = '';

  const handleLogin = async () => {
    loading = true;
    errorMessage = '';

    // Llamada simple a Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log(data)

    if (error) {
      // Traducimos el error común para que sea amigable
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'El email o la contraseña son incorrectos.';
      } else {
        errorMessage = error.message;
      }
      loading = false;
      return;
    }

    // Éxito: Redirigimos
    // Nota: Si tienes un store de Svelte escuchando onAuthStateChange, 
    // se actualizará solo, pero la redirección la forzamos aquí.
    window.location.href = '/'; 
  };
</script>

<form on:submit|preventDefault={handleLogin} class="auth-form">
  <h3>Iniciar Sesión</h3>

  <div class="field">
    <label for="email">Email</label>
    <input 
      id="email" 
      type="email" 
      bind:value={email} 
      required 
      placeholder="tu@email.com" 
    />
  </div>

  <div class="field">
    <label for="pass">Contraseña</label>
    <input 
      id="pass" 
      type="password" 
      bind:value={password} 
      required 
    />
  </div>

  <div class="forgot-pass">
    <a href="/recuperar">¿Olvidaste tu contraseña?</a>
  </div>

  {#if errorMessage}
    <div class="error-box">
      {errorMessage}
    </div>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? 'Entrando...' : 'Entrar'}
  </button>
  
  <p class="foot">
    ¿Aún no tienes cuenta? <a href="/registro">Regístrate aquí</a>
  </p>
</form>

<style>
  /* Reutilizamos estilos parecidos al registro */
  .auth-form { max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; }
  .error-box { background: #fee; color: #d00; padding: 0.5rem; border-radius: 4px; border: 1px solid #fcc; font-size: 0.9rem; }
  
  .forgot-pass { text-align: right; font-size: 0.85rem; }
  .forgot-pass a { color: #666; text-decoration: none; }
  .forgot-pass a:hover { text-decoration: underline; }

  button { 
    padding: 0.75rem; 
    background-color: #333; 
    color: white; 
    border: none; 
    border-radius: 4px; 
    cursor: pointer; 
    font-size: 1rem;
  }
  button:disabled { background-color: #999; cursor: not-allowed; }
  
  .foot { text-align: center; font-size: 0.9rem; margin-top: 1rem; }
</style>