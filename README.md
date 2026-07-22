# LikeMe Front-End

Um aplicativo React Native completo para saúde e bem-estar, com funcionalidades de onboarding, cadastro, anamnese, wellness, atividades, protocolos, marketplace, comunidade e provedores de saúde.

## 🚀 Funcionalidades

- **Onboarding**: Introdução ao app com slides interativos
- **Cadastro**: Sistema de registro de usuários
- **Anamnese**: Questionário de saúde personalizado
- **Atividades**: Gerenciamento de atividades de saúde
- **Marketplace**: Loja de produtos de saúde
- **Comunidade**: Rede social para compartilhamento

## 📱 Telas Implementadas

### Telas de Onboarding

- OnboardingScreen: Introdução ao app
- RegisterScreen: Cadastro de usuários
- AnamneseScreen: Questionário de saúde

### Telas Principais

- ActivitiesScreen: Gerenciamento de atividades
- MarketplaceScreen: Loja de produtos
- CommunityScreen: Rede social

## 🛠 Tecnologias Utilizadas

- **Expo SDK 54**
- **React Native 0.81.5**
- **React Navigation 6.x**
- **React Native Paper** (UI Components)
- **React Native Vector Icons**
- **Expo Linear Gradient**
- **TypeScript**
- **Gradle / Xcode** (builds nativos locais e CI)
- **Auth0** (Autenticação)

## 📦 Instalação

1. Clone o repositório:

```bash
git clone <repository-url>
cd likeme-front-end
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o ambiente local — copie `env.example` para `.env` e preencha as variáveis `EXPO_PUBLIC_*` (Auth0, backend, etc.).

## 🏃 Desenvolvimento local

O fluxo padrão para rodar o app no emulador ou dispositivo:

1. **Primeira vez ou após mudança nativa** — build do dev client:
   - **iOS:** `npm run run:emulator:ios` (ou `npm run ios:xcode:build:debug` + instalar no Simulator)
   - **Android:** `npm run android` ou `npm run build:android:local`

2. Inicie o Metro com cache limpo:

```bash
npm run start:clear
```

3. Quando o menu do Expo aparecer no terminal, escolha a plataforma:
   - **`a`** — Android (emulador ou dispositivo conectado)
   - **`i`** — iOS (simulador; requer macOS + Xcode)

O projeto usa **Expo dev client** e módulos nativos — **Expo Go** não cobre tudo. Na primeira vez ou após mudanças nativas, pode ser necessário buildar o cliente de desenvolvimento (`npm run android` ou abrir o app já instalado no simulador/dispositivo).

### Emuladores

- **iOS:** `npm run start:ios` abre o Simulator e sobe o Metro
- **Android:** `npm run run:emulator:android` sobe um AVD (se configurado)

### Outros scripts úteis

| Comando | Uso |
|---------|-----|
| `npm run run:emulator:ios` | Build Debug + instala e abre no Simulator iOS |
| `npm run build:android:local` | Build local Android (APK/AAB) |
| `npm start` | Metro com dev client (rede local) |
| `npm run start:ios` | Simulator iOS + Metro |
| `npm run android` | Build e instalação nativa Android |
| `npm run doctor` | Diagnóstico do ambiente Expo |
| `npm test` | Testes unitários |

Lista completa em `package.json`.

## 📱 Executando no dispositivo

Com o Metro rodando (`npm run start:clear`), use **`a`** ou **`i`** no terminal do Expo para abrir no Android ou iOS. Para dispositivo físico Android, ative USB debugging; para iPhone, use simulador ou build de desenvolvimento instalado no aparelho.

## 🏗 Estrutura do Projeto

```
likeme-front-end/
├── src/
│   ├── components/           # Componentes reutilizáveis
│   │   ├── ui/              # Componentes básicos (Button, Card)
│   │   ├── forms/           # Componentes de formulário
│   │   └── layout/          # Componentes de layout
│   ├── screens/             # Telas organizadas por domínio
│   │   ├── auth/           # Autenticação e onboarding
│   │   │   ├── OnboardingScreen/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── styles.ts
│   │   │   │   └── OnboardingScreen.spec.tsx
│   │   │   ├── RegisterScreen/
│   │   │   └── AnamneseScreen/
│   │   ├── wellness/       # Bem-estar e saúde
│   │   │   └── ActivitiesScreen/
│   │   ├── marketplace/    # Loja e produtos
│   │   └── community/      # Comunidade e social
│   ├── navigation/         # Configuração de navegação
│   ├── onboarding/        # Componentes específicos do onboarding
│   ├── constants/         # Constantes do app
│   ├── types/             # Tipos TypeScript
│   ├── utils/             # Funções utilitárias
│   └── hooks/             # Custom hooks
├── App.tsx                # Componente principal
├── app.config.js         # Configuração do Expo (única fonte; variáveis EXPO_PUBLIC_*)
└── package.json          # Dependências
```

## 🎨 Design System

O app utiliza um design system consistente com:

- **Cores primárias**: Verde (#4CAF50) para saúde e bem-estar
- **Tipografia**: Sistema de fontes hierárquico
- **Componentes**: Cards, botões, chips e ícones padronizados
- **Navegação**: Tab navigation com ícones intuitivos

## 📱 Navegação

O app utiliza React Navigation com:

- **Stack Navigator**: Para fluxo de onboarding
- **Tab Navigator**: Para navegação principal
- **Navegação hierárquica**: Onboarding → Cadastro → Anamnese → App Principal

## 🔧 Configuração

### Dependências Principais

- `expo`: SDK do Expo
- `@react-navigation/native`: Navegação
- `@react-navigation/stack`: Stack navigator
- `@react-navigation/bottom-tabs`: Tab navigator
- `react-native-paper`: Componentes UI
- `react-native-vector-icons`: Ícones
- `expo-linear-gradient`: Gradientes
- `expo-constants`: Constantes do Expo
- `expo-file-system`: Sistema de arquivos

### Scripts

Os scripts npm estão definidos em **`package.json`** na raiz do repositório.

### Configurações

- **Expo**: Configuração em `app.config.js` (SDK 54 no `package.json`)
- **Metro**: Configurado para Expo
- **Babel**: Preset para Expo
- **TypeScript**: Configuração para Expo

## 🛠 Desenvolvimento

- **Início do dia:** `npm run start:clear` → `a` (Android) ou `i` (iOS)
- **Cache estranho:** `start:clear` já limpa Metro e `.expo`; em casos extremos, `npm run clean`
- **iOS (Simulator + Metro):** `npm run start:ios`
- Documentação Expo: [Expo CLI](https://docs.expo.dev/workflow/expo-cli/)

## 🧪 Testes

O projeto inclui testes unitários e de integração para garantir a qualidade e funcionalidade do código.

### Estrutura dos Testes

```
src/
├── screens/
│   └── auth/
│       └── UnauthenticatedScreen/
│           ├── index.tsx
│           └── index.spec.tsx          # Testes da tela
├── components/
│   └── ui/
│       ├── Button.tsx
│       └── Button.spec.tsx             # Testes do componente
└── __tests__/                          # Testes globais
    ├── setup.ts                        # Configuração dos testes
    └── utils.test.ts                   # Testes de utilitários
```

### Tipos de Testes Implementados

#### 1. Testes de Componentes

- **Renderização**: Verifica se componentes renderizam corretamente
- **Interações**: Testa cliques, navegação e eventos
- **Props**: Valida comportamento com diferentes props

#### 2. Testes de Navegação

- **Navegação entre telas**: Verifica se a navegação funciona
- **Parâmetros de rota**: Testa passagem de dados entre telas
- **Stack Navigator**: Valida configuração do navegador

#### 3. Testes de Funcionalidades

- **Formulários**: Validação de inputs e submissão
- **Estado**: Gerenciamento de estado dos componentes
- **Hooks**: Testa custom hooks e hooks do React

### Exemplo de Teste

```typescript
// UnauthenticatedScreen/index.spec.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import UnauthenticatedScreen from './index';

// Mock da navegação
const mockNavigation = {
  navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

describe('UnauthenticatedScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<UnauthenticatedScreen />);

    expect(getByText('LIKE YOUR LIFE')).toBeTruthy();
    expect(getByText('Next')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('handles next button press', () => {
    const { getByText } = render(<UnauthenticatedScreen />);

    const nextButton = getByText('Next');
    fireEvent.press(nextButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Welcome');
  });
});
```

### Configuração dos Testes

O projeto usa:

- **Jest**: Framework de testes
- **React Native Testing Library**: Utilitários para testar componentes React Native
- **React Test Renderer**: Renderização de componentes para testes

### Mocks e Stubs

```typescript
// Mock de navegação
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock de assets SVG
jest.mock('@/assets', () => ({
  Logo: 'Logo',
}));

// Mock de componentes externos
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));
```

### Boas Práticas

1. **Nomenclatura**: Use nomes descritivos para os testes
2. **Arrange-Act-Assert**: Estruture os testes em 3 fases
3. **Mocks**: Use mocks para dependências externas
4. **Isolamento**: Cada teste deve ser independente
5. **Cobertura**: Mantenha alta cobertura de código

## 🚀 Próximos Passos

1. **Integração com Backend**: APIs para dados reais
2. **Autenticação**: Sistema de login seguro com Expo Auth
3. **Notificações**: Push notifications com Expo Notifications
4. **Offline**: Funcionalidades offline com Expo SQLite
5. **Testes**: Testes unitários e de integração
6. **Deploy**: Builds locais (Gradle/Xcode) e CI no GitHub Actions

## 🔧 Troubleshooting

### Problemas comuns

- **Cache / Metro / dependências:** `npm run start:clear`; se persistir, `npm run clean` e reinstalar `node_modules`
- **Testes (SVG, navegação)**: usar mocks como nos exemplos em TypeScript mais abaixo nesta página.
- **Build**: validar ambiente com `npm run doctor`, Gradle/Xcode e o workflow `.github/workflows/build.yml`.

### Requisitos do sistema

- **Node.js**: conforme `engines` em `package.json` (atualmente `>=20.19.4`)
- **npm**: compatível com o Node acima
- **iOS**: Xcode recente e CocoaPods para a pasta `ios/`
- **Android**: Android Studio / SDK e Java 17+ para a pasta `android/`

## 🔢 Versão (SemVer)

A versão do app fica em [`app.version.json`](./app.version.json) e segue **SemVer** (Semantic Versioning): convenção de numeração no formato `MAJOR.MINOR.PATCH` (ex.: `1.10.0`).

Cada número sobe com um significado:

- **MAJOR** — mudança que quebra compatibilidade (API/contrato/uso anterior deixa de funcionar como antes).
- **MINOR** — funcionalidade nova, sem quebrar o que já existia.
- **PATCH** — correção de bug, sem mudar o contrato.

### Quando bumpa o quê

| De → Para | Motivo |
|-----------|--------|
| `1.9.0` → `1.9.1` | bug fix |
| `1.9.0` → `1.10.0` | feature |
| `1.x` → `2.0.0` | breaking no app (como um layout v2) |

Após editar `app.version.json`, rode `npm run version:sync` (ou `npm run version:check` para validar).

## 📚 Documentação

- [README.md](./README.md) — visão geral
- [src/ARCHITECTURE.md](./src/ARCHITECTURE.md) — arquitetura do app
- [src/screens/TEMPLATE.md](./src/screens/TEMPLATE.md) — template de telas
- [src/i18n/README.md](./src/i18n/README.md) — traduções (API + cache)
- [BUILD_TESTFLIGHT.md](./BUILD_TESTFLIGHT.md) — build iOS local / TestFlight
- [.github/workflows/README.md](./.github/workflows/README.md) — CI (Gradle + Xcode)
- [maestro/README.md](./maestro/README.md) — testes E2E
- [app.version.json](./app.version.json) — versão SemVer, builds nativos e changelog da release

## 📄 Licença

Este projeto está sob a licença MIT.
