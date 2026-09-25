# Relatório de testes — Maze Hunter: Core Shift v0.7.0

## Testes executados
- `node --check js/main.js`: aprovado.
- 145 assets dinâmicos de player, inimigos, bosses e EMP: todos encontrados.
- Referências explícitas de assets em HTML/JS: nenhuma ausente.
- Validação de coordenadas das fases 1–4: aprovada.
- Smoke test de renderização das 4 fases e estados idle/attack/hurt/death dos bosses: aprovado.
- Build ativa: velocidade e escudo só afetam a partida quando equipados.
- Dash: um disparo por pressionamento; segurar o botão não repete após a recarga.
- EMP: um disparo por pressionamento e recarga do módulo `pulsecd` somente quando equipado.
- Boss: animação de morte é mantida por 900 ms e a fase não termina automaticamente.
- Saída: após derrotar o boss, a fase só conclui ao alcançar a saída.
- Player: Game Over é adiado até terminar a animação de morte.

## Resultado
Todos os testes automatizados acima passaram na versão entregue.
