# Subfluxos do Partner para a bateria conjunta (bateria-conjunta, Andre 03/10)

O fluxo conjunto e do Client (repo `vupth`): ele alterna entre os dois apps no
mesmo roteiro e chama estes subfluxos para o lado do profissional, com
`runFlow: { file: <caminho>/vupth-partner/.maestro/conjunta/<arquivo>, env: {...} }`.

Todos rodam no app do Partner (`APP_ID`, padrao `com.vupth.partner.preview`)
e partem do app ja aberto. Use `prof_entrar.yaml` antes, quando o Partner
estiver na tela de entrada. Cada passo tem rotulo `PJ<n>.<mm>` (P de Partner).

| Arquivo | env | O que faz | Item do teste manual |
|---|---|---|---|
| `prof_entrar.yaml` | `EMAIL`, `SENHA` | entra e espera a aba Fila | — |
| `prof_marcar_atraso.yaml` | `CLIENTE` | Opcoes de CLIENTE → Nao chegou → confirma; espera "Atrasado" | contagem-de-atrasos, aviso-de-atraso |
| `prof_so_agenda.yaml` | `MODO` (`AGENDA_ONLY` ou `QUEUE`) | Opcoes da fila → Funcionamento (`modo-<MODO>`) | so-agenda |
| `prof_tempo_do_servico.yaml` | `MINUTOS` | Meus servicos → Editar o 1o → tempo novo; espera "…<MINUTOS>min…" | tempo-do-servico |
| `prof_refeicao.yaml` | `NOME`, `INICIO` (digitos, ex. `1200`), `DURACAO` | Refeicoes → Adicionar, todos os dias | horario-na-refeicao |
| `prof_finalizar.yaml` | `CLIENTE` | Iniciar proximo → Finalizar; espera o CLIENTE sair da fila | avaliar-so-sem-nota |
| `prof_abrir_loja.yaml` | `DONO`, `LOJA_NOVA`, `ESCOLHA` (`nova` ou `atual`) | Perfil → Abrir meu estabelecimento → cria → Onde voce vai atender? | abrir-meu-estabelecimento |
| `prof_sair.yaml` | — | sai da conta (volta a entrada) | — |

Fica de fora, por ora: **foto-do-profissional** (gravar a foto passa pelo
seletor de fotos do Android, que muda de aparelho para aparelho). O que esta
fora e por que fica na aba do Partner no vupth-docs.

O que depende de relogio (o 3o atraso, a refeicao "agora") adianta-se pela API
no fluxo do Client, como ele ja faz nos scripts dele.
