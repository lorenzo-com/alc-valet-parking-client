<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '../../lib/supabase';
  import type { User } from '@supabase/supabase-js';

  let loading = true;
  let user: User | null = null;
  let profile: any = null;
  let message = '';
  let msgType = 'success'; // 'success' | 'danger'

  onMount(async () => {
    // 1. Obtener usuario autenticado
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      window.location.href = '/login'; // Protección de ruta
      return;
    }

    user = authUser;

    // 2. Obtener datos de la tabla 'clientes'
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Error cargando perfil:', error);
    } else {
      profile = data || {};
    }

    console.log(profile)

    loading = false;
  });

  // Función para enviar email de reset
  const handleResetPassword = async () => {
    if (!user || !user.email) return;

    const confirmReset = confirm(`¿Enviar un email a ${user.email} para cambiar la contraseña?`);
    if (!confirmReset) return;

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/recuperar-password', // Asegúrate de tener esta página o redirige al login
    });

    if (error) {
      message = 'Error al enviar el correo: ' + error.message;
      msgType = 'danger';
    } else {
      message = '¡Correo enviado! Revisa tu bandeja de entrada para cambiar la contraseña.';
      msgType = 'success';
    }
  };
</script>

<div class="bg-gray-100 flex items-center justify-center p-5">
    {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando perfil...</span>
      </div>
    </div>
  {:else if user && profile}

    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border-t-8 border-orange-500">
        
        <div class="px-8 pt-10 pb-6 text-center">
            <h1 class="text-gray-800">Hola, {profile.nombre || 'No definido'}</h1>
        </div>

        <div class="px-8 py-4 space-y-6">
            
            <div class="grid grid-cols-1 gap-4">
                <div class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="p-2 bg-orange-500 rounded text-white mr-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold">Email</p>
                        <p class="text-gray-800 font-medium">{user.email}</p>
                    </div>
                </div>

                <div class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="p-2 bg-orange-500 rounded text-white mr-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold">Teléfono</p>
                        <p class="text-gray-800 font-medium">{profile.telefono || 'No definido'}</p>
                    </div>
                </div>

                <div class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div class="p-2 bg-orange-500 rounded text-white mr-3">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <div>
                        <p class="text-xs text-gray-400 uppercase font-semibold">¿Cómo nos conociste?</p>
                        <p class="text-gray-800 font-medium">{profile.nos_conociste || 'No definido'}</p>
                    </div>
                </div>
            </div>

            {#if profile.cif || profile.direccion}
            <div class="bg-orange-50 rounded-lg p-4 border border-orange-100 mt-4">
                <h3 class="text-orange-800 font-bold text-sm mb-3 uppercase tracking-wide">Datos de Facturación</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-orange-400 font-semibold">CIF</p>
                        <p class="text-gray-700 font-bold">{profile.cif || 'No definido'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-orange-400 font-semibold">Dirección</p>
                        <p class="text-gray-700 font-bold">{profile.direccion || 'No definido'}</p>
                    </div>
                </div>
            </div>
            {/if}
        </div>

        <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md transform hover:-translate-y-0.5">
                Editar Usuario
            </button>
            
            <button class="w-full text-sm text-gray-500 hover:text-orange-600 font-medium py-2 transition duration-200 flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                Reestablecer Contraseña
            </button>
        </div>

    </div>
    {:else}
    <div class="alert alert-warning text-center">
      No se pudo cargar la información del usuario. <a href="/login">Inicia sesión nuevamente</a>.
    </div>
  {/if}

</div>