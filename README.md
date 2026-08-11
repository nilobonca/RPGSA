# RPGSA (RPG Sound Architecture)

**RPGSA** (RPG Sound Architecture) é um sistema web avançado e imersivo para **Mestres e Jogadores de RPG de Mesa (TTRPG)**. Ele combina **áudio espacial por proximidade**, **abafamento dinâmico por paredes**, **soundboards interativos**, **tabuleiro/canvas 2D** e **sincronização P2P (WebRTC)** em tempo real.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![PeerJS](https://img.shields.io/badge/PeerJS-WebRTC-red?style=for-the-badge)

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Como Executar o Projeto](#como-executar-o-projeto)
- [Guia de Uso Completo](#guia-de-uso-completo)
  - [1. Dashboard e Projetos](#1-dashboard-e-projetos)
  - [2. Modo Mestre (Host)](#2-modo-mestre-host)
  - [3. Modo Jogador (Listener)](#3-modo-jogador-listener)
  - [4. Áudio Espacial e Zonas de Som](#4-áudio-espacial-e-zonas-de-som)
  - [5. Soundboard e Edição de Áudio](#5-soundboard-e-edição-de-áudio)
  - [6. Rolador de Dados e Chat](#6-rolador-de-dados-e-chat)
  - [7. Minigames Interativos Multijogador](#7-minigames-interativos-multijogador)
  - [8. Backup, Importação e Exportação](#8-backup-importação-e-exportação)
- [Estrutura do Código](#estrutura-do-código)
- [Licença](#licença)

---

## Visão Geral

O RPGSA foi desenvolvido para transformar a imersão sonora em campanhas de RPG. Em vez de apenas tocar músicas estáticas em um bot de voz, o RPGSA calcula em tempo real o volume, o pan estéreo (3D) e os filtros de frequência com base na posição exata dos personagens no mapa tático.

Se um personagem estiver atrás de uma parede grossa de pedra, o áudio será abafado; se aproximar de uma cachoeira ou fonte de monstros, o som aumentará dinamicamente de acordo com o raio de proximidade configurado pelo Mestre.

---

## Funcionalidades Principais

- **Mixagem de Áudio Espacial em Tempo Real**:
  - **Atenuação por Proximidade**: Defina o raio de alcance e fonte sonora.
  - **Panning Estéreo 3D**: Ajuste de posição espacial (-1 a 1) para posicionamento direcional nos fones de ouvido.
  - **Filtros de Áudio**: Filtro passa-baixa (*lowpass*), efeito telefone e atenuador de parede (*wall muffling factor*).
- **Canvas / Mapa Tático Interativo**:
  - Posicionamento de imagens de mapa com ferramentas de escala, rotação, recorte (crop), brilho, contraste e opacidade.
  - Camadas (*Layers*), ordenação, bloqueio e visibilidade.
  - Desenho de paredes (`ActiveWall`), áreas de som (`ActiveArea`), notas flutuantes e pins informativos.
- **Sincronização P2P Multi-jogador (PeerJS / WebRTC)**:
  - O Mestre atua como Host e os jogadores conectam via ID/PeerJS diretamente.
  - Sincronização em tempo real de posições de tokens, áudios ativos, rolagens de dados, chat e enquetes.
  - Transmissão de áudio via microfone e controle individual de ouvintes.
- **Soundboard Personalizável e Faixas Globais**:
  - Botões de atalho rápido com efeitos sonoros (SFX).
  - Trimming (corte de início e fim), volume individual e alteração de pitch/afinação.
  - Trilhas sonoras globais de fundo (*Global Tracks*).
- **Tray de Dados (Dice Tray)**:
  - Suporte a dados `d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100` e modificadores customizados.
  - Rolagens públicas para a mesa ou secretas (somente para o Mestre).
- **Minigames Interativos Multijogador**:
  - Sistema de janelas flutuantes síncronas no canvas para arrombamento de fechaduras, testes de velocidade de cliques, sorteios de cartas mágicas e cara ou coroa.
- **Persistência Local em IndexedDB**:
  - Guarde todos os seus áudios, mapas e configurações diretamente no navegador sem depender de servidores externos pesados.
  - Sistema completo de exportação/importação em ZIP/JSON com tratamento de conflitos.

---

## Tecnologias Utilizadas

- **Frontend Core**: [Next.js](https://nextjs.org/) (React 19, TypeScript)
- **Estilização e UI**: [TailwindCSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Gerenciamento de Estado**: [Zustand](https://zustand-demo.pmnd.rs/) e React Context
- **Persistência de Dados**: IndexedDB (`useIDB`)
- **Rede P2P**: [PeerJS](https://peerjs.com/) (WebRTC)
- **Manipulação de Arquivos e Áudio**: JSZip, FileSaver, Web Audio API

---

## Como Executar o Projeto

### Pré-requisitos

- **Node.js** (versão 18 ou superior)
- Gerenciador de pacotes (`npm`, `yarn`, `pnpm` ou `bun`)

### Passo a Passo

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/seu-usuario/RPGSA.git
   cd RPGSA
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse no seu navegador**:
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador preferido.

---

## Guia de Uso Completo

### 1. Dashboard e Projetos

Ao acessar o aplicativo, você estará na tela inicial (Dashboard):
- **Novo Projeto**: Clique em **`+ Novo Projeto`** para criar um novo ambiente de RPG.
- **Gerenciar Páginas/Cenas**: Cada projeto pode conter múltiplas páginas/cenas (ex: *Taverna*, *Masmorra - Andar 1*, *Floresta Negra*).
- **Importar/Exportar**: Utilize os botões de **Download** e **Upload** para salvar cópias de segurança (backups) de toda a sua biblioteca de áudios e mapas.

---

### 2. Modo Mestre (Host)

Como Mestre da sessão:
1. Abra a página do seu projeto/cena.
2. No menu lateral ou painel de sessão, clique em **Iniciar Sessão (Host)**.
3. Copie o **Código de Conexão (Peer ID)** gerado e envie aos seus jogadores.
4. Você terá controle total sobre:
   - Posicionar e mover qualquer token ou elemento do mapa.
   - Ativar ou pausar trilhas de áudio globais e soundboards.
   - Criar áreas de som e definir o fator de abafamento das paredes.
   - Enviar enquetes e visualizar os resultados dos jogadores em tempo real.
   - Fazer rolagens privadas de dados.

---

### 3. Modo Jogador (Listener)

Como Jogador:
1. Na barra superior ou tela de sessão, escolha **Conectar como Ouvinte (Listener)**.
2. Cole o **Peer ID** fornecido pelo seu Mestre.
3. Assim que a conexão for estabelecida:
   - Você verá o mapa compartilhado e o seu token de jogador.
   - O áudio reproduzido no seu navegador mudará conforme o Mestre altera a cena ou conforme o seu token se move pelo mapa.
   - Você pode usar o **Chat** e a **Bandeja de Dados** para interagir com a mesa.

---

### 4. Áudio Espacial e Zonas de Som

No Canvas de Projeto:
- **Criar Área de Som (`ActiveArea`)**: Escolha a ferramenta de polígono/área para desenhar uma região no mapa (ex: uma fogueira ou sala secreta).
  - Associe um áudio da sua biblioteca a essa área.
  - Selecione o modo de volume: **Estático** ou **Proximidade**.
  - No modo **Proximidade**, defina o raio de alcance. À medida que o token do jogador se aproxima do centro, o som fica mais forte.
- **Desenhar Paredes (`ActiveWall`)**:
  - Trace linhas de paredes no mapa.
  - Configure o **Fator de Abafamento** (*Muffling Factor*). Se a linha da parede cortar a trajetória entre o jogador e a fonte de som, o filtro *Lowpass* será aplicado automaticamente.

---

### 5. Soundboard e Edição de Áudio

- **Upload de Áudios**: Carregue arquivos de som em lote (`.mp3`, `.wav`, `.ogg`).
- **Editor de Áudio**:
  - Clique para editar qualquer faixa e ajustar os pontos de início (`Trim Start`) e fim (`Trim End`).
  - Defina o **Pitch** (afinação/tom) e o **Volume Base**.
- **Soundboard Grid**:
  - Adicione botões de atalho no painel rápido para reproduzir barulhos de espadas, trovões, portas rangendo, etc.

---

### 6. Rolador de Dados e Chat

- Clique no ícone de **Dados** no canto superior/inferior para abrir a **Dice Tray**.
- Selecione o dado desejado (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`, `d100`) ou adicione modificadores numéricos.
- **Público vs. Privado**: Mestres podem marcar a opção *Privado* para que apenas eles vejam o resultado no histórico de rolagens.

---

### 7. Minigames Interativos Multijogador

O RPGSA conta com um sistema de minigames síncronos executados em janelas flutuantes sobre o canvas, transmitidos em tempo real via WebRTC para todos os ouvintes da sessão:

- **Lockpicker de Precisão (`dial_lock`)**: Minigame mecânico de arrombamento de cofres e portas trancadas com mostrador circular e sensibilidade de combinação.
- **Desafio de Cliques (`clicker`)**: Desafio de velocidade de cliques em tempo real, ideal para representar testes de força física, resistência ou corridas de grupo.
- **Escolha uma Carta / Baralho Mágico (`cards`)**: Seleção de cartas aleatórias ou predefinidas para revelar itens em baús de tesouro, cartas de tarot ou encontros misteriosos.
- **Cara ou Coroa (`coin_flip`)**: Sorteio rápido de moeda para decisões de sorte instantâneas na mesa.
- **Gerenciamento de Presets e Permissões**: O Mestre pode salvar configurações em predefinidos (*presets*), abrir múltiplos minigames simultâneos, conceder permissões para jogadores específicos interagirem e acompanhar o progresso ou placar dos ouvintes em tempo real.

---

### 8. Backup, Importação e Exportação

- **Exportar**: Gera um arquivo compactado `.zip` contendo os bancos de dados IndexedDB, definições de camadas, soundboards e os arquivos de áudio originais.
- **Importar**: Permite restaurar um backup completo. Caso já existam projetos com o mesmo ID ou nome, a tela de **Conflito de Importação** permitirá escolher entre substituir, ignorar ou duplicar.

---

## Estrutura do Código

```
RPGSA/
├── src/
│   ├── components/       # Componentes de UI (Canvas, Soundboard, Chat, Dice, etc.)
│   ├── contexts/         # Contextos React (MinigamesContext, etc.)
│   ├── hooks/            # Hooks customizados (useProjectCanvasCore, etc.)
│   ├── interfaces/       # Definições de Interfaces e Tipos TypeScript
│   ├── lib/              # Bibliotecas auxiliares
│   ├── pages/            # Páginas e Rotas Next.js (Dashboard, Projects, Minigames)
│   ├── store/            # Gerenciamento de Estado Global Zustand (Theme, Canvas, etc.)
│   ├── styles/           # Arquivos de Estilos CSS e Tailwind
│   └── utils/            # Utilitários de IndexedDB, Áudio Espacial, Geometria e Exportação
├── public/               # Ativos estáticos
├── package.json          # Dependências e scripts do projeto
└── README.md             # Este documento
```

---

## Licença

Este projeto é desenvolvido para a comunidade de RPG de mesa. Sinta-se livre para contribuir, reportar problemas e propor melhorias!

