# Como ativar Analytics, Meta Pixel e Google Tag Manager

O site já está preparado. Enquanto os códigos estiverem vazios em `tracking-config.js`, nenhum rastreamento será carregado e o banner de cookies ficará oculto.

## Opção 1 — instalação direta (mais simples)

Use esta opção quando você tiver o código `G-...` do Google Analytics 4 e/ou o número do Meta Pixel.

1. Abra o arquivo `tracking-config.js`.
2. Mantenha `strategy: "direct"`.
3. Cole o código do Google Analytics entre as aspas de `googleAnalyticsId`.
4. Cole somente os números do Meta Pixel entre as aspas de `metaPixelId`.
5. Deixe `googleTagManagerId` vazio.
6. Salve o arquivo e publique a atualização.

Exemplo:

```javascript
window.URESULT_TRACKING_CONFIG = Object.freeze({
    strategy: "direct",
    googleTagManagerId: "",
    googleAnalyticsId: "G-ABC1234567",
    metaPixelId: "123456789012345",
    consentVersion: "1.0"
});
```

Depois da publicação, o banner aparecerá automaticamente. O GA4 só será carregado após autorização para Analytics, e o Meta Pixel somente após autorização para Marketing.

## Opção 2 — Google Tag Manager (recomendada para gestão avançada)

Use esta opção quando você tiver um contêiner `GTM-...` e quiser administrar as ferramentas dentro do Tag Manager.

1. Abra o arquivo `tracking-config.js`.
2. Altere para `strategy: "gtm"`.
3. Cole o código do contêiner em `googleTagManagerId`.
4. Deixe `googleAnalyticsId` e `metaPixelId` vazios para evitar duplicidade.
5. No painel do Google Tag Manager, crie as tags do GA4 e do Meta Pixel.
6. Configure as tags para respeitarem o consentimento:
   - GA4: `analytics_storage`.
   - Meta e publicidade: `ad_storage`, `ad_user_data` e `ad_personalization`.
7. Publique primeiro o contêiner e depois o site.

Exemplo:

```javascript
window.URESULT_TRACKING_CONFIG = Object.freeze({
    strategy: "gtm",
    googleTagManagerId: "GTM-ABC1234",
    googleAnalyticsId: "",
    metaPixelId: "",
    consentVersion: "1.0"
});
```

## Conversão já preparada

Todos os links que abrem o WhatsApp já geram o evento `whatsapp_click` depois que o visitante autoriza a categoria correspondente.

- Na instalação direta, o evento é enviado ao GA4 e/ou ao Meta Pixel conforme o consentimento.
- No GTM, o evento entra no `dataLayer` e pode ser usado como acionador de conversão.

## Como testar depois de inserir os códigos

1. Abra o site em uma janela anônima.
2. Confirme se o banner aparece.
3. Clique em **Recusar** e verifique que as ferramentas não são carregadas.
4. Limpe os dados do site ou abra outra janela anônima.
5. Clique em **Aceitar todos**.
6. Valide o GA4 no relatório **Tempo real**.
7. Valide o Meta Pixel no **Gerenciador de Eventos > Testar eventos**.
8. Clique em um botão do WhatsApp e confirme o evento `whatsapp_click`.

## Quando alterar a versão do consentimento

Se houver uma mudança importante nas categorias ou finalidades, altere `consentVersion` de `"1.0"` para `"2.0"`. Isso fará o site solicitar uma nova escolha aos visitantes.
