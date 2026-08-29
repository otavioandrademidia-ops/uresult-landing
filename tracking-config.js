/*
 * CONFIGURAÇÃO DE RASTREAMENTO DA URESULT
 *
 * Enquanto os campos abaixo estiverem vazios, nenhum rastreamento será
 * carregado e o banner de cookies permanecerá oculto.
 *
 * Estratégias disponíveis:
 * - "direct": use os códigos do GA4 e do Meta Pixel diretamente no site.
 * - "gtm": use somente o contêiner do Google Tag Manager e configure as
 *   demais ferramentas dentro dele.
 */
window.URESULT_TRACKING_CONFIG = Object.freeze({
    strategy: "direct",
    googleTagManagerId: "",
    googleAnalyticsId: "",
    metaPixelId: "",
    consentVersion: "1.0"
});
