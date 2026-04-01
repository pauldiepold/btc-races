export default defineAppConfig({
  ui: {
    colors: {
      primary: 'yellow',
      neutral: 'zinc',
    },
    header: {
      slots: {
        title: 'shrink-0 font-semibold text-xl text-highlighted flex items-end gap-1.5 font-display',
      },
    },
  },
  icon: {
    mode: 'css',
    cssLayer: 'base',
    size: '20px',
  },
})
