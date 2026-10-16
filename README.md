# CEFAST Aerospace · redesign do site

Proposta de redesign do site da CEFAST Aerospace, centrada no FCP-01, o CubeSat 2U que a equipe leva ao CubeDesign 2026 em Buenos Aires.

Publicado em **zurmely.net/redesign** (projeto Cloudflare Pages ligado a este repositório, repassado pelo arquivo `functions/redesign/[[path]].js` do repositório zurmely.net).

## O que tem aqui

Site estático, sem etapa de build. Abra `index.html` com qualquer servidor local.

* `index.html` · página única
* `css/site.css` · estilos, com as cores e a fonte Montserrat da marca
* `js/app.js` · fundo estrelado, rolagem por capítulos, entradas e contagem até o CubeDesign
* `js/satellite.js` · cena 3D do FCP-01 (Three.js)
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
