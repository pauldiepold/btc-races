export default defineAppConfig({
  ui: {
    colors: {
      primary: 'yellow',
      neutral: 'zinc',
    },
    button: {
      defaultVariants: {
        color: 'primary',
        variant: 'solid',
        size: 'md',
      },
    },
    card: {
      slots: {
        root: 'rounded overflow-hidden',
        title: 'font-display font-semibold text-highlighted',
      },
    },
    pageCard: {
      slots: {
        root: 'relative flex rounded',
      },
    },
    authForm: {
      slots: {
        title: 'text-xl text-pretty font-semibold text-highlighted font-display',
        leadingIcon: 'size-20',
      },
    },
    header: {
      slots: {
        title: 'shrink-0 font-semibold text-xl text-highlighted flex items-end gap-1.5 font-display',
      },
    },
    modal: {
      slots: {
        title: 'font-display font-semibold text-highlighted',
      },
    },
    slideover: {
      slots: {
        title: 'font-display font-semibold text-highlighted',
      },
    },
  },
  icon: {
    mode: 'css',
    cssLayer: 'base',
    size: '20px',
  },
})
