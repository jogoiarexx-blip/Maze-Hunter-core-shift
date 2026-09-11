# Maze Hunter: Core Shift v0.3.1

Protótipo jogável inspirado na lógica de labirintos clássicos, mas com progressão, power-ups de fase e melhorias permanentes.

## Como jogar
Abra `index.html` em um navegador moderno.

Controles:
- WASD / Setas: movimento
- Espaço: Dash

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


## v0.3.1 — Nova identidade do protagonista
- O sprite circular inspirado em Pac-Man foi removido.
- Novo protagonista original: criatura energética encapuzada, corpo escuro, olhos ciano e aura azul/roxa.
- Animações WebP independentes: idle (6), movimento (6), dash (5), Overdrive (6), dano (4) e morte (6).
- Frames com transparência e recorte individual.
- Dash ganhou rastros de energia.
- Overdrive ganhou brilho roxo próprio.
- Render do personagem aumentado e com glow dinâmico.
- Menu inicial agora mostra o novo protagonista.


## Novidades v0.3.1
- Objetivos múltiplos na Fase 1.
- 2 terminais interativos.
- Chave do Núcleo.
- Portão bloqueado/aberto com animação WebP.
- Boss real: Core Warden.
- Boss com HP, perseguição, ataque, dano, invulnerabilidade curta e recompensa.
- 4 estados animados do boss: idle, attack, hurt e death.
- Progressão da fase agora exige fragmentos + terminais + chave + boss.
- Novos assets WebP organizados em `assets/sprites/items` e `assets/sprites/bosses`.


## Correções e menu v0.3.1
- Corrigido crash `drawImage`: frames agora são validados antes de desenhar.
- Fallback visual impede que um asset ausente derrube o jogo.
- Menu principal completo com Jogar, Núcleo, Equipamentos, Coleção, Opções, Controles e Créditos.
- Menu de pausa com Continuar, Opções, Reiniciar e Voltar ao Menu.
- Qualidade gráfica: Automático, Baixo, Médio e Alto.
- Volume geral e opção de reduzir flashes salvos em `localStorage`.
- Fullscreen pelo menu.
- Build com até 3 módulos equipados.
- Tela de coleção de personagem, inimigos e boss.
- Identificação da versão corrigida para 0.3.1.
