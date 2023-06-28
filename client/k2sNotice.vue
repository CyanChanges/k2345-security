<script setup lang="ts">

</script>

<template>
  <div class="k2s-top k2s">
    <div class="k2s-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">

.k2s-top {
  z-index: 1145141919810;
}

$paddingX: 1.25rem;
$paddingY: 1.5rem;

.k2s {
  & {
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--k-color-success-shade);
    border: 1px solid var(--k-color-success-fade);
    box-shadow: var(--k-card-shadow);
    transition: var(--color-transition);
  }

  .k2s-body {
    position: relative;
    margin: $paddingX 0;
    padding: 0 $paddingY;
  }

  position: fixed;
  right: 2rem;
  bottom: 2rem;
  min-height: 8rem;
  max-height: 50%;
  min-width: 24rem;
}
</style>
