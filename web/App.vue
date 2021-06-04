<template>adasdasdasd23234324
  <dropdown :options="subdirs" />
</template>

<script lang="ts">
import axios from "axios"
import { defineComponent, onMounted, ref } from "vue"
import Dropdown from "primevue/dropdown"

export default defineComponent({
  components: {
    Dropdown,
  },
  setup() {
    const subdirs = ref<object[]>([])

    async function fetchSubdirs(): Promise<void> {
      const {data} = await axios.get<object[]>("/subdirs")
      subdirs.value = data
    }

    onMounted(fetchSubdirs)

    return {
      subdirs,
    }
  },
})
</script>

<style lang="scss">
</style>
