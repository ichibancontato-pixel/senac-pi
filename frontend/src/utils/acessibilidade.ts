/** Atributos para ligar um controle de formulário à sua mensagem de erro (ver Campo.tsx). */
export function propsDeErro(id: string, erro?: string) {
  return {
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': erro ? `${id}-erro` : undefined,
  }
}
