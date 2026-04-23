<script setup lang="ts">
import EmailUnsubscribeFooter from './EmailUnsubscribeFooter.vue'

interface Props {
  headerTitle: string
  showUnsubscribe?: boolean
  baseUrl?: string
}

const {
  headerTitle,
  showUnsubscribe = false,
  baseUrl = 'https://btc-races.de',
} = defineProps<Props>()

const currentYear = new Date().getFullYear()

const styles = {
  main: {
    backgroundColor: '#fafafa',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: {
    maxWidth: '600px',
    margin: '24px auto',
    backgroundColor: '#ffffff',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid #e4e4e7',
  },
  stripe: {
    height: '4px',
    backgroundColor: '#ffb700',
    lineHeight: '4px',
    fontSize: '0',
  },
  header: {
    backgroundColor: '#09090b',
    padding: '28px',
    textAlign: 'center' as const,
  },
  logo: {
    display: 'block',
    margin: '0 auto 12px auto',
  },
  headerTitle: {
    margin: '0',
    fontSize: '22px',
    fontWeight: '700' as const,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  content: {
    padding: '28px',
    backgroundColor: '#ffffff',
  },
  greetingText: {
    marginTop: '28px',
    marginBottom: '0',
    color: '#18181b',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#71717a',
    padding: '20px 28px',
    borderTop: '1px solid #e4e4e7',
    backgroundColor: '#fafafa',
  },
  footerText: {
    margin: '4px 0',
  },
}
</script>

<template>
  <EHtml>
    <EHead />
    <EBody :style="styles.main">
      <EPreview>{{ headerTitle }}</EPreview>
      <EContainer :style="styles.container">
        <ESection :style="styles.stripe">
          <!-- Yellow accent stripe -->
        </ESection>

        <ESection :style="styles.header">
          <EImg
            src="https://btc-races.pages.dev/pwa-64x64.png"
            width="64"
            height="64"
            alt="BTC-Races"
            :style="styles.logo"
          />
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

        <EmailUnsubscribeFooter
          v-if="showUnsubscribe"
          :base-url="baseUrl"
        />

        <ESection :style="styles.footer">
          <EText :style="styles.footerText">
            Diese E-Mail wurde automatisch generiert. Bitte antworte nicht direkt auf diese Nachricht.
          </EText>
          <EText :style="styles.footerText">
            © {{ currentYear }} Berlin Track Club
          </EText>
        </ESection>
      </EContainer>
    </EBody>
  </EHtml>
</template>
