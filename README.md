# Rotina RPG — Versão 1

Cumpra sua rotina na vida real e seu herói fica mais forte no jogo.

## O que já tem nesta versão
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
Abra http://localhost:5173. No navegador, notificações e GPS ficam desligados; o resto funciona.

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
- Na primeira abertura o app pede: notificações, horário exato, bateria e localização.
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
    game.js        motor do combate e chefões
    ui.js          telas e abas
    onboarding.js  primeira abertura
    mentor.js      Conselho do Mestre: perguntas e rotina sugerida
    notify.js      notificações, permissões, backup no Android
    main.js        inicialização
android-res/missao.wav   som das notificações
scripts/setup-android.mjs  ajusta o projeto Android (som + permissões)
```

## Próximas versões
- **V2:** check-in semanal do Mestre (sugere subir ou baixar o desafio), caminhada com GPS, modo foco, missões semanais, pet, regra dos 70% para chefões, Neve e Caverna, elites, dia/noite, resumo semanal, modo dia difícil, baú surpresa
- **V3:** vila, bestiário, visuais e poções, Pântano e Inferno, Modo Pesadelo, eventos, marcar pela notificação sem abrir o app, widget
