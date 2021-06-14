<template>
  <n-config-provider :theme="darkTheme" abstract>
    <n-global-style />
    <n-layout class="fullheight">
      <n-layout-header>
        <n-grid cols="2" x-gap="12">
          <n-gi>
            <n-select
              v-model:value="baseDir"
              filterable
              placeholder="Base dir"
              :options="subdirOptions"
            />
          </n-gi>
          <n-gi>
            <n-select
              v-model:value="otherDir"
              filterable
              placeholder="Other dir"
              :options="subdirOptions"
            />
          </n-gi>
        </n-grid>
      </n-layout-header>
      <n-layout has-sider>
        <n-layout-sider content-style="padding: 12px">
          <template v-if="dirDiff">
            <template v-if="dirDiff.same">
              same {{ dirDiff.relativePath }} {{ dirDiff.name2 }}
            </template>
            <template v-else-if="dirDiff.distinct">
              <div v-for="(diffSet, index) in dirDiff.diffSet" :key="index">
                X {{ diffSet.relativePath }} {{ diffSet.name2 }}
              </div>
            </template>
          </template>
        </n-layout-sider>
        <n-layout-content
          :native-scrollbar="false"
          content-style="padding: 12px"
        >
          <n-grid cols="2" x-gap="12">
            <n-gi>
              {{ baseDir }}
            </n-gi>
            <n-gi>
              {{ otherDir }}
            </n-gi>
          </n-grid>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script lang="ts">
import axios from "axios";
import { computed, defineComponent, onMounted, ref, watchEffect } from "vue";
import {
  NConfigProvider,
  NGlobalStyle,
  NSelect,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NGrid,
  NGi,
  NSpace,
  darkTheme
} from "naive-ui";

export default defineComponent({
  components: {
    NConfigProvider,
    NGlobalStyle,
    NSelect,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NLayoutSider,
    NGrid,
    NGi,
    NSpace
  },
  setup() {
    const subdirs = ref<Array<object>>([]);
    const dirDiff = ref<any>();
    const baseDir = ref<string>();
    const otherDir = ref<string>();

    const subdirOptions = computed(() =>
      subdirs.value.map(dir => ({ label: dir, value: dir }))
    );

    watchEffect(fetchDirDiff);

    async function fetchSubdirs(): Promise<void> {
      const { data } = await axios.get<object[]>("/api/subdirs");
      subdirs.value = data;
    }

    async function fetchDirDiff(): Promise<void> {
      if (!baseDir.value || !otherDir.value) return;
      const { data } = await axios.get<object>("/api/dirdiff", {
        params: {
          baseDir: baseDir.value,
          otherDir: otherDir.value
        }
      });
      dirDiff.value = data;
    }

    onMounted(fetchSubdirs);

    return {
      darkTheme,
      subdirOptions,
      baseDir,
      otherDir,
      dirDiff
    };
  }
});
</script>

<style lang="scss">
.fullheight {
  height: 100vh;
}
</style>
