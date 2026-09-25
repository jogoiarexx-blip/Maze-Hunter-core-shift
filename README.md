# Maze Hunter: Core Shift v0.7.0

Protótipo jogável inspirado na lógica de labirintos clássicos, mas com progressão, power-ups de fase e melhorias permanentes.

## Como jogar
Abra `index.html` em um navegador moderno. O pacote também funciona ao abrir o arquivo diretamente, sem servidor local.

Controles:
- WASD / Setas: movimento
- Espaço: Dash
- E: EMP Pulse (depois de desbloquear)
- Esc: Pausar/continuar

## Correções da v0.6.4
- Corrigido o JavaScript que era bloqueado ao abrir `index.html` diretamente e deixava o personagem sem movimento.
- Entrada de teclado normalizada para WASD, setas e Espaço.
- Comando pressionado durante a contagem regressiva fica enfileirado e começa ao aparecer “VAI!”.
- Corrigidos cristais e power-ups configurados dentro de paredes.
- Reinício e troca de fase agora cancelam o loop anterior, evitando jogo acelerado ou controles inconsistentes.
- Controles touch usam captura de ponteiro e não soltam mais o comando ao deslizar levemente o dedo.
- Validação automática de todos os spawns e itens ao iniciar cada fase.

## Sistemas incluídos
- 1 fase jogável
- Fragmentos normais e especiais
- Overdrive para derrotar inimigos
- 4 comportamentos de inimigos
- 6 power-ups temporários
- 5 upgrades permanentes
- Cristais como moeda permanente
- Salvamento com localStorage
- Combo de eliminações
- Sprites WebP transparentes e separados por animação

## Estrutura dos assets
`assets/sprites/player/`
- idle
- move
- dash
- overdrive
- hurt
- death

`assets/sprites/enemies/`
- hunter
- strategist
- ambusher
- phase

`assets/sprites/powerups/`
- speed
- shield
- magnet
- freeze
- phase
- teleport

## Próximas versões sugeridas
- Boss da Fase 1
- mapa procedural/variações
- seleção de build com 3 slots
- áudio e música
- gamepad/mobile
- mais animações e inimigos
- novos mundos e tilesets


## v0.6.3 — Nova identidade do protagonista
- O sprite circular inspirado em Pac-Man foi removido.
- Novo protagonista original: criatura energética encapuzada, corpo escuro, olhos ciano e aura azul/roxa.
- Animações WebP independentes: idle (6), movimento (6), dash (5), Overdrive (6), dano (4) e morte (6).
- Frames com transparência e recorte individual.
- Dash ganhou rastros de energia.
- Overdrive ganhou brilho roxo próprio.
- Render do personagem aumentado e com glow dinâmico.
- Menu inicial agora mostra o novo protagonista.


## Novidades v0.6.3
- Objetivos múltiplos na Fase 1.
- 2 terminais interativos.
- Chave do Núcleo.
- Portão bloqueado/aberto com animação WebP.
- Boss real: Core Warden.
- Boss com HP, perseguição, ataque, dano, invulnerabilidade curta e recompensa.
- 4 estados animados do boss: idle, attack, hurt e death.
- Progressão da fase agora exige fragmentos + terminais + chave + boss.
- Novos assets WebP organizados em `assets/sprites/items` e `assets/sprites/bosses`.


## Correções e menu v0.6.3
- Corrigido crash `drawImage`: frames agora são validados antes de desenhar.
- Fallback visual impede que um asset ausente derrube o jogo.
- Menu principal completo com Jogar, Núcleo, Equipamentos, Coleção, Opções, Controles e Créditos.
- Menu de pausa com Continuar, Opções, Reiniciar e Voltar ao Menu.
- Qualidade gráfica: Automático, Baixo, Médio e Alto.
- Volume geral e opção de reduzir flashes salvos em `localStorage`.
- Fullscreen pelo menu.
- Build com até 3 módulos equipados.
- Tela de coleção de personagem, inimigos e boss.
- Identificação da versão corrigida em todas as telas e arquivos do pacote.


## v0.6.3
- Seleção de fases real no menu.
- Fase 2: Metrô Espectral, com mapa próprio e tema visual próprio.
- Novo inimigo Rail Sentinel com 6 frames WebP.
- Checkpoint funcional com respawn.
- Bateria Espectral como objetivo especial da Fase 2.
- Trilhos/zonas elétricas pulsantes que causam dano.
- Fase 2 com 3 terminais, novo posicionamento de power-ups e inimigos.
- Progressão: Fase 2 desbloqueia após concluir a Fase 1.
- Suporte a gamepad com analógico/D-pad e dash.
- Controles mobile na tela.
- Corrigido fim de fase/Game Over: não dependem mais do antigo `#overlay`.
- Loader tolerante a assets ausentes e `drawImage` protegido em todos os elementos.
- Novos thumbnails WebP para seleção de fases.


## v0.6.3 — Correção de movimento e colisão
- Reescrita a colisão usando círculo contra tiles sólidos.
- Player agora usa direção atual + direção enfileirada, permitindo curvas naturais nos corredores.
- Movimento diagonal removido para evitar travar nas quinas.
- Snap automático ao centro do tile em cruzamentos.
- Inimigos agora só escolhem direções válidas nos corredores.
- Hunter, Strategist, Ambusher e Sentinel respeitam paredes.
- Phase não atravessa mais parede; mantém apenas comportamento/visual especial.
- Reversão e cruzamentos tratados separadamente.


## v0.6.3
- Nova Fase 3: Cidade Neon.
- Novo inimigo Neon Stalker com 6 frames WebP.
- Novo boss Neon Overmind com idle, ataque, dano e morte.
- Fase 3 com 4 terminais, zonas elétricas e 7 HP de boss.
- Progressão agora segue Fase 1 → Fase 2 → Fase 3.
- Novo upgrade permanente: Núcleo de Combo.
- Novo upgrade permanente: Sintonia de Cristais.
- Combo agora aumenta pontuação com bônus permanente.
- Recompensa de conclusão pode receber cristais extras por upgrade.
- Coleção atualizada com Neon Stalker e Neon Overmind.


## v0.6.3
- Nova Fase 4: Ruínas do Vazio.
- Novo inimigo: Void Weaver, com 6 frames WebP.
- Novo boss: Abyss Engine, com idle, ataque, dano e morte.
- Nova habilidade ativa permanente: EMP Pulse.
- EMP Pulse pode ser desbloqueado e melhorado no Núcleo.
- Novo upgrade Recarga EMP.
- Novo upgrade Coletor Raro para aumentar chance de cristais em eliminações.
- Combo agora possui temporizador real e barra visual.
- Drops raros de cristais durante combate.
- Ranking C/B/A/S ao concluir fase.
- Resultado mostra tempo, vidas, eliminações e drops raros.
- Favicon agora usa caminho local `./favicon.ico`, compatível com GitHub Pages do projeto.
- Pacote completo contém todos os assets antigos e novos.


## v0.6.3 — Movimento, spawn e largada
- Refeito o movimento do player por corredores/tile centers para eliminar travamentos.
- Player fica bloqueado durante 3 segundos no início de cada fase.
- Contagem regressiva visual 3 → 2 → 1 e aviso VAI.
- Depois que o player é liberado, os inimigos aguardam mais 5 segundos.
- Inimigos são liberados somente após 8 segundos do início total.
- Contagem “INIMIGOS EM 5…1” aparece enquanto o jogador tem vantagem.
- Spawn de player e inimigos agora é validado; entidades nunca nascem dentro de paredes.
- Spawns inválidos antigos são movidos automaticamente para o tile livre mais próximo.
- Fantasmas/inimigos agora se movimentam somente entre tiles livres e respeitam paredes.
- Pausar o jogo também pausa os cronômetros de liberação.


## v0.6.3 — Auditoria e correções gerais
- Movimento do player refeito com substeps para não perder cruzamentos em FPS variável ou durante dash.
- Inimigos usam o mesmo sistema robusto de corredor e não atravessam paredes.
- Bosses agora também respeitam o labirinto e fazem pathing pelos corredores.
- Player, inimigos, terminais, checkpoint, item especial, saída, cristais, power-ups, armadilhas e boss têm spawn validado em tile livre.
- Respawn após dano é revalidado para nunca colocar o jogador dentro de parede.
- Proteção contra tela de resultado duplicada.
- Rank C/B/A/S restaurado na conclusão das fases.
- Texto do objetivo de boss generalizado para cada guardião.
- IA de corredores corrigida: direções agora são validadas pelo tile vizinho inteiro, não apenas alguns pixels à frente.
- Coordenadas de fase corrigidas para que nenhum terminal, checkpoint, inimigo, armadilha, saída ou item especial dependa de realocação automática.


## v0.6.3 — Segunda auditoria de bugs
- Corrigida troca de direção dentro dos substeps: curvas passam a usar a nova direção imediatamente.
- Corrigidos 4 fragmentos inalcançáveis na Fase 4; todas as fases agora têm todos os fragmentos conectados ao spawn.
- Pause congela power-ups, Overdrive, EMP, combo, invulnerabilidade, inimigos temporariamente derrotados e ciclo das armadilhas.
- Corrigida corrida do timer do boss que podia concluir uma partida nova após reiniciar ou sair rapidamente.
- Power-up Phase voltou a funcionar e reposiciona o player com segurança quando termina dentro de uma parede.
- Teleporte usa spawn validado e limpa movimento pendente.
- EMP Pulse atordoa bosses e, quando combinado com Overdrive, também causa dano.
- Teclas e controles touch são limpos quando a janela perde foco.
- O tempo do Rank não conta os 3 segundos iniciais antes de liberar o player.
- Recarga EMP não pode mais ser comprada antes de desbloquear o Módulo EMP.

- Conclusão após morte do boss agora usa o relógio do próprio loop, então também congela durante pause e não executa por trás dos menus.


## v0.7.0 — gameplay polish
- Build ativa limitada aos 3 módulos equipados.
- Dash e EMP usam acionamento por pressionamento, sem repetição ao segurar.
- Estados hurt/death do jogador e bosses agora têm duração real.
- Boss derrotado exige alcançar a saída para concluir a fase.
- Sprites do jogador permanecem na vertical e espelham ao olhar para a esquerda.
- Feedback de partículas e efeitos sonoros sintetizados respeitando o volume geral.
