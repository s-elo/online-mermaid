<script lang="ts" setup>
import { ElTabs, ElTabPane } from 'element-plus';
import { TabItem } from '../types';

defineProps<{
  tabs: TabItem[];
  tab: string;
}>();

defineEmits(['selectTab', 'tab-remove']);
</script>

<template>
  <div class="mermaid-tabs-container">
    <el-tabs
      :model-value="tab"
      type="card"
      class="mermaid-tabs"
      closable
      @tab-change="$emit('selectTab', $event)"
      @tab-remove="$emit('tab-remove', $event)"
    >
      <el-tab-pane v-for="item in tabs" :key="item.name" :name="item.name">
        <template #label>
          <div class="label">
            {{ item.title }}
            <div v-if="item.stale" class="dot"></div>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.mermaid-tabs-container {
  .label {
    padding: 3px;
    position: relative;
    .dot {
      position: absolute;
      top: 0;
      right: -5px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: rgb(201, 233, 135);
    }
  }
}
</style>
