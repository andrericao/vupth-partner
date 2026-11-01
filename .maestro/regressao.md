# Teste de regressão (Partner)

A bateria completa (`bateria_completa.yaml`) é o teste de regressão; o teste de fumaça (`etapas/00b_fumaca.yaml`, a escrever depois da aprovação do desenho) roda primeiro e, se falha, nada mais roda.

**Regra (André, 01/11):** todo bug achado entra aqui. O caminho que quebrou vira um passo no fluxo que o cobre (ou uma etapa nova) **no mesmo commit da correção**, e a linha abaixo diz qual.

| Bug (apelido) | Caminho que quebrou | Etapa/passo que o guarda | Commit |
|---|---|---|---|
| partner-cai-de-novo / partner-fecha-ao-abrir | App fechava ao abrir (async-storage ausente no build) | Jest: `modulosNativosSobDemanda`, `armazenamentoOpcional`; fumaça: abrir o app | f90d981 |
| build-falha-configure-expo-updates | Fingerprint do build ≠ do CI | Jest: `runtimeVersionPorFingerprint`, `appConfigVariante` | e9b1a80 |
