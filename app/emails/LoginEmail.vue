<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailButton from './components/EmailButton.vue'
import EmailText from './components/EmailText.vue'

interface Props {
  firstName?: string
  magicLink?: string
  expiryMinutes?: number
}

const {
  firstName = 'Max',
  magicLink = 'https://btc-races.de/verify?token=example',
  expiryMinutes = 15,
} = defineProps<Props>()

const styles = {
  urlBox: {
    wordBreak: 'break-all' as const,
    backgroundColor: '#fafafa',
    border: '1px solid #e4e4e7',
    color: '#3f3f46',
    padding: '12px',
    borderRadius: '3px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    margin: '8px 0 16px 0',
    lineHeight: '1.5',
  },
  warningBox: {
    backgroundColor: '#fafafa',
    borderLeft: '4px solid #ffb700',
    padding: '14px 16px',
    margin: '16px 0 0 0',
    borderRadius: '3px',
  },
  warningText: {
    margin: '0',
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#18181b',
  },
}
</script>

<template>
  <EmailLayout header-title="Anmeldelink">
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      Du hast einen Anmeldelink für BTC-Races angefordert.
    </EmailText>

    <EmailButton
      :href="magicLink"
      text="Jetzt anmelden"
    />

    <EmailText>
      Falls der Button nicht funktioniert, kopiere diese URL in deinen Browser:
    </EmailText>
    <ESection :style="styles.urlBox">
      <ELink :href="magicLink">
        {{ magicLink }}
      </ELink>
    </ESection>

    <ESection :style="styles.warningBox">
      <EText :style="styles.warningText">
        Dieser Link ist {{ expiryMinutes }} Minuten gültig und kann nur einmal verwendet werden.
      </EText>
    </ESection>
  </EmailLayout>
</template>
