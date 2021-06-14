<template>
  <div>{{ subdirs }}</div>
</template>

<script lang="ts">
import axios from "axios"
import { defineComponent, onMounted, ref } from "vue"

export default defineComponent({
  components: {
  },
  setup() {
    const subdirs = ref<Array<object>>([])

    async function fetchSubdirs(): Promise<void> {
      const {data} = await axios.get<object[]>("/api/subdirs")
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
