# Mute/Follow auch auf Ankündigungs-Threads erlaubt

Folgen und Stummschalten wirken auf **jedem** Thread gleich — auch auf Ankündigungs-Beiträgen im Mandatory-Raum. Wir lehnen einen `muted`-Override dort **nicht** serverseitig ab und blenden den Toggle im UI **nicht** aus. Grund: Ein Override betrifft ausschließlich die Kommentar-Benachrichtigung (`thread_new_comment`); der Ankündigungs-Broadcast (`thread_announcement`) liest gar keine Overrides und erreicht ausnahmslos alle aktiven Mitglieder. Mute auf einem Ankündigungs-Thread kann also nur die *Diskussion darunter* stummschalten — nie die Ankündigung selbst —, und das ist legitim.

## Considered Options

1. **Diskussion unter Ankündigungen ist mutebar wie überall** *(gewählt)* — der `thread_announcement`-Broadcast bleibt Pflicht (mute-immun durch Konstruktion, da `dispatchAnnouncementNotification` direkt an alle aktiven Mitglieder geht und die Override-Tabelle nicht anfasst). Der Kommentar-Stream darunter folgt der normalen Folgen/Stummschalten-Logik.
2. **Alles unter einer Ankündigung ist Pflicht-Empfang** — Server lehnt `muted` bei Mandatory-Räumen ab, UI-Toggle bleibt deaktiviert (ursprüngliche US #36). Verworfen: Das hätte nur die *Kommentar-Noise* unterdrückt — eine legitime Stummschaltung — ohne den Broadcast je zu berühren. Der vermeintliche Schutz war wirkungslos, die Sperre reine Reibung.

## Consequences

- US #36 aus Epic #234 („Ankündigungs-Beitrag nicht stummschalten können, Mute-Toggle deaktiviert") ist hierdurch revidiert.
- `thread_announcement` bleibt in der Notification-Registry mandatory (kein Opt-out in `/profil/benachrichtigungen`, US #35/#40). Nur der per-Thread-Override und der per-Kanal-Toggle für `thread_new_comment` sind frei.
- **Falle für künftige Leser:** Eine `muted`-Zeile auf einem Ankündigungs-Thread sieht nach einem Loch im „Ankündigungen erreichen jeden"-Versprechen aus, ist aber keins — der Broadcast-Pfad wertet Overrides nie aus. Ausgelöst wurde diese Entscheidung durch Review-Finding #263.
