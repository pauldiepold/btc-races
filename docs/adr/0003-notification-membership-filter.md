# Notification-Membership-Filter zentral im Worker

Notifications (E-Mail **und** Push) werden niemals an inaktive Mitglieder zugestellt. Diese Invariante wird an genau einer Stelle durchgesetzt — `executeDeliveries()` im Notification-Worker (`server/notifications/service.ts`) — und nicht in den einzelnen Recipient-Resolvern oder Notification-Modulen. Der Worker ist der einzige Punkt, an dem alle Notification-Typen und beide Kanäle zusammenlaufen; er filtert zum Versandzeitpunkt mit frischem `membershipStatus`.

## Considered Options

- **Per-Resolver / per Notification-Typ** (Status quo vor dieser Entscheidung) — jeder Aufrufer setzt selbst `activeMembersOnly`. Nachweislich fehleranfällig: `event_canceled` „vergaß" den Filter (Issue #217), drei Reminder-Typen filterten nie.
- **Mail-Service** — verworfen: der Mail-Service ist reiner Transport (kennt nur Adressen, keine `userId`/kein Mitglied), würde transaktionale Magic-Link-Mails mitfangen und deckt Push gar nicht ab.
- **Worker, Enqueue-Zeitpunkt (`notify()`)** — verworfen zugunsten des Versandzeitpunkts: `executeDeliveries()` ist ohnehin der Per-User-Fan-out-Punkt, und der Versandzeitpunkt nutzt frische Daten (Deaktivierung zwischen Enqueue und Cron-Lauf wird mitgenommen).

## Consequences

Die Recipient-Resolver (`recipients.registeredFor`, `recipients.allMembers`, `recipients.allAdmins`) filtern bewusst **nicht** nach Mitgliedsstatus — das frühere `activeMembersOnly`-Flag wurde entfernt. Beim Lesen sieht das wie ein Bug aus, ist es aber nicht: Wer hier einen Membership-Filter „nachrüstet", dupliziert die Invariante und macht sie wieder lückenhaft. Die Invariante gilt ausnahmslos für jeden Notification-Typ, auch admin-gerichtete.
