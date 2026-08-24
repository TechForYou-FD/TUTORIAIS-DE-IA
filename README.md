# TechForYou — App do canal

App web (estática, sem build) do canal de YouTube **[@TechForYou-ww3zt](https://www.youtube.com/@TechForYou-ww3zt)**, de Fátima Diogo.

Mostra em permanência os vídeos das playlists **Lives de IA** e **Uso Inteligente de IA**, com uma secção de ligação aos [tutoriais online](https://techforyou-fd.github.io), modo claro/escuro e animações em todos os elementos interativos.

## Estrutura

```
index.html                 → estrutura da página
assets/css/style.css       → temas (claro/escuro), animações, responsividade
assets/js/app.js           → lógica: tema, tabs, carregar dados, modal de vídeo
assets/img/favicon.svg     → ícone do site
data/videos.json           → vídeos das playlists (gerado automaticamente)
data/tutorials.json        → lista de tutoriais (editar manualmente ao adicionar novos)
scripts/fetch-videos.mjs   → script Node que atualiza data/videos.json
.github/workflows/update-videos.yml → corre o script a cada 3h no GitHub Actions
```

## Como fica sempre atualizado

Um workflow do GitHub Actions (`update-videos.yml`) corre a cada 3 horas — e também
sempre que é acionado manualmente na aba *Actions* — e:

1. Vai buscar os vídeos mais recentes das duas playlists;
2. Escreve o resultado em `data/videos.json`;
3. Faz commit e push automático se houver vídeos novos.

Por defeito usa o **feed RSS público** de cada playlist (não precisa de nenhuma
chave), mas isso só devolve os ~15 vídeos mais recentes por playlist.

### Opcional: lista completa com a YouTube Data API

Para que `data/videos.json` inclua **todos** os vídeos de cada playlist (não só
os últimos 15), cria uma chave gratuita da YouTube Data API v3:

1. Consola do Google Cloud → cria/seleciona um projeto → ativa **YouTube Data API v3**.
2. Cria uma **API key** (podes restringi-la à YouTube Data API v3).
3. No repositório GitHub: **Settings → Secrets and variables → Actions → New repository secret**,
   com o nome `YOUTUBE_API_KEY`.

O workflow deteta automaticamente o segredo e passa a usar a API em vez do RSS.

## Adicionar novos tutoriais

Sempre que publicares um novo tutorial em [techforyou-fd.github.io](https://techforyou-fd.github.io),
adiciona uma entrada em `data/tutorials.json`:

```json
{ "slug": "nome-curto", "title": "Nome da ferramenta", "initials": "XX", "description": "Frase curta.", "url": "https://techforyou-fd.github.io/tutorial-nome.html" }
```

## Publicar no GitHub Pages

1. **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main` / `(root)`.
2. Confirma que o workflow tem permissão de escrita (`Settings → Actions → General → Workflow permissions → Read and write permissions`) para poder fazer commit de `data/videos.json`.

## Desenvolvimento local

Não há build. Basta servir a pasta com qualquer servidor estático, por exemplo:

```
npx serve .
```

Para testar a atualização de vídeos localmente:

```
node scripts/fetch-videos.mjs
```
