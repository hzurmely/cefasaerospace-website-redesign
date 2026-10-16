# CEFAST Aerospace · redesign do site

Proposta de redesign do site da CEFAST Aerospace, centrada no FCP-01, o CubeSat 2U que a equipe leva ao CubeDesign 2026 em Buenos Aires.

Publicado em **zurmely.net/redesign** (projeto Cloudflare Pages ligado a este repositório, repassado pelo arquivo `functions/redesign/[[path]].js` do repositório zurmely.net).

## O que tem aqui

Site estático, sem etapa de build. Abra `index.html` com qualquer servidor local.

## Versões

Toda vez que alguém entra ou recarrega a página, aparece a tela de escolha de versão. Cada versão fica na própria pasta e ganha uma tag no git.

| Versão | Pasta | Tag | Foco |
|---|---|---|---|
| 1.0 | `v1/` | `v1.0` | O satélite: o FCP-01 abre peça por peça enquanto a página rola |
| 2.0 | `v2/` | `v2.0` | A equipe: frentes, método, resultados, o FCP-01, processo seletivo e patrocínio |

Para criar a próxima versão: copie a pasta da última (por exemplo `v2/` para `v3/`), troque `data-atual` e o título no `index.html` dela, acrescente a versão na lista `VERSOES` de `versao.js`, faça o commit e crie a tag (`git tag v3.0`). Para abrir uma versão sem a tela de escolha, use `?direto` no endereço.

## Arquivos

* `index.html` · tela de escolha de versão
* `versao.js` e `versao.css` · a tela de escolha, usada pela raiz e por todas as versões
* `vN/index.html`, `vN/css/site.css`, `vN/js/app.js`, `vN/js/satellite.js` · cada versão completa
* `assets/`, `vendor/`, `fonts/` · compartilhados entre as versões
* `assets/fcp01.glb` · modelo 3D, extraído da montagem do SolidWorks `estrutura satélite (montada).SLDASM`
* `assets/render-*.webp` · imagens geradas do mesmo modelo
* `vendor/` · Three.js 0.169 e os módulos usados
* `fonts/` · Montserrat variável (OFL)

## Sobre o modelo 3D

A malha de cada peça foi lida das tesselações gravadas dentro do arquivo .SLDASM. Estrutura, espaçadores, parafusos e roda de reação estão na posição do CAD. A posição das placas e dos componentes sobre elas foi reconstruída a partir da prévia da montagem e da altura dos espaçadores, então pode diferir do CAD. Para trocar pelo modelo exato, exporte a montagem como glTF ou STEP e substitua `assets/fcp01.glb` mantendo os nomes dos grupos (`estrutura_no`, `estrutura_ls`, `tampa_sup`, `tampa_inf`, `fixacao`, `adcs`, `eps_reg`, `obc`, `eps_ger`, `payload`).

## Antes de publicar como site oficial

* Confirmar o modelo do Raspberry Pi (o CAD usa Zero W).
* Confirmar a divisão de responsabilidades entre as frentes na seção Equipe.
* Trocar as imagens geradas por fotos da equipe quando houver.
