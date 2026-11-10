# Rotina RPG — Versão 3

Cumpra sua rotina na vida real e seu herói fica mais forte no jogo.

## Novidades da 3
- **Vila** (aba nova): Loja (ver e escolher o que vestir), Ferreiro (forja por peça, até +3), Mercador (capas e poções, nível 3) e Biblioteca (bestiário, depois do 1º mini-chefão)
- 13 equipamentos de conquista com poderes; capas aparecem no herói
- Eventos: Halloween (24/10–02/11), Natal (18–26/12) e aniversário (data em Ajustes)
- Elites (Gigante, Veloz, Blindado, Vampiro, Explosivo), chefões de outra cor no Modo Pesadelo, dia e noite pela hora real
- Regra dos 70%: o chefão só aparece com 70% da rotina dos últimos 7 dias cumprida
- Baú surpresa nas missões no horário
- Missões da semana com baú no domingo, modo dia difícil (2 por semana), modo foco ⏱ (+50%)
- Resumo da semana com gráfico, diário do dia e check-in semanal do Mestre (pausar missão, mudar horário, subir o desafio)
- Android: ícone que evolui (6 fases, dá para travar), abertura animada, widget com o herói e a próxima missão, "Feito" na notificação sem abrir o app, aviso de atualização com download e instalação
- A permissão de localização saiu

## Da 1.1
- Visual estilo Terraria (desenhos originais): contorno colorido, luz e sombra, monstros se despedaçando
- Herói com combos (corte, estocada, giro, salto no crítico, golpe de escudo), recuo e pose de vitória
- Escudo (bloqueio) e armadura em 3 peças visíveis: capacete, peitoral, calças e botas
- 7 biomas: Floresta, Deserto, Neve, Caverna, Pântano, Castelo Sombrio e Inferno, com 42 monstros e Modo Pesadelo depois da fase 70
- Monstros com jeitos de lutar: rápidos, à distância, teia, rouba vida, gelo, fogo, regeneração, saem do chão
- 7 chefões grandes e animados, até o Dragão Ancestral (cospe fogo e se enfurece)
- 6 pets: Lobinho, Coruja, Gatinho, Slime de Estimação, Morceguinho e Dragãozinho, com evolução, humor, nome e habilidade
- Cena do jogo fixa no topo no celular
- O dia do jogo vira à 1h da manhã

## O que já tem desde a 1.0
- Criação do herói (nome, pele, cabelo, roupa) e tela de permissões na primeira abertura
- Conselho do Mestre: perguntas sobre sua rotina (horários, tempo livre, objetivo, o que você adia, quanto treina) que montam as missões iniciais no seu nível
- Missões de foco ⭐ (até 3): ficam com uma fatia maior dos 300 XP do dia; dá para refazer as perguntas em Ajustes
- Rotina com horário, dias da semana, categoria e duração; o jogo decide o XP (300 XP por dia, divididos entre as missões)
- Atraso: até 30 min 100%, até 2 h 75%, depois 50%; missão libera 1 h antes; Fúria no horário e Cansado com atraso
- Dia de descanso (1 ou 2 por semana): herói dorme na clareira ao lado da fogueira; no dia seguinte acorda Descansado (+10% XP de manhã)
- Notificações com som do jogo e botões Feito / Adiar 10 min ("Feito" em missão de Sono na hora conta como verificada, +50%)
- Frases motivacionais (manhã, missão, feito, atraso, nível, sequência, queda, noite, descanso) + suas próprias frases
- Equipamento por nível com baú animado; ouro dos monstros para forjar (+1/+2/+3)
- Atributos por categoria: Força, Sabedoria, Vitalidade, Resistência
- Combate: Floresta (fases 1–10) e Deserto (11+), 8 monstros, mini-chefão na fase 5 e chefão na fase 10
  - Slime Colossal se divide em 3 · Faraó Esquecido invoca múmias · chefões avisam o golpe forte (piscam vermelho)
- 18 conquistas, títulos e relíquias
- Progresso offline (até 8 h)
- Backup: exportar (Google Drive pelo menu de compartilhar) e importar

## Testar no navegador do PC
Precisa do [Node.js](https://nodejs.org) (versão 18 ou mais nova).

```bash
npm install
npm run dev
```
Abra http://localhost:5173. No navegador, notificações, widget e ícone ficam desligados; o resto funciona.

## Gerar o APK pelo GitHub (mais fácil, sem Android Studio)
1. Crie um repositório no GitHub e envie esta pasta (o `.gitignore` já deixa `node_modules` e `android` de fora).
2. A cada envio para a branch `main`, o GitHub compila o APK sozinho (aba **Actions**, uns 5 min).
3. O APK aparece em **Releases** como `RotinaRPG.apk`. Mande o link para quem quiser instalar.
4. A chave de assinatura é sempre a mesma (`android-res/debug.keystore`), então o APK novo instala por cima do antigo sem perder o progresso.

## Gerar o APK no PC com Android Studio
1. Instale o [Android Studio](https://developer.android.com/studio) (ele já traz o SDK e o Java).
2. Na pasta do projeto:
   ```bash
   npm install
   npm run android:add      # cria a pasta android/ e já coloca som + permissões
   npm run sync
   npm run open             # abre no Android Studio
   ```
3. No Android Studio: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
4. O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Passe para o celular (cabo, Drive ou WhatsApp), abra o arquivo e permita **instalar de fontes desconhecidas**.

Sempre que mudar o código em `www/`, rode `npm run sync` e gere o APK de novo.

## Depois de instalar
- Na primeira abertura o app pede: notificações, horário exato e bateria.
- Ao atualizar da 1.1 para a 3, o atalho antigo pode sumir da tela inicial: pegue o ícone novo na gaveta de apps.
- Widget: segure o dedo na tela inicial → Widgets → Rotina RPG.
- Se as notificações atrasarem: Configurações → Apps → Rotina RPG → Bateria → **Sem restrições**.
- As notificações são agendadas para os próximos 7 dias sempre que você abre o app.

## Estrutura
```
www/
  index.html
  css/        estilos e fontes
  fonts/      fontes embutidas (funciona offline)
  assets/     som da missão
  js/
    data.js        tabelas: categorias, armas, armaduras, monstros, biomas, conquistas
    state.js       estado salvo, datas, backup
    rules.js       regras: XP, atraso, descanso, atributos, forja, conquistas, offline
    phrases.js     frases motivacionais
    sprites.js     pixel art: herói, monstros, cenários, baú, fogueira
    game.js        motor do combate, chefões e pets
    monsters.js    desenho dos 42 monstros e dos chefões grandes
    pets.js        desenho dos pets
    ui.js          telas e abas
    village.js     aba Vila: loja, ferreiro, mercador, biblioteca
    gear.js        equipamentos, forja, capas e poções
    events.js      eventos do calendário e dia/noite
    week.js        missões da semana, foco, diário, resumo, check-in
    native.js      ponte com o Android: ícone, widget, atualização
    onboarding.js  primeira abertura
    mentor.js      Conselho do Mestre: perguntas e rotina sugerida
    notify.js      notificações, permissões, backup no Android
    main.js        inicialização
android-res/missao.wav   som das notificações
scripts/setup-android.mjs  ajusta o projeto Android (som + permissões)
```

## Android (pasta android-res)
- `native/`: código Java (ponte RpgNative, botão Feito sem abrir o app, widget)
- `res/`: ícones do herói, abertura, layout do widget
- `scripts/setup-android.mjs` copia tudo para o projeto Android a cada compilação
