<script setup lang="ts">
interface Props {
  headerTitle: string
  headerColor?: string
}

const { headerTitle, headerColor = '#ffb700' } = defineProps<Props>()
const currentYear = new Date().getFullYear()

const styles = {
  main: {
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
  },
  container: {
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  header: {
    backgroundColor: headerColor,
    color: 'white',
    padding: '30px',
    textAlign: 'center' as const,
    borderRadius: '8px 8px 0 0',
  },
  logo: {
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'center',
  },
  logoCircle: {
    backgroundColor: '#000000',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    borderRadius: '50%',
    display: 'block',
  },
  headerTitle: {
    margin: '0',
    fontSize: '24px',
    fontWeight: 'bold',
  },
  content: {
    padding: '30px',
    backgroundColor: '#ffffff',
  },
  greetingText: {
    marginTop: '30px',
    color: '#333',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#666',
    padding: '20px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    borderRadius: '0 0 8px 8px',
  },
  footerText: {
    margin: '5px 0',
  },
  disclaimer: {
    fontSize: '12px',
    color: '#999',
  },
}
</script>

<template>
  <EHtml>
    <EHead />
    <EBody :style="styles.main">
      <EPreview>{{ headerTitle }}</EPreview>
      <EContainer :style="styles.container">
        <ESection :style="styles.header">
          <div :style="styles.logo">
            <div :style="styles.logoCircle">
              <EImg
                src="https://btc-races.pages.dev/logo-yellow.svg"
                width="80"
                height="80"
                alt="BTC-Races"
                :style="styles.logoImg"
              />
            </div>
          </div>
          <EHeading :style="styles.headerTitle">
            {{ headerTitle }}
          </EHeading>
        </ESection>

        <ESection :style="styles.content">
          <slot />

          <EText :style="styles.greetingText">
            Liebe Grüße,<br>Dein BTC
          </EText>
        </ESection>

        <ESection :style="styles.footer">
          <EText :style="{ ...styles.footerText, ...styles.disclaimer }">
            Diese E-Mail wurde automatisch generiert. Bitte antworte nicht direkt auf diese Nachricht.
          </EText>
          <EText :style="{ ...styles.footerText, ...styles.disclaimer }">
            © {{ currentYear }} BTC-Races
          </EText>
        </ESection>
      </EContainer>
    </EBody>
  </EHtml>
</template>
