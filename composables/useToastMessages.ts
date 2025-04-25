/**
 * Composable für einheitliche Toast-Benachrichtigungen
 * Bietet Hilfsfunktionen für Erfolgs- und Fehlermeldungen
 */
export function useToastMessages() {
  const toast = useToast()

  /**
   * Zeigt eine Fehlermeldung an
   * @param message Anzuzeigende Nachricht
   */
  function showError(message: string) {
    toast.add({
      title: 'Fehler',
      description: message,
      color: 'error',
      duration: 5000,
    })
  }

  /**
   * Zeigt eine Erfolgsmeldung an
   * @param message Anzuzeigende Nachricht
   */
  function showSuccess(message: string) {
    toast.add({
      title: 'Erfolg',
      description: message,
      color: 'success',
      duration: 3000,
    })
  }

  return {
    showError,
    showSuccess,
  }
}
