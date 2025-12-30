<script setup lang="ts">
import EmailLayout from './components/EmailLayout.vue'
import EmailButton from './components/EmailButton.vue'
import EmailText from '~/emails/components/EmailText.vue'

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
    backgroundColor: '#f9f9f9',
    padding: '10px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    margin: '10px 0',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '5px',
    padding: '15px',
    margin: '15px 0',
    color: '#856404',
  },
  warningText: {
    margin: '0',
    fontSize: '12px',
    lineHeight: '1.5',
  },
}
</script>

<template>
  <EPreview>
    Klicke auf diesen Link, um dich bei BTC-Events anzumelden.
  </EPreview>
  <EmailLayout
    header-title="Anmeldelink"
    header-color="#ffb700"
  >
    <EmailText>
      Hallo {{ firstName }},
    </EmailText>

    <EmailText>
      Du hast einen Anmeldelink für BTC-Events angefordert.
    </EmailText>

    <EmailText>
      Klicke auf diesen Button, um dich anzumelden:
    </EmailText>

    <EmailButton
      :href="magicLink"
      text="Jetzt anmelden"
    />

    <EmailText>
      Oder kopiere diese URL in deinen Browser:
    </EmailText>
    <EmailText :style="styles.urlBox">
      <ELink :href="magicLink">
        {{ magicLink }}
      </ELink>
    </EmailText>

    <ESection :style="styles.warningBox">
      <EmailText :style="styles.warningText">
        Dieser Link ist {{ expiryMinutes }} Minuten gültig und kann nur einmal verwendet werden.
      </EmailText>
    </ESection>
  </EmailLayout>
</template>
