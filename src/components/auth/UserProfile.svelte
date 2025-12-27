<script>
  import { useTranslatedPath, useTranslations } from "@/i18n/utils";
  import { onMount } from "svelte";
  import { supabase } from "@/lib/supabase";

  // ==========================================
  // CONFIGURACIÓN Y CONSTANTES
  // ==========================================
  // Props que recibe desde Astro
  export let lang = "es"; // Valor por defecto
  const t = useTranslations(lang);
  const translatePath = useTranslatedPath(lang);

  let loading = true;
  let user = null;
  let profile = null;
  let vehicles = [];

  // Estado para el Modal de Vehículos
  let showModal = false;
  let isSaving = false;
  let editingVehicle = null; // Si es null, estamos creando. Si tiene datos, editando.
  let formData = {
    coche: "",
    matricula: "",
  };

  onMount(async () => {
    // Obtener usuario autenticado
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      window.location.href = translatePath("/login"); // Protección de ruta
      return;
    }

    user = authUser;

    await loadData();
  });

  async function loadData() {
    loading = true;

    // Obtener datos de la tabla 'clientes'
    const profilePromise = supabase
      .from("clientes")
      .select("*")
      .eq("id", user.id)
      .single();

    const vehiclesPromise = supabase
      .from("vehiculos")
      .select("*")
      .eq("cliente_id", user.id);

    const [profileRes, vehiclesRes] = await Promise.all([
      profilePromise,
      vehiclesPromise,
    ]);

    if (profileRes.error) console.error("Error perfil:", profileRes.error);
    else profile = profileRes.data || {};

    if (vehiclesRes.error) console.error("Error vehículos:", vehiclesRes.error);
    else vehicles = vehiclesRes.data || [];

    loading = false;
  }

  function openModal(vehicle = null) {
    editingVehicle = vehicle;
    if (vehicle) {
      // Modo Edición
      formData = { coche: vehicle.coche, matricula: vehicle.matricula };
    } else {
      // Modo Crear
      formData = { coche: "", matricula: "" };
    }
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    formData = { coche: "", matricula: "" };
    editingVehicle = null;
  }

  async function saveVehicle() {
    if (!formData.coche || !formData.matricula) return; // Validación básica
    isSaving = true;

    try {
      if (editingVehicle) {
        // ACTUALIZAR
        const { error } = await supabase
          .from("vehiculos")
          .update({
            coche: formData.coche,
            matricula: formData.matricula,
            updated_at: new Date()
          })
          .eq("id", editingVehicle.id);

        if (error) throw error;
      } else {
        // CREAR
        const { error } = await supabase.from("vehiculos").insert({
          cliente_id: user.id, // Importante: Vincular al usuario
          coche: formData.coche,
          matricula: formData.matricula,
        });

        if (error) throw error;
      }

      // Recargar lista y cerrar
      await loadData();
      closeModal();
    } catch (err) {
      console.error("Error guardando vehículo:", err);
      alert("Error al guardar el vehículo");
    } finally {
      isSaving = false;
    }
  }

  async function deleteVehicle(id) {
    if (!confirm(t("profile.vehicle.alert")))
      return;

    try {
      const { error } = await supabase.from("vehiculos").delete().eq("id", id);

      if (error) throw error;

      // Actualizar estado local (más rápido que recargar todo)
      vehicles = vehicles.filter((v) => v.id !== id);
    } catch (err) {
      console.error("Error eliminando:", err);
      alert("No se pudo eliminar el vehículo");
    }
  }
</script>

<div class="bg-gray-100 flex items-center justify-center p-5">
  {#if loading}
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">{t("profile.loading")}</span>
      </div>
    </div>
  {:else if user && profile}
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border-t-8 border-orange-500"
    >
      <div class="px-8 pt-10 pb-6 text-center">
        <h1 class="text-gray-800">
          {t("profile.greeting")}{profile.nombre || "Usuario"}
        </h1>
      </div>

      <div class="px-8 py-4 space-y-6">
        <div class="grid grid-cols-1 gap-4">
          <div
            class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="p-2 bg-orange-500 rounded text-white mr-3">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path></svg
              >
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">
                {t("profile.label.email")}
              </p>
              <p class="text-gray-800 font-medium">{user.email}</p>
            </div>
          </div>

          <div
            class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="p-2 bg-orange-500 rounded text-white mr-3">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                ></path></svg
              >
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">
                {t("profile.label.phone")}
              </p>
              <p class="text-gray-800 font-medium">
                {profile.telefono || "No definido"}
              </p>
            </div>
          </div>

          <div
            class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
          >
            <div class="p-2 bg-orange-500 rounded text-white mr-3">
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                ></path></svg
              >
            </div>
            <div>
              <p class="text-xs text-gray-400 uppercase font-semibold">
                {t("profile.label.howFound")}
              </p>
              <p class="text-gray-800 font-medium">
                {profile.nos_conociste || "No definido"}
              </p>
            </div>
          </div>

          {#if profile.cif || profile.direccion}
            <div
              class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div class="p-2 bg-orange-500 rounded text-white mr-3">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path></svg
                >
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase font-semibold">
                  {t("profile.label.cif")}
                </p>
                <p class="text-gray-800 font-medium">
                  {profile.cif || "No definido"}
                </p>
              </div>
            </div>

            <div
              class="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div class="p-2 bg-orange-500 rounded text-white mr-3">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  ></path></svg
                >
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase font-semibold">
                  {t("profile.label.address")}
                </p>
                <p class="text-gray-800 font-medium">
                  {profile.direccion || "No definido"}
                </p>
              </div>
            </div>
          {/if}
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gray-800 px-6 py-4 flex justify-between items-center">
          <h2 class="text-white font-bold text-lg flex items-center gap-2">
            <svg
              class="w-5 h-5 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path></svg
            >
            {t("profile.vehicle.title")}
          </h2>
          <button
            on:click={() => openModal()}
            class="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded transition-colors flex items-center gap-1"
          >
            <svg
              class="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M12 4v16m8-8H4"
              ></path></svg
            >
            {t("profile.vehicle.add")}
          </button>
        </div>

        <div class="p-6">
          {#if vehicles.length === 0}
            <div
              class="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <p>{t("profile.novehicles")}</p>
            </div>
          {:else}
            <div class="grid gap-4">
              {#each vehicles as v (v.id)}
                <div
                  class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors group"
                >
                  <div>
                    <h3 class="font-bold text-gray-800">{v.coche}</h3>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        class="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono tracking-wider"
                      >
                        {v.matricula}
                      </span>
                    </div>
                  </div>

                  <div
                    class="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      on:click={() => openModal(v)}
                      class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Editar"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path></svg
                      >
                    </button>
                    <button
                      on:click={() => deleteVehicle(v.id)}
                      class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        ><path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path></svg
                      >
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        {#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-bold text-lg text-gray-800">
          {editingVehicle ? t("profile.vehicle.edit") : t("profile.vehicle.new")}
        </h3>
        <button aria-label="close" on:click={closeModal} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <form on:submit|preventDefault={saveVehicle} class="p-6 space-y-4">
        <div>
          <label for="coche" class="block text-sm font-medium text-gray-700 mb-1">{t("profile.vehicle.model")}</label>
          <input 
            type="text" 
            id="coche"
            bind:value={formData.coche}
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 bg-gray-50"
            placeholder="Ej. Ford Fiesta Azul"
            required
          />
        </div>
        
        <div>
          <label for="matricula" class="block text-sm font-medium text-gray-700 mb-1">{t("profile.vehicle.licenseplate")}</label>
          <input 
            type="text" 
            id="matricula"
            bind:value={formData.matricula}
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 py-2.5 px-3 bg-gray-50 uppercase"
            placeholder="1234 ABC"
            required
          />
        </div>

        <div class="pt-2 flex gap-3">
          <button 
            type="button" 
            on:click={closeModal}
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t("profile.vehicle.cancel")}
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            class="flex-1 px-4 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? t("profile.vehicle.saving") : t("profile.vehicle.save")}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
      </div>
    </div>
  {:else}
    <div class="alert alert-warning text-center">
      {t("profile.error.loading")}
      <a href={translatePath("/login")}>{t("profile.relogin")}</a>
    </div>
  {/if}
</div>
