# Domain-Error → HTTP-Mapping via Modul-Wrapper

Jedes Domain-Modul (`server/registration`, `server/events`, …) exportiert einen eigenen `withXErrorMapping`-Wrapper, der seine spezifische Error-Klasse fängt und in eine H3-`createError`-Response übersetzt. Die Wrapper werden aus einer einzigen Factory `makeDomainErrorMapping(ErrorClass, toStatus)` in `server/utils/domain-error.ts` erzeugt — damit ist die Logik konsolidiert, aber an der Call-Site bleibt der sprechende Modul-Name (`withRegistrationErrorMapping(...)`).

## Considered Options

1. **Wrapper + Generalisierung** *(gewählt)* — Factory in `utils`, Modul-Wrapper als Konstante im jeweiligen `index.ts`. Konsistente API für alle Handler, eine Mikro-Entscheidung weniger pro neuem Handler.
2. **Wrapper abschaffen, überall try/catch** — explizit, aber repetitiv (vier Zeilen Boilerplate pro Handler).
3. **Status Quo dokumentieren** — Registration mit Wrapper, Events mit try/catch. Inkonsistenz bliebe und würde bei jedem neuen Handler eine willkürliche Wahl erzwingen.

## Ausnahme: `ladv-import.post.ts`

`EventError` trägt ein optionales `data`-Feld. Für `ladv_id_already_imported` enthält es die rohe `existingEventId`, die im HTTP-Response als verschlüsselte ID ausgeliefert werden muss (`encodeEventId`). Diese Encoding-Transformation ist HTTP-Concern und gehört nicht in die Domäne, also bleibt dieser eine Handler bei seinem expliziten `try/catch`. Ein Kommentar im Handler verweist hierhin.

Der Wrapper reicht `err.data` ansonsten unverändert an `createError({ data })` durch — für Fälle, in denen das Domain-Payload schon HTTP-safe ist.
