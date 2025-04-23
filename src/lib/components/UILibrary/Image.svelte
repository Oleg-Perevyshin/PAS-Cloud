<script lang="ts">
  interface Props {
    src?: string
    alt?: string
    styleCSS?: string
  }

  let { src = '', styleCSS = '', alt = '' }: Props = $props()
</script>

<img {src} {alt} style={styleCSS} />

<style>
  img {
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }
</style>
