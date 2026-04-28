export const OS_STATUS_LABEL: Record<string, string> = {
  WAITING_APPROVAL:  'Ag. aprovação',
  WAITING_PRODUCTION:'Ag. produção',
  IN_PRODUCTION:     'Em produção',
  FINISHED:          'Finalizado',
  CANCELED:          'Cancelado',
};

export const OS_STATUS_COLOR: Record<string, string> = {
  WAITING_APPROVAL:  'badge badge-warning',
  WAITING_PRODUCTION:'badge badge-info',
  IN_PRODUCTION:     'badge badge-purple',
  FINISHED:          'badge badge-success',
  CANCELED:          'badge badge-muted',
};

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  PENDING:  'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
};

export const QUOTE_STATUS_COLOR: Record<string, string> = {
  PENDING:  'badge badge-warning',
  APPROVED: 'badge badge-success',
  REJECTED: 'badge badge-danger',
};

export const PAY_STATUS_LABEL: Record<string, string> = {
  PENDING:  'Pendente',
  PAID:     'Pago',
  OVERDUE:  'Atrasado',
  CANCELED: 'Cancelado',
};

export const PAY_STATUS_COLOR: Record<string, string> = {
  PENDING:  'badge badge-warning',
  PAID:     'badge badge-success',
  OVERDUE:  'badge badge-danger',
  CANCELED: 'badge badge-muted',
};

export const STAGE_STATUS_LABEL: Record<string, string> = {
  PENDING:     'A iniciar',
  IN_PROGRESS: 'Em andamento',
  DONE:        'Concluída',
  BLOCKED:     'Bloqueada',
};

export const STAGE_STATUS_COLOR: Record<string, string> = {
  PENDING:     'badge badge-muted',
  IN_PROGRESS: 'badge badge-info',
  DONE:        'badge badge-success',
  BLOCKED:     'badge badge-danger',
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH:          'Dinheiro',
  BANK_TRANSFER: 'Transferência',
  PIX:           'PIX',
  CHECK:         'Cheque',
  CREDIT_CARD:   'Cartão crédito',
  DEBIT_CARD:    'Cartão débito',
  BOLETO:        'Boleto',
};

export const PAYMENT_TERMS_LABEL: Record<string, string> = {
  CASH:         'À vista',
  INSTALLMENTS: 'Parcelado',
  ON_DELIVERY:  'Na entrega',
};

export const RECURRING_FREQUENCY_LABEL: Record<string, string> = {
  WEEKLY:    'Semanal',
  MONTHLY:   'Mensal',
  QUARTERLY: 'Trimestral',
  YEARLY:    'Anual',
};
