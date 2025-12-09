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

    // Obtener datos de la tabla 'clientes'
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("Error cargando perfil:", error);
    } else {
      profile = data || {};
    }

    console.log(profile);

    loading = false;
  });
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
          {t("profile.greeting")}{profile.nombre || "No definido"}
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

      <!-- En el futuro a lo mejor nos interesa editar el usuario -->
      <!-- <div class="px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
            <button class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md transform hover:-translate-y-0.5">
                Editar Usuario
            </button>
        </div> -->
    </div>
  {:else}
    <div class="alert alert-warning text-center">
      {t("profile.error.loading")} <a href={translatePath("/login")}
        >{t("profile.relogin")}</a
      >
    </div>
  {/if}
</div>
