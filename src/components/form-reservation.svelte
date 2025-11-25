<script>
  import { onMount } from 'svelte';
  import { z } from 'zod';

  // Props que recibe desde Astro
  export let locale = 'es';
  export let translations = {};

  // Helper para obtener traducciones
  function t(key) {
    return translations[key] || key;
  }

  // Schema de validación con Zod
  const reservaSchema = z.object({
    nombre: z.string()
      .min(1, 'nombreRequerido'),
    
    email: z.string()
      .min(1, 'emailRequerido')
      .email('emailInvalido'),
    
    telefono: z.string()
      .min(1, 'telefonoRequerido')
      .regex(/^[0-9\s]{9,}$/, 'telefonoInvalido'),
    
    fecha: z.string()
      .min(1, 'fechaRequerida')
      .refine((date) => {
        if (!date) return false;
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }, 'fechaPasada'),
    
    hora: z.string()
      .min(1, 'horaRequerida'),
    
    personas: z.number()
      .min(1, 'personasMin')
      .max(20, 'personasMax'),
    
    comentarios: z.string().optional()
  });

  // Estado del formulario
  let formData = {
    nombre: '',
    email: '',
    telefono: '',
    fecha: '',
    hora: '',
    personas: 2,
    comentarios: ''
  };

  // Errores de validación
  let errors = {
    nombre: '',
    email: '',
    telefono: '',
    fecha: '',
    hora: '',
    personas: ''
  };

  // Estado del formulario
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = '';

  // Fecha mínima (hoy)
  let minDate = '';

  onMount(() => {
    const today = new Date();
    minDate = today.toISOString().split('T')[0];
  });

  // Validar campo individual con Zod
  function validateField(field, value) {
    try {
      // Crear un objeto con solo el campo a validar
      const fieldData = { ...formData, [field]: value };
      
      // Validar solo ese campo
      reservaSchema.pick({ [field]: true }).parse({ [field]: value });
      
      // Si no hay error, limpiar el mensaje
      errors[field] = '';
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = err.errors[0];
        // Usar el mensaje del error como clave de traducción
        errors[field] = t(`reservas.errores.${fieldError.message}`);
      }
    }
  }

  // Validar todo el formulario con Zod
  function validateForm() {
    try {
      reservaSchema.parse(formData);
      
      // Limpiar todos los errores
      errors = {
        nombre: '',
        email: '',
        telefono: '',
        fecha: '',
        hora: '',
        personas: ''
      };
      
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Resetear errores
        errors = {
          nombre: '',
          email: '',
          telefono: '',
          fecha: '',
          hora: '',
          personas: ''
        };
        
        // Mapear errores de Zod a nuestro objeto de errores
        err.errors.forEach((error) => {
          const field = error.path[0];
          if (field in errors) {
            errors[field] = t(`reservas.errores.${error.message}`);
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

  // Manejar cambio de número (personas)
  function handleNumberInput(e) {
    const value = parseInt(e.target.value) || 0;
    formData.personas = value;
    validateField('personas', value);
  }

  // Enviar formulario
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    isSubmitting = true;
    submitError = '';
    submitSuccess = false;

    try {
      // Incluir locale en el envío
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          locale
        })
      });

      if (response.ok) {
        submitSuccess = true;
        // Resetear formulario
        formData = {
          nombre: '',
          email: '',
          telefono: '',
          fecha: '',
          hora: '',
          personas: 2,
          comentarios: ''
        };
        errors = {
          nombre: '',
          email: '',
          telefono: '',
          fecha: '',
          hora: '',
          personas: ''
        };
      } else {
        submitError = t('reservas.errores.errorEnvio');
      }
    } catch (error) {
      submitError = t('reservas.errores.errorConexion');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="reservas-container">
  <form on:submit={handleSubmit} class="reservas-form" novalidate>
    <h2>{t('reservas.titulo')}</h2>

    {#if submitSuccess}
      <div class="alert alert-success">
        ✓ {t('reservas.mensajes.exito')}
      </div>
    {/if}

    {#if submitError}
      <div class="alert alert-error">
        ✕ {submitError}
      </div>
    {/if}

    <div class="form-row">
      <div class="form-group">
        <label for="nombre">
          {t('reservas.campos.nombre')} <span class="required">*</span>
        </label>
        <input
          type="text"
          id="nombre"
          value={formData.nombre}
          on:input={handleInput('nombre')}
          on:blur={handleInput('nombre')}
          class:error={errors.nombre}
          placeholder={t('reservas.placeholders.nombre')}
          disabled={isSubmitting}
        />
        {#if errors.nombre}
          <span class="error-message">{errors.nombre}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="telefono">
          {t('reservas.campos.telefono')} <span class="required">*</span>
        </label>
        <input
          type="tel"
          id="telefono"
          value={formData.telefono}
          on:input={handleInput('telefono')}
          on:blur={handleInput('telefono')}
          class:error={errors.telefono}
          placeholder={t('reservas.placeholders.telefono')}
          disabled={isSubmitting}
        />
        {#if errors.telefono}
          <span class="error-message">{errors.telefono}</span>
        {/if}
      </div>
    </div>

    <div class="form-group">
      <label for="email">
        {t('reservas.campos.email')} <span class="required">*</span>
      </label>
      <input
        type="email"
        id="email"
        value={formData.email}
        on:input={handleInput('email')}
        on:blur={handleInput('email')}
        class:error={errors.email}
        placeholder={t('reservas.placeholders.email')}
        disabled={isSubmitting}
      />
      {#if errors.email}
        <span class="error-message">{errors.email}</span>
      {/if}
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="fecha">
          {t('reservas.campos.fecha')} <span class="required">*</span>
        </label>
        <input
          type="date"
          id="fecha"
          value={formData.fecha}
          on:input={handleInput('fecha')}
          on:blur={handleInput('fecha')}
          class:error={errors.fecha}
          min={minDate}
          disabled={isSubmitting}
        />
        {#if errors.fecha}
          <span class="error-message">{errors.fecha}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="hora">
          {t('reservas.campos.hora')} <span class="required">*</span>
        </label>
        <input
          type="time"
          id="hora"
          value={formData.hora}
          on:input={handleInput('hora')}
          on:blur={handleInput('hora')}
          class:error={errors.hora}
          disabled={isSubmitting}
        />
        {#if errors.hora}
          <span class="error-message">{errors.hora}</span>
        {/if}
      </div>

      <div class="form-group">
        <label for="personas">
          {t('reservas.campos.personas')} <span class="required">*</span>
        </label>
        <input
          type="number"
          id="personas"
          value={formData.personas}
          on:input={handleNumberInput}
          on:blur={handleNumberInput}
          class:error={errors.personas}
          min="1"
          max="20"
          disabled={isSubmitting}
        />
        {#if errors.personas}
          <span class="error-message">{errors.personas}</span>
        {/if}
      </div>
    </div>

    <div class="form-group">
      <label for="comentarios">
        {t('reservas.campos.comentarios')}
      </label>
      <textarea
        id="comentarios"
        bind:value={formData.comentarios}
        rows="4"
        placeholder={t('reservas.placeholders.comentarios')}
        disabled={isSubmitting}
      ></textarea>
    </div>

    <button type="submit" class="submit-btn" disabled={isSubmitting}>
      {#if isSubmitting}
        {t('reservas.botones.enviando')}
      {:else}
        {t('reservas.botones.enviar')}
      {/if}
    </button>

    <p class="form-note">
      <span class="required">*</span> {t('reservas.mensajes.camposObligatorios')}
    </p>
  </form>
</div>

<style>
  .reservas-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .reservas-form {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 0 0 1.5rem 0;
    color: #333;
    font-size: 1.75rem;
    text-align: center;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: 500;
    font-size: 0.95rem;
  }

  .required {
    color: #e74c3c;
  }

  input,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }

  input.error,
  textarea.error {
    border-color: #e74c3c;
  }

  input.error:focus,
  textarea.error:focus {
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
  }

  input:disabled,
  textarea:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }

  .error-message {
    display: block;
    color: #e74c3c;
    font-size: 0.85rem;
    margin-top: 0.35rem;
  }

  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .alert-success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .alert-error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .submit-btn {
    width: 100%;
    padding: 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .submit-btn:hover:not(:disabled) {
    background-color: #2980b9;
    transform: translateY(-1px);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }

  .form-note {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  @media (max-width: 640px) {
    .reservas-container {
      padding: 1rem 0.5rem;
    }

    .reservas-form {
      padding: 1.5rem;
    }

    h2 {
      font-size: 1.5rem;
    }

    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>