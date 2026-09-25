# Relatório de testes — Maze Hunter: Core Shift v0.7.1

## Verificações
- Sintaxe de `js/main.js`: aprovada.
- Save corrompido: recuperação protegida por `try/catch` com backup.
- Build: bônus de cristais, EMP e passivos usam apenas módulos equipados.
- Primeira conclusão: recompensa cheia; replay: recompensa base reduzida.
- Player: espelhamento horizontal, frames de morte temporizados e invulnerabilidade de respawn.
- EMP: HUD e ícone respeitam módulo equipado.
- Escudo: colisão registra eliminação, score, combo e drop.
- Phase: janela periódica de atravessar paredes implementada.
- Fase 2: Rail Sentinel Prime implementado como boss final.
- Bosses: projéteis/hazards distintos por tipo.
- Mobile: joystick virtual, safe-area e aviso de orientação em retrato.
- Áudio: volume geral, música e efeitos separados.
- Progressão: recordes de score, tempo e rank por fase.
- Código legado de conclusão automática por `finishAt`: removido.

## Resultado
Todos os testes estruturais e de regressão acima passaram no código publicado na branch main.
