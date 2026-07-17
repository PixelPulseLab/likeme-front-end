# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.3.2] - 2026-05-19

### Adicionado
- CachedImage (expo-image) com cache em disco e prefetch nas listas
- Feed da comunidade virtualizado com skeleton no carregamento inicial
- Cache do feed ao voltar à tela de comunidade (até ~5 min)
- Cache global de perfis públicos para avatares e nomes em posts/comentários
- Lista virtualizada no marketplace, chat e carrinho

### Alterado
- Startup mais rápido com refresh de token em paralelo à política de release e i18n
- Marketplace e comunidade preservam scroll e dados ao retornar à tela
- Detalhes de produto exibem dados da navegação enquanto o fetch completa
- Transições de navegação mais leves (fade) e app aguarda fontes antes de montar

### Corrigido
- Padding horizontal duplicado na lista do marketplace
- Tela de produto sem loading full-screen quando há dados de fallback na rota

## [1.4.0] - 2026-05-19

### Adicionado
- Cupom de desconto no checkout: aplicar código, ver desconto no resumo e remover antes de pagar
- Label "Recomendado por" e parceiro em detalhes de produto e produto afiliado
- Tela de aquisições no perfil
- Assinatura mensal de protocolos no checkout
- Acesso a protocolos contratados após a compra

### Alterado
- Comunidade e marketplace mais fluidos ao navegar entre telas, com menos recarregamento
- Feed e loja da comunidade com carregamento mais rápido
- Tela de atualização obrigatória do app com visual renovado
- Remoção do preview antigo da comunidade no perfil

### Corrigido
- Comentários e respostas: autor, data relativa, expandir respostas e layout do nome
- Campo de resposta fixo ao comentar em posts, acima da barra inferior
- Loja da comunidade e perfil do profissional alinhados ao anunciante
- Card recomendado na Home abre a comunidade na hora
- Cupom de desconto visível nas etapas de endereço e pagamento do checkout

## [1.4.1] - 2026-05-21

### Alterado
- Remoção do ambiente staging (sync de branch, perfis EAS e documentação obsoleta)

### Corrigido
- Pipeline iOS no CI: assinatura manual com perfil App Store para build e archive em produção

## [1.4.2] - 2026-05-26

### Alterado
- Suporte a .env.production via dotenv-cli nos scripts e config do backend

## [1.4.3] - 2026-05-26

### Corrigido
- Correção do pipeline iOS: extração do xcarchive e export para App Store

## [1.5.0] - 2026-05-26

### Adicionado
- Nova tela de detalhe de protocolo com hero, sessões e próxima live
- Lista de protocolos e serviços com novo layout de cards
- Seção de protocolos na Home com empty state para quem não tem subscription
- Menu de perfil agora abre Meus Protocolos e Serviços

### Alterado
- AcquisitionList substituída por SubscriptionList com design atualizado

## [1.6.0] - 2026-06-01

### Alterado
- Abertura da release 1.6

## [1.6.1] - 2026-06-15

### Adicionado
- Posts com anexos multimídia no feed da comunidade
- Botão Baixar Material em anexos de posts e protocolos
- Atualizações OTA via Revopush

### Alterado
- Tipografia e tokens visuais alinhados ao Figma
- Traduções do app priorizam o bundle remoto do backend
- Layout do parceiro recomendado em produto e afiliado Amazon

### Corrigido
- Enquetes encerradas não permitem mais votar ou interagir
- Vídeo exibido corretamente em posts com várias imagens
- Botões secundários com visual consistente no Android
- Botão Comprar na Amazon centralizado na tela de afiliado
- Documentos do profissional no perfil exibem apenas o valor cadastrado

## [1.7.0] - 2026-06-18

### Adicionado
- Post em destaque (fixado) no topo da aba Posts da comunidade (APP-246)
- Título da seção de post em destaque na comunidade (APP-246)
- Contatos do provider na página de serviço do marketplace (APP-278)
- Navegação ao tocar notificação push de atividade criada (APP-287)
- Push de confirmação ao reagendar atividade (APP-287)
- Busca e filtros da home integrados na listagem do marketplace (APP-282, APP-296)
- Curadoria por categoria na PLP do marketplace (APP-255, APP-296)

### Alterado
- Loja da comunidade alinhada ao layout Figma (APP-206)
- Tipografia padronizada na PLP do marketplace (APP-296)
- Protocolos limitados a 1 unidade no carrinho (APP-279)
- Espaçamento do post em destaque na comunidade (APP-246)
- Data e hora da push de atividade no fuso de São Paulo (APP-287)

### Corrigido
- Scroll infinito do feed da comunidade (load more e paginação)
- Posts de protocolo fora de comunidades abertas (APP-317)
- Checkout bloqueado para protocolo já ativo (APP-279)
- Tags de modalidade Presencial no marketplace (APP-265)
- Filtro selecionado destacado com borda azul na PLP (APP-296)
- Espaçamento do hero no perfil do provider (APP-266)
- Botões secundários consistentes no Android (APP-294)
- Label Recomendado por na PDP do marketplace (APP-283)

## [1.7.1] - 2026-06-19

### Alterado
- Título completo nos cards de destaque e serviços do marketplace
- Contatos do provider ocultos na PDP de serviço

## [1.8.0] - 2026-06-25

### Adicionado
- Redesign da tela inicial de Perfil com gestão da conta e interesses (APP-231)
- Atualização da foto de perfil via Bottom Sheet: galeria, câmera ou exclusão (APP-232)
- Edição de dados pessoais no Perfil (APP-233)
- Gerenciamento de categorias de interesse no Perfil (APP-234)
- Consulta da política de privacidade de dados no Perfil (APP-235)
- Selo Destaque e destaque da semana no marketplace conforme curadoria (APP-330)

### Alterado
- Resultados do marketplace com mix equilibrado por provider na listagem e busca (APP-330)

### Corrigido
- Onboarding não reexibido após logout e novo login (APP-334)

## [1.8.1] - 2026-06-25

### Corrigido
- Teclado abre no primeiro toque no campo de comentário do post
- Lista não intercepta toques na área do footer fixo (comentários e chat)

## [1.8.2] - 2026-06-26

### Corrigido
- Empty state em protocolos sem expor erros de API ao usuário

## [1.9.0] - 2026-07-03

### Adicionado
- Compartilhamento social de posts, produtos, protocolos, comunidades e providers (APP-332)
- Deep linking e deferred deep link para abrir conteúdo compartilhado no app (APP-332)
- Tela de conteúdo exclusivo ao acessar link sem permissão (APP-332)

### Alterado
- Botões de compartilhar reposicionados conforme Figma na PDP, comunidade, protocolo e provider (APP-332)

### Corrigido
- Link duplicado ao compartilhar no iOS e Android (APP-332)

## [1.9.1] - 2026-07-03

### Corrigido
- Deep link de conteúdo compartilhado redireciona para login quando o usuário não está autenticado (APP-332)

## [1.9.2] - 2026-07-07

### Alterado
- Ícones de contato alinhados na PDP de serviço (APP-278)

### Corrigido
- Menu inferior e voltar após abrir link compartilhado
- Card de evento da comunidade com textos do Figma e data no rodapé (APP-344)
- Menu inferior ao abrir post compartilhado (APP-349)
- Navegação pelo menu após deep link na PDP e demais telas compartilhadas (APP-350)

## [1.9.3] - 2026-07-07

### Alterado
- Lista de atividades recarrega mais rápido ao voltar de outras telas

### Corrigido
- Atividades aparecem logo após criar lembrete de evento da comunidade (APP-344)
- Banner de evento sem subtítulo duplicado abaixo do título

## [1.10.0] - 2026-07-17

### Adicionado
- Gestão e cancelamento de protocolo pelo app (APP-318)
- Exclusão de conta com motivo e fluxo alinhado ao Figma (APP-358)
- Mensagem personalizada antes de compartilhar o link (APP-362)
- Atividades com abas ativo/histórico, edição e link no card

### Alterado
- Menu do perfil reorganizado com Configurações e segurança (APP-356)
- Etapas vencidas do protocolo marcadas automaticamente (APP-363)
- Telas de protocolo alinhadas ao Figma

### Corrigido
- Assinatura distingue status em cancelamento de cancelado
- Links compartilháveis usam app.likeme.global
- Troca de aba em atividades sem piscar e título no card de evento
