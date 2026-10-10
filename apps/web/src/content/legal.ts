import { APP_NAME } from '@mycoach/brand'
import type { Locale } from '@mycoach/i18n'

// DRAFT legal content. Must be reviewed by a qualified lawyer (LGPD / Brazilian consumer law)
// before public launch. Placeholders in [brackets] need real values.

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDocument {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const UPDATED = '2026-10-10'

const privacy: Record<Locale, LegalDocument> = {
  'pt-BR': {
    title: 'Política de Privacidade',
    updated: UPDATED,
    intro: `Esta política explica quais dados pessoais o ${APP_NAME} coleta, por que, com quem compartilha e como você controla seus dados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, “LGPD”).`,
    sections: [
      {
        heading: '1. Quem é o controlador',
        paragraphs: [
          'O controlador dos seus dados é [razão social], CNPJ [número], com sede em [endereço]. Encarregado de proteção de dados (DPO): [nome], e-mail [privacidade@dominio].',
        ],
      },
      {
        heading: '2. Dados que coletamos',
        paragraphs: [
          'Conta: e-mail e senha (armazenada de forma criptografada pelo nosso provedor de autenticação).',
          'Perfil: nome de usuário, nome de exibição, foto de perfil (opcional), objetivo, unidades de medida, idioma e fuso horário. A foto de perfil fica em armazenamento acessível por link, com endereço aleatório.',
          'Atividade: os dias em que você abre o app, usados para calcular sua sequência de dias seguidos.',
          'Dados de saúde e do corpo (dados pessoais sensíveis): sexo, idade, altura, peso e nível de atividade informados no teste de energia; respostas do questionário de treino, incluindo lesões ou limitações; respostas do questionário de dieta, incluindo alergias e intolerâncias alimentares; e, se você escolher enviar, fotos de progresso do seu corpo e a análise gerada a partir delas (estimativa de gordura corporal, biotipo e áreas prioritárias).',
          'Conteúdo que você cria: mensagens trocadas com o coach e planos de treino e de dieta gerados para você.',
          'Dados técnicos: registros de acesso e de uso necessários para segurança e funcionamento (por exemplo, endereço IP, data e hora das requisições).',
        ],
      },
      {
        heading: '3. Fotos do corpo',
        paragraphs: [
          'O envio de fotos é opcional. Só armazenamos e analisamos fotos depois do seu consentimento específico e destacado, dado dentro do app, e apenas para pessoas com 18 anos ou mais.',
          'As fotos ficam em armazenamento privado: só você pode visualizá-las no app. Elas são redimensionadas no seu dispositivo antes do envio, e os metadados (como localização GPS) são removidos.',
          'Para gerar a análise, as fotos são enviadas ao nosso provedor de inteligência artificial (veja a seção 6), que as processa apenas para nos devolver o resultado.',
          'Você pode excluir qualquer conjunto de fotos a qualquer momento. Ao retirar o consentimento, todas as suas fotos e análises são excluídas.',
        ],
      },
      {
        heading: '4. Para que usamos seus dados e com qual base legal',
        paragraphs: [
          'Prestar o serviço (conta, perfil, metas, planos de treino e dieta e coach): execução de contrato (art. 7º, V).',
          'Tratar dados de saúde e do corpo, incluindo fotos e análise por IA: seu consentimento específico (art. 11, I), que pode ser retirado a qualquer momento.',
          'Segurança, prevenção a fraudes e melhoria do funcionamento: legítimo interesse (art. 7º, IX), respeitando seus direitos.',
          'Cumprir obrigações legais, como a guarda de registros de acesso pelo prazo previsto no Marco Civil da Internet: obrigação legal (art. 7º, II).',
          'Não vendemos seus dados e não usamos suas fotos para publicidade.',
        ],
      },
      {
        heading: '5. Inteligência artificial',
        paragraphs: [
          'Planos de treino, análises corporais e respostas do coach são gerados por inteligência artificial a partir dos seus dados. São orientações gerais, não aconselhamento médico, e podem conter imprecisões.',
          'Nosso provedor de IA processa os dados apenas para gerar a resposta solicitada e, conforme seus termos comerciais, não os utiliza para treinar seus modelos.',
        ],
      },
      {
        heading: '6. Com quem compartilhamos',
        paragraphs: [
          'Supabase (banco de dados, autenticação e armazenamento de arquivos), com dados hospedados em São Paulo, Brasil.',
          'Vercel (hospedagem da aplicação), que pode processar requisições fora do Brasil.',
          'Anthropic (provedor de IA, Estados Unidos), que recebe as informações necessárias para gerar planos, análises e respostas, incluindo fotos quando você as envia.',
          'Inngest (orquestração de tarefas em segundo plano), que recebe apenas identificadores técnicos.',
          'Quando há transferência internacional, ela se baseia nas hipóteses do art. 33 da LGPD, incluindo cláusulas contratuais e o seu consentimento específico para o envio das fotos.',
        ],
      },
      {
        heading: '7. Por quanto tempo guardamos',
        paragraphs: [
          'Fotos e análises: até você excluí-las, retirar o consentimento ou excluir sua conta.',
          'Dados da conta, perfil, planos e conversas: enquanto sua conta estiver ativa.',
          'Registros de acesso: pelo prazo legal de 6 meses (Marco Civil da Internet) ou o necessário para segurança.',
        ],
      },
      {
        heading: '8. Seus direitos',
        paragraphs: [
          'Você pode, a qualquer momento: confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou desatualizados; solicitar anonimização, bloqueio ou eliminação; solicitar a portabilidade; obter informações sobre compartilhamento; e revogar o consentimento (art. 18 da LGPD).',
          'Muitas ações estão disponíveis direto no app (editar perfil, excluir fotos, retirar consentimento). Para as demais, escreva para [privacidade@dominio]. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
        ],
      },
      {
        heading: '9. Permissões do dispositivo',
        paragraphs: [
          'Câmera e galeria de fotos: usadas somente quando você escolhe tirar ou selecionar fotos de progresso. Notificações (quando disponíveis): usadas apenas para lembretes que você ativar. Você pode revogar as permissões nas configurações do seu aparelho.',
        ],
      },
      {
        heading: '10. Segurança',
        paragraphs: [
          'Usamos criptografia em trânsito, controle de acesso por usuário no banco de dados e no armazenamento, e acesso restrito às chaves de serviço. Nenhum sistema é totalmente imune a incidentes; caso ocorra algum relevante, comunicaremos você e a ANPD conforme a lei.',
        ],
      },
      {
        heading: '11. Menores de idade',
        paragraphs: [
          `O ${APP_NAME} não se destina a menores de 16 anos. A análise de fotos é exclusiva para maiores de 18 anos.`,
        ],
      },
      {
        heading: '12. Alterações',
        paragraphs: [
          'Podemos atualizar esta política. Mudanças relevantes serão avisadas no app e, quando exigido, pediremos um novo consentimento.',
        ],
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: UPDATED,
    intro: `This policy explains what personal data ${APP_NAME} collects, why, who we share it with and how you control it, in line with Brazil’s General Data Protection Law (Law 13,709/2018, “LGPD”).`,
    sections: [
      {
        heading: '1. Who is responsible',
        paragraphs: [
          'The controller of your data is [company legal name], CNPJ [number], [address]. Data protection officer: [name], email [privacy@domain].',
        ],
      },
      {
        heading: '2. Data we collect',
        paragraphs: [
          'Account: email and password (stored encrypted by our authentication provider).',
          'Profile: username, display name, profile photo (optional), goal, units, language and time zone. Profile photos are stored at random, unlisted links.',
          'Activity: the days you open the app, used to calculate your daily streak.',
          'Health and body data (sensitive personal data): sex, age, height, weight and activity level from the energy test; training questionnaire answers, including injuries or limitations; diet questionnaire answers, including food allergies and intolerances; and, if you choose to upload them, progress photos of your body and the analysis generated from them (estimated body fat, body type and priority areas).',
          'Content you create: messages with the coach and the training and diet plans generated for you.',
          'Technical data: access and usage logs needed for security and operation (for example IP address and request times).',
        ],
      },
      {
        heading: '3. Body photos',
        paragraphs: [
          'Uploading photos is optional. We only store and analyse photos after your specific, separate consent in the app, and only for people aged 18 or over.',
          'Photos are kept in private storage: only you can view them in the app. They are resized on your device before upload and their metadata (such as GPS location) is removed.',
          'To produce the analysis, photos are sent to our AI provider (see section 6), which processes them only to return the result to us.',
          'You can delete any photo set at any time. Withdrawing consent deletes all your photos and analyses.',
        ],
      },
      {
        heading: '4. Why we use your data and the legal basis',
        paragraphs: [
          'Providing the service (account, profile, targets, training and diet plans and coach): performance of a contract (art. 7, V).',
          'Processing health and body data, including photos and AI analysis: your specific consent (art. 11, I), which you can withdraw at any time.',
          'Security, fraud prevention and keeping the service working: legitimate interest (art. 7, IX), respecting your rights.',
          'Legal obligations, such as keeping access logs for the period required by Brazil’s Internet Civil Framework: legal obligation (art. 7, II).',
          'We do not sell your data and we do not use your photos for advertising.',
        ],
      },
      {
        heading: '5. Artificial intelligence',
        paragraphs: [
          'Training plans, body analyses and coach answers are generated by AI from your data. They are general guidance, not medical advice, and may contain inaccuracies.',
          'Our AI provider processes data only to generate the requested output and, under its commercial terms, does not use it to train its models.',
        ],
      },
      {
        heading: '6. Who we share data with',
        paragraphs: [
          'Supabase (database, authentication and file storage), with data hosted in São Paulo, Brazil.',
          'Vercel (application hosting), which may process requests outside Brazil.',
          'Anthropic (AI provider, United States), which receives the information needed to generate plans, analyses and answers, including photos when you upload them.',
          'Inngest (background job orchestration), which receives technical identifiers only.',
          'International transfers rely on the grounds in art. 33 of the LGPD, including contractual clauses and your specific consent for sending photos.',
        ],
      },
      {
        heading: '7. How long we keep data',
        paragraphs: [
          'Photos and analyses: until you delete them, withdraw consent or delete your account.',
          'Account, profile, plans and conversations: while your account is active.',
          'Access logs: for the legally required 6 months or as needed for security.',
        ],
      },
      {
        heading: '8. Your rights',
        paragraphs: [
          'At any time you can: confirm whether we process your data; access it; correct incomplete or outdated data; request anonymisation, blocking or deletion; request portability; learn who we share it with; and withdraw consent (LGPD art. 18).',
          'Many actions are available directly in the app (edit profile, delete photos, withdraw consent). For anything else, email [privacy@domain]. You may also complain to Brazil’s data protection authority (ANPD).',
        ],
      },
      {
        heading: '9. Device permissions',
        paragraphs: [
          'Camera and photo library: used only when you choose to take or select progress photos. Notifications (when available): used only for reminders you turn on. You can revoke permissions in your device settings.',
        ],
      },
      {
        heading: '10. Security',
        paragraphs: [
          'We use encryption in transit, per-user access control in the database and file storage, and restricted access to service keys. No system is completely immune to incidents; if a relevant one occurs, we will notify you and the ANPD as required by law.',
        ],
      },
      {
        heading: '11. Minors',
        paragraphs: [
          `${APP_NAME} is not intended for people under 16. Photo analysis is only available to people aged 18 or over.`,
        ],
      },
      {
        heading: '12. Changes',
        paragraphs: [
          'We may update this policy. We will announce material changes in the app and ask for consent again when required.',
        ],
      },
    ],
  },
}

const terms: Record<Locale, LegalDocument> = {
  'pt-BR': {
    title: 'Termos de Uso',
    updated: UPDATED,
    intro: `Ao criar uma conta ou usar o ${APP_NAME}, você concorda com estes Termos. Leia-os junto com a nossa Política de Privacidade.`,
    sections: [
      {
        heading: '1. O serviço',
        paragraphs: [
          `O ${APP_NAME} oferece planos de treino e de dieta personalizados, metas de calorias e macronutrientes, análise opcional de fotos do corpo e um coach virtual, gerados com apoio de inteligência artificial.`,
        ],
      },
      {
        heading: '2. Não é aconselhamento médico',
        paragraphs: [
          'O conteúdo do app é informativo e educativo. Não substitui avaliação de médico, nutricionista, fisioterapeuta ou profissional de educação física. Consulte um profissional antes de iniciar qualquer programa de exercícios ou mudança alimentar, especialmente se tiver condições de saúde, lesões, estiver grávida ou usar medicamentos.',
          'Pare imediatamente qualquer exercício que cause dor, tontura ou desconforto e procure ajuda profissional.',
        ],
      },
      {
        heading: '3. Elegibilidade e conta',
        paragraphs: [
          'Você deve ter pelo menos 16 anos para usar o app e 18 anos para usar a análise de fotos. Você é responsável pelas informações que fornece e por manter sua senha em sigilo.',
        ],
      },
      {
        heading: '4. Conteúdo gerado por IA',
        paragraphs: [
          'Planos, análises e respostas são gerados automaticamente e podem conter erros ou estimativas imprecisas. Use seu bom senso e adapte as recomendações à sua realidade.',
        ],
      },
      {
        heading: '5. Planos gratuitos e pagos',
        paragraphs: [
          'Alguns recursos são gratuitos e outros poderão exigir assinatura, como o uso ilimitado do coach por IA. Preços, limites e condições serão informados antes de qualquer cobrança, e você poderá cancelar conforme o Código de Defesa do Consumidor.',
        ],
      },
      {
        heading: '6. Uso aceitável',
        paragraphs: [
          'Não use o app para fins ilegais, não envie fotos de outras pessoas ou de menores de idade, não tente acessar dados de outros usuários e não sobrecarregue ou tente burlar os limites do serviço.',
        ],
      },
      {
        heading: '7. Propriedade intelectual',
        paragraphs: [
          'O app, sua marca e seu conteúdo pertencem a [razão social]. Você mantém os direitos sobre suas fotos e dados e nos concede apenas a licença necessária para prestar o serviço.',
        ],
      },
      {
        heading: '8. Responsabilidade',
        paragraphs: [
          'Na máxima extensão permitida pela lei, não nos responsabilizamos por lesões ou danos decorrentes do uso das recomendações sem a devida orientação profissional, nem por indisponibilidades temporárias do serviço.',
        ],
      },
      {
        heading: '9. Encerramento',
        paragraphs: [
          'Você pode encerrar sua conta a qualquer momento. Podemos suspender contas que violem estes Termos.',
        ],
      },
      {
        heading: '10. Lei aplicável',
        paragraphs: [
          'Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro do domicílio do consumidor. Contato: [contato@dominio].',
        ],
      },
    ],
  },
  en: {
    title: 'Terms of Use',
    updated: UPDATED,
    intro: `By creating an account or using ${APP_NAME}, you agree to these Terms. Please read them together with our Privacy Policy.`,
    sections: [
      {
        heading: '1. The service',
        paragraphs: [
          `${APP_NAME} provides personalised training and diet plans, calorie and macro targets, optional body photo analysis and a virtual coach, generated with the help of artificial intelligence.`,
        ],
      },
      {
        heading: '2. Not medical advice',
        paragraphs: [
          'Content in the app is for information and education. It does not replace assessment by a doctor, dietitian, physiotherapist or qualified trainer. Consult a professional before starting any exercise programme or diet change, especially if you have health conditions or injuries, are pregnant or take medication.',
          'Stop any exercise that causes pain, dizziness or discomfort and seek professional help.',
        ],
      },
      {
        heading: '3. Eligibility and account',
        paragraphs: [
          'You must be at least 16 to use the app and 18 to use photo analysis. You are responsible for the information you provide and for keeping your password secret.',
        ],
      },
      {
        heading: '4. AI-generated content',
        paragraphs: [
          'Plans, analyses and answers are generated automatically and may contain errors or inaccurate estimates. Use your judgement and adapt recommendations to your situation.',
        ],
      },
      {
        heading: '5. Free and paid plans',
        paragraphs: [
          'Some features are free and others may require a subscription, such as unlimited use of the AI coach. Prices, limits and conditions will be shown before any charge, and you may cancel in line with Brazilian consumer law.',
        ],
      },
      {
        heading: '6. Acceptable use',
        paragraphs: [
          'Do not use the app for illegal purposes, do not upload photos of other people or of minors, do not try to access other users’ data, and do not overload or try to bypass the service’s limits.',
        ],
      },
      {
        heading: '7. Intellectual property',
        paragraphs: [
          'The app, its brand and its content belong to [company legal name]. You keep the rights to your photos and data and grant us only the licence needed to provide the service.',
        ],
      },
      {
        heading: '8. Liability',
        paragraphs: [
          'To the maximum extent permitted by law, we are not liable for injuries or damages resulting from following recommendations without appropriate professional guidance, or for temporary unavailability of the service.',
        ],
      },
      {
        heading: '9. Termination',
        paragraphs: [
          'You may close your account at any time. We may suspend accounts that violate these Terms.',
        ],
      },
      {
        heading: '10. Governing law',
        paragraphs: [
          'These Terms are governed by the laws of Brazil, with jurisdiction at the consumer’s domicile. Contact: [contact@domain].',
        ],
      },
    ],
  },
}

export const LEGAL = { privacy, terms }
