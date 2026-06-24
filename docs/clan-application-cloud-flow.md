# Clan application flow (cloud) — reference

Referenciado nas regras do projeto (**§2 — `docs/`**, `l2mini-project-rules.mdc`). Atualizar este ficheiro quando mudar contratos.

## 1. SQL (Supabase)

Aplicar a função atual a partir de `supabase_MASTER_SETUP.sql` ou `supabase_clans_authority.sql`:

- **`apply_to_clan_secure(p_clan_id UUID, p_char_name TEXT DEFAULT NULL)`**
  - Resolve o personagem com **`p_char_name`** (case-insensitive) + `auth.uid()`; se `NULL`, cai no `LIMIT 1` (legado).
  - `INSERT` em `clan_applications` + **CTE `WITH ins AS (… RETURNING id)`**.
  - **Correio ao líder:** `INSERT mailbox` com `sender_name = 'System'`, assunto exato **`New Clan Application`**, `details` JSON com:
    - `nome` (candidato), `nivel`, **`application_id`** (UUID do pedido).
  - Evita `send_mail_secure` para o aviso ao líder (mesma conta líder/candidato não bloqueia com `cannot_mail_self`).

- **`respond_clan_application_secure`** — inalterado no conceito: aceite envia correio **`Clan Application Accepted`** ao candidato.

- **Deploy:** `DROP FUNCTION IF EXISTS apply_to_clan_secure(UUID);` e `(UUID, TEXT)` antes do `CREATE`, depois **`GRANT EXECUTE … (UUID, TEXT)`**.

## 2. Cliente — API

**`js/systems/supabase_api.js`**

- `applyToClan`: RPC com `{ p_clan_id, p_char_name: _charName || null }`.
- `respondClanApplication`, `sendMail`, etc. como já documentado no GDD.

## 3. Cliente — pedido e resposta

**`js/ui_clans.js`**

- **Globais obrigatórias** (evitar `ReferenceError` em `onclick` do correio):
  - `var clans = [];`
  - `var playerClanId = null;`
  - `var solicitacoesClan = [];`

- **`entrarNoClan`:** nuvem só RPC; não duplicar `enviarMail` no cliente para o líder (o servidor envia).

- **`responderSolicitacao(nome, aceito, applicationId)`**
  - Devolve **`Promise<boolean>`** (`true`/`false`) para o correio saber se pode arquivar a mensagem.
  - Se `!clan` em memória mas há sessão nuvem: **`await iniciarSistemaClans()`** e voltar a resolver `clan` (fluxo pelo e-mail sem abrir o hub antes).
  - Nuvem: exige **`applicationId`** (UUID); sem isso mostra i18n `game.clan.applicationCloudIdMissing`.

## 4. Cliente — correio

**`js/systems/mailbox_engine.js`**

- **`normalizeMailboxDetails`:** expor **`applicationId`** / `application_id` para os botões.
- **Tipo `clan`:** mostrar Aceitar/Recusar **só** se `msg.assunto === 'New Clan Application'`  
  (não usar `includes('Application')` — **`Clan Application Accepted`** também contém “Application”.)
- **`processarAcaoMail`** para `clan_accept` / `clan_decline`:
  - `await responderSolicitacao(param, aceito, appId)`;
  - se **`ok === false`**, **`return`** antes de arquivar o mail.

- **`verPerfilPeloMail(nome)`** → `abrirPerfilMembroClan(nome)` + ajuste de z-index do modal.

## 5. Cliente — inspeção (género + arte)

**`js/ui_chat.js`** (`abrirPerfilChat` → payload cloud)

- Incluir no `profileData`: **`charGender`** (`'Male' | 'Female'`) a partir do JSONB.
- Manter **`_classKey`** (classe crua) para avatar.

**`js/ui_main.js`** — **`abrirPerfilJogadorRanking`**

- **Sempre** declarar `let modalPerfil = document.getElementById('modal-perfil-ranking');` antes de `if (!modalPerfil) return`.
- Retrato: se `charGender` presente → **`AuthEngine.getAvatarForClass(_classKey ou classe, raça, charGender)`**; senão fallback `radarDeRacas` + `isMage` (bots legado).
- Subtítulo: nível · raça · etiqueta i18n `creation.genderFemale` / `creation.genderMale` · classe formatada.

**`js/ui_clans.js`** — save local em **`fakeBot`:** incluir `charGender` quando existir no save.

## 6. Ficheiros tocados (memória rápida)

| Área        | Ficheiros principais |
|------------|------------------------|
| SQL        | `supabase_MASTER_SETUP.sql`, `supabase_clans_authority.sql` |
| API        | `js/systems/supabase_api.js` |
| Clã UI     | `js/ui_clans.js` |
| Correio    | `js/systems/mailbox_engine.js` |
| Inspeção   | `js/ui_chat.js`, `js/ui_main.js` |

## 7. Validação manual

1. Candidato com conta/personagem distinto (ou mesma conta, personagem distinto) pede entrada.
2. Líder recebe mail `New Clan Application` com inspeção correta (raça, sexo, classe, imagem).
3. Aceitar pelo **correio** fecha o pedido sem ter de repetir no painel do clã.
4. Recusar idem; mail antigo sem `application_id` pode falhar na nuvem (esperado).

---

*Última sincronização com o fluxo “100% funcional” descrito pelo produto; atualizar este ficheiro se as RPCs ou o contrato do `details` mudarem.*
