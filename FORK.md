# Fork-Guide: aip-tb-office-agents

Dieses Repository ist ein Fork von [hewliyang/office-agents](https://github.com/hewliyang/office-agents).
Dieser Guide gilt für alle Entwickler und KI-Agenten, die an diesem Repo arbeiten.

## Upstream & Remotes

```bash
# Upstream einmalig konfigurieren (falls noch nicht vorhanden)
git remote add upstream https://github.com/hewliyang/office-agents.git
git fetch upstream

# Upstream-Updates einspielen
git fetch upstream
git merge upstream/main --no-ff
```

**Wichtig:** Immer `--no-ff` verwenden. Der Merge-Commit macht sichtbar, wo Upstream-Code aufhört und unserer anfängt.

---

## DO's — Was ihr tun sollt

### Neue Dateien statt bestehende ändern
Der sicherste Weg, Merge-Konflikte zu vermeiden: Neue Dateien anlegen statt bestehende anfassen.

```
packages/excel/src/lib/tools/
├── read-range.ts          ← upstream (nicht anfassen)
├── set-cell-range.ts      ← upstream (nicht anfassen)
└── tb-custom-tools.ts     ← unser Code, kein Konfliktrisiko
```

### Eigene Tools über das AppAdapter-Pattern hinzufügen
Das Projekt ist explizit für Erweiterungen designed. Neue Tools in separaten Dateien anlegen und im Adapter registrieren:

```typescript
// packages/excel/src/lib/tools/tb-mein-tool.ts  (neue Datei)
import { defineTool } from "@office-agents/sdk";

export const meinTool = defineTool({ ... });
```

```typescript
// packages/excel/src/lib/adapter.tsx  (minimale Änderung: nur Import + Array-Eintrag)
import { meinTool } from "./tools/tb-mein-tool";

tools: [...existingTools, meinTool]
```

### Neue VFS-Befehle als separate Einträge hinzufügen
In `packages/*/src/lib/vfs/custom-commands.ts` neue Commands ans Ende des Arrays anhängen — nicht bestehende Einträge umstrukturieren.

### Eigene Packages für größere Features anlegen
Für umfangreiche TB-spezifische Funktionalität ein eigenes Package erstellen:

```
packages/tb-features/   ← komplett außerhalb des Upstream-Scopes
```

### Namenskonventionen für TB-spezifische Dateien
Präfix `tb-` für alle Dateien und Verzeichnisse, die nicht upstream zurückgeführt werden sollen:
- `tb-custom-tools.ts`
- `tb-branding/`
- `packages/tb-*/`

### `manifest.xml` für Branding anpassen
Name, Icons, URLs im Manifest können ohne Upstream-Konflikt angepasst werden. Das Manifest ist zu produktspezifisch um vom Upstream überschrieben zu werden.

### Vor Upstream-Merge immer prüfen
```bash
git fetch upstream
git diff HEAD upstream/main --name-only   # Welche Dateien ändern sich?
```
Nur wenn keine unserer geänderten Dateien dabei sind, ist ein konfliktfreier Merge wahrscheinlich.

---

## DON'Ts — Was ihr lassen sollt

### Keine direkten Änderungen an SDK-Kerndateien
`packages/sdk/` ändert sich am häufigsten upstream. Direktänderungen führen garantiert zu Konflikten.

```
packages/sdk/src/runtime.ts       ← NICHT direkt ändern
packages/sdk/src/tools/bash.ts    ← NICHT direkt ändern
packages/sdk/src/storage/         ← NICHT direkt ändern
```

**Ausnahme:** Bugfixes, die ihr upstream einreichen wollt.

### Keine strukturellen Änderungen an bestehenden Tool-Dateien
Bestehende Tools (z.B. `read-range.ts`, `set-cell-range.ts`) nicht umbenennen, verschieben oder refactoren — das zerreißt Upstream-Merges.

### Keine Root-Konfiguration ohne Grund ändern
Diese Dateien werden upstream regelmäßig angefasst:
- `pnpm-workspace.yaml`
- Root `package.json`
- `tsconfig.json`
- `biome.json`

Nur ändern wenn unbedingt nötig. Änderungen dokumentieren.

### Kein `git rebase upstream/main`
Rebase schreibt die Commit-History um und macht es schwer nachzuvollziehen, was unsere Änderungen sind. Immer `merge` verwenden.

### Keine Umbenennung von Exporten aus `core` oder `sdk`
Der Adapter-Vertrag (Interfaces, Typen, Exports aus `@office-agents/core` und `@office-agents/sdk`) sollte nicht lokal umbenannt/gewrappt werden — das bricht beim nächsten Upstream-Update.

---

## Konflikt-Ampel

| Bereich | Risiko | Empfehlung |
|---|---|---|
| `packages/sdk/src/` | Rot | Nicht anfassen |
| `packages/core/src/chat/chat-interface.tsx` | Rot | Nicht anfassen |
| `packages/core/src/chat/app-adapter.ts` | Rot | Nicht anfassen |
| `packages/*/src/lib/adapter.tsx` | Gelb | Minimal halten (nur Tool-Registrierung) |
| `packages/*/src/lib/tools/` | Grün | Neue `tb-*.ts` Dateien sind sicher |
| `packages/*/src/lib/vfs/custom-commands.ts` | Grün | Neue Einträge ans Ende |
| `manifest.xml` | Grün | Frei anpassbar |
| `packages/tb-*/` | Grün | Komplett außerhalb Upstream-Scope |

---

## Upstream-Update Workflow

```bash
# 1. Upstream holen
git fetch upstream

# 2. Konfliktpotential prüfen
git diff HEAD upstream/main --name-only

# 3. Merge durchführen
git merge upstream/main --no-ff -m "chore: merge upstream vX.Y.Z"

# 4. Bei Konflikten: nur unsere tb-* Änderungen behalten, upstream-Logik nicht wegwerfen
# 5. Typecheck & Lint laufen lassen
pnpm check
```

---

## Upstream-Beiträge (Bugfixes zurückgeben)

Wenn ihr einen Bug im Upstream findet und fixt:
1. Den Fix so minimal wie möglich halten (keine TB-spezifische Logik einmischen)
2. PR gegen `hewliyang/office-agents` öffnen
3. Nach Merge: beim nächsten Upstream-Update wird der Fix automatisch integriert → eigene Änderung entfernen
