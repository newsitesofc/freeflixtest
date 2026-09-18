# Como adicionar séries no FreeFlix

Tudo é cadastrado no arquivo `assets/js/series.json`.

## Capas das séries

Coloque todas as capas em:

`assets/img/capas-series/`

Use imagens no formato `.jpg`. No JSON, escreva somente o nome do arquivo:

```json
"capa": "Nome_da_Serie.jpg"
```

## Adicionar uma série

Não coloque `id` na série. O site cria a identificação automaticamente usando o título.
Por isso, cada série deve ter um título diferente.

Copie este modelo dentro dos colchetes do `series.json`:

```json
{
  "titulo": "Nome da Série",
  "capa": "Nome_da_Serie.jpg",
  "ano": "2026",
  "generos": ["Ação", "Aventura"],
  "sinopse": "Escreva aqui a sinopse da série.",
  "provider": "rede-canais",
  "server": "RCFServer1",
  "subfolder": "ondemand",
  "temporadas": [
    {
      "numero": 1,
      "episodios": [
        {
          "numero": 1,
          "titulo": "Episódio 1",
          "duracao": "45 min",
          "id": "CODIGO_DO_VIDEO"
        }
      ]
    }
  ]
}
```

O único `id` necessário é o código do vídeo de cada episódio.

## Adicionar outro episódio

Coloque uma vírgula depois do episódio anterior e cole:

```json
{
  "numero": 2,
  "titulo": "Episódio 2",
  "duracao": "45 min",
  "id": "CODIGO_DO_VIDEO"
}
```

O episódio usa automaticamente o `server` cadastrado na série. Se apenas um episódio estiver em outro servidor, adicione nele:

```json
"server": "RCFServer2"
```

## Adicionar outra temporada

Depois do fechamento da temporada anterior, coloque uma vírgula e cole:

```json
{
  "numero": 2,
  "episodios": [
    {
      "numero": 1,
      "titulo": "Episódio 1",
      "duracao": "45 min",
      "id": "CODIGO_DO_VIDEO"
    }
  ]
}
```

## Adicionar outra série

Depois do fechamento da série anterior, coloque uma vírgula e cole novamente o modelo completo de série.

Mantenha as vírgulas, chaves e colchetes. Depois de salvar e publicar no GitHub Pages, as alterações aparecem automaticamente em `series.html`.
